# Remote Ledger

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

## Endpoints

Current deployment target is Supabase Edge Functions:

- `POST /functions/v1/projects-upsert`
- `POST /functions/v1/runs-start`
- `POST /functions/v1/specs-upsert`
- `POST /functions/v1/tasks-upsert`
- `POST /functions/v1/events-append`
- `POST /functions/v1/runs-finish`

`selene_sync.js` accepts logical route names and maps them to these deployed slugs.

## Sync Rules

- write locally first
- sync remotely after local write succeeds
- never overwrite existing events
- retry failed syncs
- keep local files after sync
- prefer `spec.sync.json` for structured spec upload
