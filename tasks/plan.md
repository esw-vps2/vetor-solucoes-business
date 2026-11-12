# Vetor SDD and Agent Reorganization Implementation Plan

> **For agentic workers:** Execute the checklist task by task. Preserve the
> approved scope and record verification evidence before completion.

**Goal:** Align the repository with the root `.agents/` registry and the
`tasks/specs/` SDD layout without changing Vetor product behavior.

**Architecture:** Keep the existing runtime workspaces and service boundaries.
Use `.agents/skills/` for shared agent skills, `.agents/sdd/` for project SDD
governance, `tasks/specs/` for feature specifications, and `docs/` for durable
product and technical contracts.

**Tech Stack:** Markdown and YAML governance files, Node.js ESM SDD automation,
npm workspaces, NestJS, Next.js, and Docker Compose.

**Spec:** The approved reorganization design in the active agent plan.

## Global Constraints

- Preserve `frontend/`, `backend/`, `worker-proxy-agent-ia/`,
  `ms-powerbi-embedded/`, and `infrastructure/`.
- Do not adopt XATI services, specifications, or product requirements.
- Do not change application behavior, API contracts, database contracts, or
  runtime infrastructure.
- Keep repository-authored guidance in English.
- Keep secrets, credentials, tokens, and private keys out of the repository.
- Require approved feature specifications before product implementation.

## Review Focus

- Every active skill catalog entry resolves to a physical `SKILL.md`.
- Every SDD and contract link resolves to the new canonical path.
- The validator reads `tasks/specs/`, ignores `_template.md`, and preserves the
  existing lifecycle and evidence rules.
- No XATI or workspace-local agent paths remain outside human-only README files.
- The migration does not modify application source or product contracts beyond
  path and governance references.

## Tasks

### Task 1: Migrate SDD artifacts

- [x] Move the Vetor specifications and template to `tasks/specs/`.
- [x] Move project SDD governance to `.agents/sdd/`.
- [x] Remove unrelated XATI specifications from `tasks/specs/`.
- [x] Preserve specification content, statuses, IDs, acceptance criteria, and
  evidence.

### Task 2: Consolidate the agent registry

- [x] Keep shared skills in `.agents/skills/`.
- [x] Merge workspace-specific frontend guidance into the frontend skill
  references.
- [x] Remove XATI-specific skill descriptions.
- [ ] Confirm catalog, profile, and workflow references against physical files.

### Task 3: Align contracts and repository guidance

- [x] Update `AGENTS.md`, Cursor rules, ADRs, contracts, SDD command, and SDD
  guide.
- [x] Update all feature-specification traceability links.
- [ ] Check relative links from `.agents/`, `.cursor/`, `docs/`, and `tasks/`.

### Task 4: Restore SDD automation

- [x] Restore the validator and its tests.
- [x] Change the canonical validation directory to `tasks/specs/`.
- [x] Add a regression test for repository validation.
- [x] Run focused SDD tests and validation.

### Task 5: Remove stale structure

- [ ] Remove obsolete nested agent trees and skill locks from the tracked
  layout.
- [ ] Confirm `.agents/` is versioned and remains excluded from Docker contexts.
- [ ] Sweep for stale paths and unrelated XATI content.

### Task 6: Verify the repository

- [ ] Run the complete applicable command set.
- [ ] Inspect the final diff for accidental application or product changes.
- [ ] Record command outcomes and unresolved limitations.

## Verification Commands

```bash
npm run sdd:validate
npm run test:sdd
npm run format:check
npm run test
npm run lint
npm run typecheck
npm run build
npm run audit:all
```
