# Run Sync

## States

- `pending`
- `syncing`
- `synced`
- `failed`

## Required Files

- `request.json`
- `routing.json`
- `events.jsonl`
- `result.json`

Optional:

- `spec.md`
- `spec.sync.json`
- `tasks.json`
- `verification.json`

## Transition Rules

### `pending -> syncing`

Enter when a sync attempt starts.

### `syncing -> synced`

Enter when all required remote writes succeed.

### `syncing -> failed`

Enter when any required write fails.

### `failed -> syncing`

Enter when the run is retried manually or by `@selene resume`.

## Completion

A run is remotely durable only when:

- project upsert succeeded
- run start succeeded
- spec and tasks are uploaded if present
- all required events are appended
- run finish succeeded
- `sync.json.remote_status` is `synced`
