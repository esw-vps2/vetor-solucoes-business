---
name: sdd-implement
description: Deliver an approved Vetor specification through its approved plan and task breakdown. Use when implementing scoped frontend, backend, worker, infrastructure, or documentation changes with traceable tests and evidence.
---

# SDD Implement

## Required inputs

- A human-approved specification stored in `tasks/specs/`.
- A human-approved implementation plan and task breakdown.
- The relevant global contracts, workspace rules, and assigned delivery role.
- A clear validation command set for the affected workspaces.

## Process

1. Read the approved specification, plan, task, and affected contracts before changing files.
2. Implement only the current task and preserve architecture boundaries.
3. Add or update tests with the behavior change. Use the project's test framework and keep tests next to the owning behavior or transport boundary.
4. Validate external input at backend boundaries, authorize protected operations, and exclude sensitive fields from responses and logs.
5. Update API, database, product, design, architecture, or convention documentation when the approved change affects those contracts.
6. Run the relevant typecheck, lint, test, E2E, build, format, and audit commands.
7. Record exact command outcomes, changed files, unresolved limitations, and evidence for each acceptance criterion.
8. Request review and resolve blocking findings before completion.

## Verification

- Human approval of the specification, plan, and task scope is recorded.
- Tests prove the changed behavior and relevant error or security paths.
- No service crosses its database ownership boundary.
- No secrets, credentials, or sensitive response fields are added.
- All required checks have current-session evidence.

## Limitations

Do not implement a specification before human approval, invent missing product decisions, approve the specification, or expand the task into adjacent cleanup.
