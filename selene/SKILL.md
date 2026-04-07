---
name: selene
description: "Use when a task needs a single entry point: start a run, normalize a request, resume a run, inspect run history, or sync structured run data."
---

# Selene

## Responsibilities

- Start or resume a run
- Normalize the incoming request
- Assign `run_id` and `task_id`
- Route work to the next skill
- Enforce downstream execution gates
- Record structured run artifacts
- Sync run artifacts to the remote ledger

## Use When

- A complex new task is starting
- A paused task needs to resume
- A user wants to inspect a previous run
- A run needs to be synced to the remote ledger

## Do Not Use When

- The task is simple, bounded, and can be implemented directly
- The task only needs code implementation inside an existing Spec
- The task only needs project context refresh
- The task only needs repo reconnaissance

## Commands

- `@selene <goal>`
- `@selene resume <run_id>`
- `@selene inspect <run_id>`

## Inputs

At minimum:

- `goal`
- `intent`
- `complexity`
- `requires_spec`
- `requires_verification`

## Outputs

Write run artifacts under:

`/.ai/selene/runs/<run_id>/`

At minimum:

- `request.json`
- `routing.json`
- `events.jsonl`
- `result.json`

When the task requires a Spec, also record:

- `spec.sync.json`
- `routing.json.spec_path`
- `routing.json.spec_id`

When the task is implemented through `task-coder`, also record:

- `routing.json.task_id`
- `routing.json.task_path`
- `routing.json.task_result_path`
- `result.json.changed_files`
- `result.json.verification_summary`

See:

- `references/remote-ledger.md`
- `references/run-sync.md`

## Routing

Selene is an orchestration layer, not an implementation layer.

Listing a default order is not enough. Selene must explicitly invoke downstream skills, verify that each expected artifact exists, and stop with a blocked state when a gate is not met.

Before routing, Selene must classify the request as one of:

- `direct`: simple, bounded, low-risk work
- `deep`: multi-step, ambiguous, cross-file, or higher-risk work

Use `direct` when all of these are true:

- the likely edit set is 1-2 files
- the implementation boundary is obvious from the request or shallow repo inspection
- no schema migration, API contract change, or cross-system refactor is involved
- verification can be satisfied with at most 1-2 focused commands or an obvious smoke check

Use `deep` when any of these are true:

- the boundary is unclear
- the change likely spans multiple files or layers
- product or architecture choices must be made before editing
- the task needs a written verification plan before coding
- the user explicitly asks for deep research, a plan, or a Spec

Fast-path policy:

- For `direct` tasks, do not use `system-architect`.
- For `direct` tasks, do not create a formal Spec under `/.ai/specs/`.
- For `direct` tasks, prefer immediate implementation by the main agent after shallow context gathering.
- If the user explicitly asked to use Selene for a `direct` task, keep the artifacts lightweight and do not force the full deep workflow.

Approval policy for `deep` tasks:

- After `system-architect` writes the Spec, Selene must stop and request user confirmation before any code implementation begins.
- Do not treat Spec generation as approval to code.
- Accept continuation only after an explicit user confirmation such as `OK`, `approved`, `continue`, or an equivalent clear instruction.
- If the user asks questions, requests changes, or does not explicitly approve, remain in the Spec-review state.

Default order for a new implementation task:

1. `project-context`
2. `system-architect`
3. `task-coder`
4. `project-context` UPDATE

## Execution Contract

For a new implementation request, Selene must execute the route as a gated workflow instead of a chat-only recommendation.

1. Create the run directory and write `request.json` before routing any downstream skill.
2. Classify the request as `direct` or `deep` before selecting downstream skills.
3. If `.ai/project.md` is missing and repository truth matters, Selene must invoke `project-context` INIT before any architecture or implementation step.
4. If the task is `deep`, and there is no valid Spec, or `requires_spec=true`, Selene must invoke `system-architect` and wait for a written Spec under `/.ai/specs/`.
5. After a `deep` Spec is written, move the run into a Spec-review gate and ask the user to confirm the Spec before coding.
6. Only route to `task-coder` after `routing.json.spec_path` points to a valid Spec containing `spec_id`, `target_files`, `verification_plan`, and `exit_criteria`, and the user has explicitly approved that Spec.
7. For `direct` tasks, prefer immediate implementation by the main agent instead of invoking `system-architect` or `task-coder`.
8. After implementation, run `project-context` UPDATE when repository truth changed.
9. Write or update `routing.json`, `events.jsonl`, and `result.json` after every state transition.

Execution gates:

1. `project-context` INIT
    - Run when `.ai/project.md` is missing, stale, or the task begins from an unknown repository state.
   - Do not claim success unless `.ai/project.md` exists and key paths were verified.
2. `system-architect`
   - Run only for `deep` tasks.
   - Run when `requires_spec=true` or no valid Spec already exists.
   - Do not route to `task-coder` unless a valid Spec exists with:
     - `spec_id`
     - `target_files`
     - `verification_plan`
     - `exit_criteria`
   - After the Spec is written, stop and request user confirmation before any implementation step.
   - Record the canonical Spec path in `routing.json.spec_path`.
3. `task-coder`
   - Run only for `deep` tasks.
   - Run only after the Spec gate passes and the user explicitly approved the Spec.
   - Do not claim success unless code was implemented or an explicit blocked result was returned.
   - Do not skip verification; consume the `verification_plan` from the Spec.
4. `project-context` UPDATE
    - Run after implementation when repository truth changed.
    - Update only the affected sections of `.ai/project.md`.

Downstream skill loading rules:

- Naming a downstream skill in `routing.json` is not enough.
- Before claiming a route step has started, Selene must actually load and follow that skill's `SKILL.md`.
- If `project-context`, `system-architect`, or `task-coder` is selected, Selene must treat that as a real handoff, not as a reminder in chat.
- `direct` tasks should usually not select `system-architect` or `task-coder`.
- A `deep` task must not hand off from `system-architect` to `task-coder` without an explicit user approval step in between.
- If the downstream skill cannot be loaded or followed, stop and return a blocked state.

Skip rules:

- Skip `project-context` INIT only when `.ai/project.md` already exists and the task does not indicate repository drift.
- Skip `system-architect` when the task is `direct`, or when the task already includes a valid Spec.
- Skip `task-coder` for `direct` tasks, inspect, sync, metadata-only, or blocked-before-implementation runs.
- Skip `project-context` UPDATE only when no repository truth changed.

Resume rules:

- `@selene resume <run_id>` must inspect existing artifacts before choosing the next skill.
- If `result.json` already exists with a terminal status, do not re-run downstream skills unless the user explicitly asks for a retry.
- If `routing.json` points to a missing or invalid Spec, resume from `system-architect`, not `task-coder`.
- If the run is waiting for Spec approval, resume into the approval gate instead of coding automatically.

Inspect rules:

- `@selene inspect <run_id>` is read-only.
- Never invoke `task-coder` from inspect mode.

## Rules

- Keep the entry layer thin
- Do not implement feature code here
- Do not hide missing context
- Prefer structured artifacts over chat-only summaries
- Do not mark a downstream step complete without its required artifact
- Do not route to `task-coder` from a chat summary alone
- Prefer explicit blocked states over implicit skipping
- If a downstream skill is skipped, record the reason in `routing.json`
- Do not assume downstream skills will be used implicitly just because they are listed in the route
- Prefer the `direct` path for simple tasks to keep latency low
- For `deep` tasks, Spec review is a hard gate, not a courtesy message

## Artifact Contract

`request.json` must contain:

- `run_id`
- `goal`
- `intent`
- `complexity`
- `requires_spec`
- `requires_verification`
- `approval_required` for `deep` tasks

`routing.json` must contain:

- `run_id`
- `status`
- `current_step`
- `completed_steps`
- `next_step`
- `execution_mode`
- `approval_status`
- `spec_id` when a Spec is required
- `spec_path` when a Spec exists
- `task_id` when `task-coder` is selected
- `task_path` when a task artifact exists
- `skip_reasons` for every skipped downstream skill

`result.json` must contain:

- `run_id`
- `status`
- `execution_mode`
- `approval_status`
- `spec_id` when applicable
- `changed_files`
- `verification_summary`
- `human_handoff`

If `task-coder` ran, `result.json` must be derived from the `task-coder` result rather than a freeform summary.

## Blocked

Return a blocked state when:

- the goal cannot be normalized
- the required downstream skill is missing
- the run directory cannot be created
- `.ai/project.md` is required but missing after `project-context`
- a Spec is required but missing after `system-architect`
- a Spec exists but is missing required fields
- `task-coder` is requested without a valid Spec
- `task-coder` is requested before explicit user approval of a `deep` Spec
- verification is required but no `verification_plan` exists
- sync fails after retries

Use explicit blocked codes when possible:

- `[BLOCKED:PROJECT_CONTEXT_REQUIRED]`
- `[BLOCKED:MISSING_SPEC]`
- `[BLOCKED:INVALID_SPEC]`
- `[BLOCKED:SPEC_NOT_APPROVED]`
- `[BLOCKED:VERIFICATION_REQUIRED]`
- `[BLOCKED:DOWNSTREAM_SKILL_MISSING]`
