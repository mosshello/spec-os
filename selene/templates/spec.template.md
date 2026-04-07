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
  # Fill this section with project-specific commands.
  # Choose commands based on the detected stack.
  # Examples:
  # Node / TypeScript: pnpm lint / pnpm typecheck / pnpm test
  # Python: ruff check . / mypy . / pytest
  # Go: gofmt -l . / go vet ./... / go test ./...
  # Rust: cargo check / cargo clippy --all-targets --all-features -- -D warnings / cargo test
  # Java: ./mvnw test / ./gradlew test
  - name: <verification-name>
    command: "<project-specific command>"
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

- Explain why these commands fit the detected stack and this change.
