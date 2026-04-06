---
spec_id: spec-<feature>-v1
goal: "<user goal>"
intent: "<bugfix|schema_change|api_change|ui_change|refactor|mcp_tooling|test_only>"
status: draft
target_files:
  - path/to/file.ext
out_of_scope:
  - "Anything not listed in target_files"
verification_plan:
  - name: lint
    command: "pnpm lint"
    required: true
  - name: typecheck
    command: "pnpm typecheck"
    required: true
exit_criteria:
  - "All required verification commands pass"
  - "No out-of-scope edits"
split_tasks:
  - task_id: task-<feature>-core
    owner: null
    target_files:
      - path/to/file.ext
open_questions:
  - ""
human_decisions:
  - ""
---

# Summary

Describe the feature or change in 2-5 concise bullet points.

## Constraints

- Keep edits inside `target_files`.
- Do not modify unrelated architecture.

## Implementation Notes

- Concrete implementation requirements go here.

## Verification Notes

- Explain why the listed verification commands are sufficient.
