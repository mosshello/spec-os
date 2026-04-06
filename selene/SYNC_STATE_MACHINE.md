# Selene Sync State Machine

## Purpose

Define how local run artifacts are promoted to the remote ledger.

## States

### `pending`

Local files exist and have not been uploaded.

### `syncing`

An upload attempt is in progress.

### `synced`

All required run data has been accepted by the remote ledger.

### `failed`

The last sync attempt failed.

## Required Files

- `request.json`
- `routing.json`
- `events.jsonl`
- `result.json`

Optional:

- `spec.md`
- `tasks.json`
- `verification.json`

## Transition Rules

### `pending -> syncing`

Enter when:

- required local files exist
- a sync attempt starts

### `syncing -> synced`

Enter when:

- remote API accepts all required objects
- remote identifiers are persisted into `sync.json`

### `syncing -> failed`

Enter when:

- any required API call fails
- artifact upload fails
- network timeout occurs

### `failed -> syncing`

Enter when:

- retry is triggered manually
- retry is triggered by `@selene resume <run_id>`
- retry is triggered by background sync

## Retry Rules

- append events locally even while remote sync is failing
- increment `retry_count` after each failed sync attempt
- preserve `last_error`
- do not drop run data on sync failure

## Completion

A run is remotely durable only when:

- `runs/start` succeeded
- spec and tasks are uploaded if present
- all required events are appended
- `runs/finish` succeeded
- `sync.json.remote_status` is `synced`

For the current Supabase deployment, these logical steps resolve to:

- `projects/upsert` -> `projects-upsert`
- `runs/start` -> `runs-start`
- `specs/upsert` -> `specs-upsert`
- `tasks/upsert` -> `tasks-upsert`
- `events/append` -> `events-append`
- `runs/finish` -> `runs-finish`
