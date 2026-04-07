---
name: repo-map-generator
description: "Use when a task needs targeted repository reconnaissance for a specific module or directory. Do not use it as the default project bootstrap step."
---

# Repo Map Generator

## Responsibilities

- Inspect a narrow directory or module
- Extract lightweight structure
- Return focused context for downstream design work

## Use When

- `system-architect` needs local module detail
- A specific directory needs structural inspection
- Full file loading would be too expensive

## Do Not Use When

- The task only needs `.ai/project.md`
- The task is just starting and needs broad project understanding
- The request asks for a whole-repo scan

## Rules

- Keep the scope narrow
- Prefer specific directories over the repository root
- Return structure, not full file dumps

## Blocked

Return a blocked state when:

- the target path is not explicit
- the requested scope is effectively the whole repository
