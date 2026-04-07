---
name: project-context
description: "Use when a task needs repository truth: initialize, read, or update `.ai/project.md`, verify key paths, or detect drift in long-lived project context."
---

# Project Context

## Responsibilities

- Initialize `.ai/project.md`
- Read `.ai/project.md`
- Verify recorded paths still exist
- Maintain project status and last verification time
- Update module records, ADRs, and change notes

## Use When

- A project has no `.ai/project.md`
- A task is starting and needs repository context
- A task has finished and the repository record must be updated
- A user wants to inspect the current project state

## Do Not Use When

- The task only needs a feature Spec
- The task only needs code changes
- The task only needs targeted repo exploration

## Repo Truth

`project-context` is the long-lived repository record.

It should describe stable facts:

- current stack
- key modules
- critical entry points
- ADRs
- external contracts

It should not become a chat log or a speculative roadmap.

## Inputs

- Repository root
- Known entry files or directories
- Task result, when running UPDATE

## Output

Write:

`/.ai/project.md`

At minimum include:

- `status`
- `last-verified`
- stack summary
- key modules
- ADRs
- external contracts

## Status Rules

- AI may only write `status: draft`
- `status: approved` is reserved for human review
- Approved files may be extended, not rewritten wholesale

## Rules

- Scan shallowly during INIT
- Verify key paths before writing them
- Prefer local updates over full rewrites
- Return `[DRIFT_DETECTED]` when recorded paths no longer match the repo

## Blocked

Return a blocked state when:

- key paths cannot be verified
- `.ai/project.md` is structurally invalid
- an approved file would need a full rewrite
