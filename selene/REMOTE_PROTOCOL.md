# Selene Remote Protocol

## Purpose

Local run files are workspace cache.

Remote storage is the long-term ledger across projects, editors, and agents.

## Local Layout

```text
.ai/selene/runs/run-YYYYMMDD-001/
  request.json
  routing.json
  spec.md
  spec.sync.json
  tasks.json
  events.jsonl
  verification.json
  result.json
  sync.json
```

## Remote Objects

- `projects`
- `runs`
- `specs`
- `tasks`
- `events`
- `artifacts`

## API Endpoints

Current deployment target is Supabase Edge Functions. The effective endpoint slugs are:

- `POST /functions/v1/projects-upsert`
- `POST /functions/v1/runs-start`
- `POST /functions/v1/specs-upsert`
- `POST /functions/v1/tasks-upsert`
- `POST /functions/v1/events-append`
- `POST /functions/v1/runs-finish`

`selene_sync.js` still accepts the logical route names below and maps them to the deployed Supabase slugs.

### `POST /projects/upsert`

Upserts a project record.

### `POST /runs/start`

Creates or resumes a run record.

Request body:

```json
{
  "run_id": "run-20260404-001",
  "project_id": "proj-antigravity",
  "goal": "Add age field to user profile",
  "intent": "schema_change",
  "status": "running",
  "base_commit": "abc123",
  "branch": "selene/run-20260404-001",
  "actor_id": "cursor-ai-01",
  "editor": "cursor"
}
```

### `POST /specs/upsert`

Uploads the machine-readable Spec and its markdown content.

### `POST /tasks/upsert`

Creates or updates split tasks for multi-actor execution.

### `POST /events/append`

Appends a new immutable event.

Request body:

```json
{
  "run_id": "run-20260404-001",
  "task_id": "task-user-age-backend",
  "actor_id": "cursor-ai-01",
  "step": "verification",
  "status": "failed",
  "failure_type": "verification_failed",
  "payload_json": {
    "command": "pnpm test --filter user",
    "stderr": "..."
  }
}
```

### `POST /runs/finish`

Closes a run.

Request body:

```json
{
  "run_id": "run-20260404-001",
  "status": "success",
  "finished_at": "2026-04-04T22:40:00+08:00"
}
```

### `POST /artifacts/presign`

Returns an upload URL for logs, screenshots, reports, and test outputs.

### `GET /runs/:run_id`

Returns the run summary, spec, tasks, and events.

### `GET /projects/:project_id/runs`

Returns runs for a project.

## Sync Rules

- write locally first
- sync remotely after local write succeeds
- never overwrite existing events
- retry failed syncs
- keep local files after sync
- prefer `spec.sync.json` for structured spec upload

## Sync States

`sync.json` should use:

- `pending`
- `syncing`
- `synced`
- `failed`

## Conflict Rules

- `run_id` is globally unique
- `task_id` is globally unique
- events are append-only
- one `task_id` can only have one active `owner`
- remote data wins for cross-editor reconciliation
