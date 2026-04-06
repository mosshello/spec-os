# Selene Quickstart

## 1. Create local config

Copy [config.example.json](/c:/Users/mr_zh/.gemini/antigravity/skills/selene/config.example.json) to `selene/config.local.json` and fill:

- `remote_base_url`: your Supabase project URL
- `remote_token`: the same value stored as `SELENE_REMOTE_TOKEN` in Supabase Edge Functions Secrets
- `project_id`: your project identifier

Example:

```json
{
  "remote_base_url": "https://vxmdsnibzutqgdesfzgg.supabase.co",
  "remote_token": "<your token>",
  "project_id": "proj-antigravity"
}
```

## 2. Generate a demo run

```powershell
node .\selene\scripts\new_demo_run.js
```

This prints a run directory like:

```text
.ai/selene/runs/run-demo-20260406-123000
```

## 3. Dry-run locally

```powershell
node .\selene\scripts\selene_sync.js .\.ai\selene\runs\run-demo-20260406-123000 --dry-run
```

## 4. Push to remote ledger

```powershell
node .\selene\scripts\selene_sync.js .\.ai\selene\runs\run-demo-20260406-123000
```

## 5. Check result

Open the generated `sync.json` inside that run directory. A successful sync looks like:

```json
{
  "remote_status": "synced",
  "project_synced": true,
  "run_started": true,
  "spec_synced": true,
  "tasks_synced": true,
  "synced_event_count": 1,
  "run_finished": true
}
```

## Optional

If you do not want a local config file, you can use env vars instead:

```powershell
$env:SELENE_REMOTE_BASE_URL='https://vxmdsnibzutqgdesfzgg.supabase.co'
$env:SELENE_REMOTE_TOKEN='<your token>'
$env:SELENE_PROJECT_ID='proj-antigravity'
```
