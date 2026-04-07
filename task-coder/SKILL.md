---
name: task-coder
description: "Use when a valid Spec already exists and the task now needs implementation, verification, self-repair, and structured result output within an explicit file boundary."
---

# Task Coder

## Responsibilities

- Read the Spec
- Edit only `target_files`
- Implement the required code
- Run `verification_plan`
- Repair failures within scope
- Run a final self-review
- Output a structured result

## Use When

- A valid Spec is already available
- The user has explicitly approved that Spec for implementation
- The task has explicit `target_files`
- The task has an explicit `verification_plan`

## Do Not Use When

- The task is a simple direct-edit request that does not need a Spec
- The task still needs architecture work
- The task boundary is not explicit
- The Spec is missing required fields

## Inputs

- `.ai/project.md`
- A valid Spec

A valid Spec must include:

- `spec_id`
- `target_files`
- `verification_plan`
- `exit_criteria`

For `deep` tasks, user approval of the Spec is also required before implementation starts.

If any required Spec fields are missing, return `[BLOCKED:INVALID_SPEC]`.
If the Spec exists but has not been explicitly approved by the user, return `[BLOCKED:SPEC_NOT_APPROVED]`.

## Execution

Run in this order:

1. Read the Spec
2. Confirm the Spec has explicit user approval for implementation
3. Implement the change
4. Run verification
5. Repair failures
6. Run self-review
7. Write the result
8. Trigger or request `project-context` UPDATE

## Verification

Run the commands listed in `verification_plan`. Do not replace them with stack defaults.

Suggested order:

1. static checks
2. compile or type checks
3. unit tests
4. integration tests
5. UI or E2E tests
6. MCP or tooling smoke tests

Retry failures at most 3 times.

If a tool or command is unavailable, record `not_available` in the result.

## Scope Rules

- Edit only `target_files`
- Do not expand scope silently
- Do not refactor unrelated code
- Return `[BLOCKED:OUT_OF_SCOPE]` if the fix requires new files outside the Spec
- Do not absorb simple ad hoc tasks that should have been handled directly by the main agent
- Do not begin coding on a `deep` task from Spec text alone; explicit user approval is required

## Self Review

Check at least:

- out-of-scope edits
- hardcoded URLs, IPs, or secrets
- undeclared dependencies
- Spec drift
- missing verification
- conflict with `.ai/project.md`

## Result

At minimum output:

- `spec_id`
- `status`
- `changed_files`
- `verification_summary`
- `retry_count`
- `human_handoff`

## Blocked

Return a blocked state when:

- the Spec is invalid
- the Spec has not been explicitly approved by the user
- the boundary is unclear
- repository truth conflicts with the task
- verification cannot be completed
- human product or architecture input is required
