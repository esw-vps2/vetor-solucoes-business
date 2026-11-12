# Reorganization Task List

- [x] Move Vetor specifications to `tasks/specs/`.
- [x] Move SDD governance to `.agents/sdd/`.
- [x] Consolidate workspace guidance into `.agents/skills/`.
- [x] Align repository rules, contracts, ADRs, and SDD entrypoints.
- [x] Restore and adapt SDD validation automation.
- [x] Confirm catalog and workflow references.
- [x] Remove stale nested agent paths and unrelated XATI content.
- [x] Run the complete verification command set.
- [x] Inspect the final diff and record evidence.

## Checkpoint: Governance migration

- [x] `npm run sdd:validate`
- [x] `node --test automation/sdd/test/validate-specs.test.mjs`
- [ ] `npm run format:check`

## Checkpoint: Repository verification

- [x] `npm run test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] `npm run audit:all`

## Evidence

- `npm run sdd:validate`: passed; 41 specifications validated.
- `npm run test:sdd`: passed; 11 tests passed.
- `npm run format:check`: failed; 162 files require formatting, including
  untouched runtime files. No unrelated formatter-only changes were applied.
- `npm run test`: passed; backend, frontend, worker, and SDD tests passed.
- `npm run lint`: passed with 9 warnings and no errors.
- `npm run typecheck`: passed for all workspaces.
- `npm run build`: passed for all workspaces.
- `npm run audit:all`: failed; npm reported 27 dependency vulnerabilities.
- `git diff --check`: passed.
- Markdown link check: passed; no broken local links found.
