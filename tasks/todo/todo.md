# Reorganization Task List

- [x] Move Vetor specifications to `tasks/specs/`.
- [x] Adopt the installed SDD skills as the project workflow.
- [x] Consolidate workspace guidance into `.agents/skills/`.
- [x] Align repository rules, contracts, ADRs, and SDD entrypoints.
- [x] Remove project-specific SDD automation and command wrappers.
- [x] Confirm catalog and workflow references.
- [x] Remove stale nested agent paths and unrelated XATI content.
- [x] Run the complete verification command set.
- [x] Inspect the final diff and record evidence.

## Checkpoint: Skills workflow

- [x] `spec-driven-development`
- [x] `planning-and-task-breakdown`
- [x] `sdd-implement`
- [x] `verification-before-completion`

## Evidence

- The project SDD workflow is provided by the installed skills and
  `tasks/specs/`.
- Project-specific SDD automation and command wrappers were removed.
- `npm run test`: passed for backend, frontend, and worker workspaces.
- `npm run lint`: passed with 9 warnings and no errors.
- `npm run typecheck`: passed for all workspaces.
- `npm run build`: passed for all workspaces.
- `npm run format:check`: failed on 162 formatting issues across the
  repository, including untouched runtime files.
- `npm run audit:all`: failed with 27 dependency vulnerabilities.
- Local Markdown links and `git diff --check`: passed.
