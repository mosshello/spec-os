---
name: selene
description: 统一入口。负责标准化请求、分配 run_id、路由技能链、记录运行结果。
---

# Selene

## Responsibilities

- 接收统一入口命令
- 标准化请求
- 分配 `run_id`
- 路由到下游技能
- 记录运行过程和结果
- 支持 `resume` 和 `inspect`

## Commands

- `@selene <goal>`
- `@selene resume <run_id>`
- `@selene inspect <run_id>`

## Request Schema

至少包含：

- `goal`
- `intent`
- `run_id`
- `requires_spec`
- `requires_verification`

## Routing

默认顺序：

1. `project-context`
2. `system-architect`
3. `task-coder`
4. `project-context` UPDATE

## Run Ledger

写入 `.ai/selene/runs/`。

最少包含：

- `request.json`
- `routing.json`
- `events.jsonl`
- `result.json`

如果生成 Spec，再附加：

- `spec.md`
- `tasks.json`
- `verification.json`

## Multi-Actor Rules

- 每个任务分配 `task_id`
- 同一 `task_id` 同一时刻只能有一个 `owner`
- 记录 `base_commit`
- 尽量避免 `target_files` 重叠

## Failure Types

- `ambiguous_requirement`
- `missing_context`
- `bad_spec`
- `wrong_target_files`
- `edit_out_of_scope`
- `verification_failed`
- `tool_failure`
- `mcp_failure`
- `needs_human_decision`
