#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_SYNC = {
  remote_status: 'pending',
  remote_run_id: null,
  project_synced: false,
  run_started: false,
  spec_synced: false,
  tasks_synced: false,
  synced_event_count: 0,
  run_finished: false,
  last_sync_at: null,
  retry_count: 0,
  last_error: null,
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    fail('Usage: node selene/scripts/selene_sync.js <run-dir> [--dry-run] [--config <path>]');
  }

  const runDir = path.resolve(process.cwd(), args[0]);
  const dryRun = args.includes('--dry-run');
  const configPath = readArgValue(args, '--config');

  if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    fail(`Run directory not found: ${runDir}`);
  }

  if (typeof fetch !== 'function') {
    fail('Global fetch is not available. Use Node.js 18+ or provide a compatible runtime.');
  }

  const config = loadConfig(configPath);
  const files = resolveRunFiles(runDir);
  const syncState = loadJson(files.sync, DEFAULT_SYNC);
  const request = loadRequiredJson(files.request, 'request.json');
  loadOptionalJson(files.routing);
  const result = loadOptionalJson(files.result);
  const specSync = loadOptionalJson(files.specSync);
  const specMarkdown = loadOptionalText(files.specMarkdown);
  const tasks = loadTasks(files.tasks);
  const events = loadJsonl(files.events);

  const runId = request.run_id || (result && result.run_id) || path.basename(runDir);
  const projectId = request.project_id || config.projectId;

  if (!projectId) {
    fail('Missing project_id. Put it in request.json or SELENE_PROJECT_ID.');
  }

  const projectPayload = {
    project_id: projectId,
    name: request.project_name || projectId,
    repo_url: request.repo_url || null,
    default_branch: request.default_branch || null,
  };

  const runPayload = {
    run_id: runId,
    project_id: projectId,
    spec_id: request.spec_id || (specSync && specSync.spec_id) || null,
    goal: request.goal,
    intent: request.intent,
    status: result ? result.status || 'running' : 'running',
    base_commit: request.base_commit || null,
    branch: request.branch || null,
    actor_id: request.actor_id || null,
    editor: request.editor || null,
  };

  try {
    syncState.remote_status = 'syncing';
    syncState.remote_run_id = runId;
    syncState.last_error = null;
    writeJson(files.sync, syncState);

    if (!syncState.project_synced) {
      await postJson(config, '/projects/upsert', projectPayload, dryRun);
      syncState.project_synced = true;
      writeJson(files.sync, syncState);
    }

    if (!syncState.run_started) {
      await postJson(config, '/runs/start', runPayload, dryRun);
      syncState.run_started = true;
      writeJson(files.sync, syncState);
    }

    if (!syncState.spec_synced) {
      const specPayload = buildSpecPayload({
        projectId,
        runId,
        request,
        specSync,
        specMarkdown,
        tasks,
      });

      if (specPayload) {
        await postJson(config, '/specs/upsert', specPayload, dryRun);
      }

      syncState.spec_synced = true;
      writeJson(files.sync, syncState);
    }

    if (!syncState.tasks_synced && tasks.length > 0) {
      for (const task of tasks) {
        const payload = {
          ...task,
          run_id: task.run_id || runId,
          spec_id: task.spec_id || runPayload.spec_id,
        };
        await postJson(config, '/tasks/upsert', payload, dryRun);
      }
      syncState.tasks_synced = true;
      writeJson(files.sync, syncState);
    }

    if (events.length > syncState.synced_event_count) {
      const pendingEvents = events.slice(syncState.synced_event_count);
      for (const event of pendingEvents) {
        const payload = {
          ...event,
          run_id: event.run_id || runId,
        };
        await postJson(config, '/events/append', payload, dryRun);
        syncState.synced_event_count += 1;
        writeJson(files.sync, syncState);
      }
    }

    if (!syncState.run_finished && result) {
      const finishPayload = {
        run_id: runId,
        status: result.status || 'success',
        finished_at: result.finished_at || new Date().toISOString(),
      };
      await postJson(config, '/runs/finish', finishPayload, dryRun);
      syncState.run_finished = true;
      writeJson(files.sync, syncState);
    }

    syncState.remote_status = dryRun ? 'pending' : 'synced';
    syncState.last_sync_at = new Date().toISOString();
    writeJson(files.sync, syncState);
    console.log(`Synced run ${runId}${dryRun ? ' (dry-run)' : ''}`);
  } catch (error) {
    syncState.remote_status = 'failed';
    syncState.retry_count += 1;
    syncState.last_error = error.message;
    writeJson(files.sync, syncState);
    fail(error.message);
  }
}

function loadConfig(configPath) {
  const fileConfig = loadLocalConfig(configPath);
  const baseUrl = process.env.SELENE_REMOTE_BASE_URL || fileConfig.remote_base_url || null;
  const token = process.env.SELENE_REMOTE_TOKEN || fileConfig.remote_token || null;
  const projectId = process.env.SELENE_PROJECT_ID || fileConfig.project_id || null;

  if (!baseUrl) {
    fail('Missing SELENE_REMOTE_BASE_URL. Set env vars or provide selene/config.local.json.');
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    token,
    projectId,
  };
}

function loadLocalConfig(configPath) {
  const candidates = [];

  if (configPath) {
    candidates.push(path.resolve(process.cwd(), configPath));
  }

  candidates.push(
    path.resolve(process.cwd(), 'selene/config.local.json'),
    path.resolve(process.cwd(), '.ai/selene/config.local.json'),
  );

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    return loadJson(candidate, {});
  }

  return {};
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/functions/v1')) {
    return trimmed;
  }
  return `${trimmed}/functions/v1`;
}

function readArgValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx < 0) return null;
  return args[idx + 1] || null;
}

function resolveRunFiles(runDir) {
  return {
    request: path.join(runDir, 'request.json'),
    routing: path.join(runDir, 'routing.json'),
    specMarkdown: path.join(runDir, 'spec.md'),
    specSync: path.join(runDir, 'spec.sync.json'),
    tasks: path.join(runDir, 'tasks.json'),
    events: path.join(runDir, 'events.jsonl'),
    result: path.join(runDir, 'result.json'),
    sync: path.join(runDir, 'sync.json'),
  };
}

function buildSpecPayload({ projectId, runId, request, specSync, specMarkdown, tasks }) {
  if (specSync) {
    return {
      ...specSync,
      project_id: specSync.project_id || projectId,
      run_id: specSync.run_id || runId,
      content_md: specSync.content_md || specMarkdown || '',
    };
  }

  if (!specMarkdown) {
    return null;
  }

  const scalars = parseFrontmatterScalars(specMarkdown);
  return {
    spec_id: scalars.spec_id || request.spec_id || `spec-${runId}`,
    project_id: projectId,
    run_id: runId,
    goal: scalars.goal || request.goal || '',
    intent: scalars.intent || request.intent || 'unknown',
    status: scalars.status || 'draft',
    target_files: collectTaskTargetFiles(tasks),
    verification_plan: collectTaskVerificationPlan(tasks),
    exit_criteria: [],
    split_tasks: tasks,
    content_md: specMarkdown,
  };
}

function collectTaskTargetFiles(tasks) {
  const values = new Set();
  for (const task of tasks) {
    for (const file of task.target_files || []) {
      values.add(file);
    }
  }
  return Array.from(values);
}

function collectTaskVerificationPlan(tasks) {
  const items = [];
  for (const task of tasks) {
    for (const step of task.verification_plan || []) {
      items.push(step);
    }
  }
  return items;
}

function parseFrontmatterScalars(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('- ') || line.endsWith(':')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    result[key] = value === 'null' ? null : value;
  }
  return result;
}

function loadTasks(filePath) {
  const json = loadOptionalJson(filePath);
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.tasks)) return json.tasks;
  return [json];
}

function loadRequiredJson(filePath, name) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${name}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return JSON.parse(JSON.stringify(fallback));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadOptionalText(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function loadJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`Invalid JSONL at ${path.basename(filePath)} line ${index + 1}: ${error.message}`);
    }
  });
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function postJson(config, endpoint, payload, dryRun) {
  const remotePath = normalizeEndpoint(endpoint);

  if (dryRun) {
    console.log(`[dry-run] POST ${remotePath}`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(`${config.baseUrl}${remotePath}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${remotePath}: ${text}`);
  }
}

function normalizeEndpoint(endpoint) {
  const cleaned = endpoint.replace(/^\/+/, '');
  const mapped = {
    'projects/upsert': 'projects-upsert',
    'runs/start': 'runs-start',
    'specs/upsert': 'specs-upsert',
    'tasks/upsert': 'tasks-upsert',
    'events/append': 'events-append',
    'runs/finish': 'runs-finish',
  };

  return `/${mapped[cleaned] || cleaned}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main().catch((error) => fail(error.message));
