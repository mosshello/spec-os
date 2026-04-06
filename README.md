# SpecOS

SpecOS is a lightweight skill-based workflow for turning a general AI coding assistant into a more controlled delivery loop.

The current recommended architecture is a three-skill loop plus one entry point:

- `Selene`: unified entry, routing, run ledger, orchestration
- `project-context`: persistent project context and status guardrails
- `system-architect`: machine-readable Spec generation
- `task-coder`: implementation, verification, self-repair, self-review

## Why This Exists

Most AI coding workflows fail for one of four reasons:

- the project context is unstable
- the implementation scope is too broad
- verification is optional
- no structured record survives after the chat ends

SpecOS addresses those problems by separating design from execution and by requiring every task to flow through a Spec.

## Recommended Workflow

1. `Selene` receives the user goal.
2. `project-context` loads or initializes `.ai/project.md`.
3. `system-architect` generates a machine-readable Spec in `.ai/specs/`.
4. `task-coder` implements only within `target_files`.
5. `task-coder` runs verification, self-repairs, and self-reviews.
6. `project-context` updates the project record.
7. `Selene` writes a run record for analysis and future model training.

## Current Skill Set

### `project-context`

Maintains `.ai/project.md` as the long-lived project memory.

### `system-architect`

Generates machine-readable Specs with:

- `spec_id`
- `target_files`
- `verification_plan`
- `exit_criteria`
- task split guidance for multi-actor execution

### `task-coder`

Executes the Spec and now absorbs the responsibilities that were previously split across:

- test execution
- self-repair
- lightweight security review
- scope enforcement

### `repo-map-generator`

Optional deep recon tool for local module inspection only.

It must not be used as the default project bootstrap step.

### `Selene`

The unified front door for the workflow. It should:

- standardize user requests
- assign run IDs and task IDs
- route work to the right skills
- record structured execution history
- support future analytics and training

## Design Rules

### 1. Specs Must Be Executable

A valid Spec is not a vague design memo. It must contain machine-readable structure that downstream skills can enforce.

### 2. Verification Is Mandatory

No task is complete until verification and self-review are finished.

### 3. Scope Must Be Explicit

All implementation must stay inside `target_files`. If the task cannot be completed within those files, the run must stop and request a new Spec.

### 4. Runs Must Be Recorded

Every task should produce structured run artifacts so the team can:

- inspect failures
- compare editors and agents
- build evaluation datasets
- improve prompts and routing

## Suggested Run Ledger Layout

```text
.ai/
  project.md
  specs/
  selene/
    templates/
    runs/
      index.jsonl
      run-YYYYMMDD-001/
        request.json
        routing.json
        spec.md
        tasks.json
        events.jsonl
        verification.json
        result.json
```

## Status

This repository is currently in a workflow-definition stage.

The core design direction is:

- fewer skills
- stronger boundaries
- machine-readable Specs
- integrated verification
- structured run data for future analysis
