---
id: VETOR-001
title: Import frontend layout from tmp/vetor
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-13-importar_frontend
created_at: 2026-09-13
updated_at: 2026-09-13
---

# Import frontend layout from tmp/vetor

## Context

The requester asked to copy the frontend layout from the local source tree
`tmp/vetor` into this repository.

Follow-up decisions from the same source:

- Layout includes all of the leading page: structure, copy, motion,
  interactions, assets, and metadata.
- Only the layout is imported. Delivery uses the components and design of
  that layout.
- Sections that are not part of the leading page layout are not in this
  feature.
- Everything that is not frontend work is out of scope.
- The current starter page at `/` is replaced by this leading page layout.
- Required tests are the frontend validation tests.

`tmp/vetor` is a local reference tree and is gitignored.

## Desired outcome

`/` shows the leading page layout from `tmp/vetor`. That layout matches the
source exactly and uses the source components and design. This project's
current rules remain in force for everything that is not that layout.

## In scope

- Replace the current starter page at `/` with the leading page layout from
  `tmp/vetor`.
- Import all of that leading page layout: structure, copy, motion,
  interactions, assets, and metadata.
- Use the components and design of that layout.
- Keep this project's current rules for everything that is not that layout.
- Run the frontend validation tests.

## Out of scope

- Backend, API, and database changes
- Portal work
- Sections that are not part of the `tmp/vetor` leading page layout
- Removing `tmp/vetor`
- Any work that is not frontend

## Acceptance criteria

- AC-001: `/` is replaced by the `tmp/vetor` leading page layout and matches that source layout exactly, including its structure, copy, motion, interactions, assets, and metadata.
- AC-002: Delivery uses the components and design of that leading page layout. This project's current rules remain in force for everything that is not that layout.
- AC-003: Sections that are not part of the `tmp/vetor` leading page layout are not added.
- AC-004: The frontend validation tests pass.

## User experience

The public leading page at `/` replaces the current starter page.

The visitor sees the leading page layout from `tmp/vetor`, using that
layout's components and design. The copy, motion, interactions, assets, and
metadata of that leading page are included.

No section that is not part of that leading page layout is added.

## API and integrations

No backend API change.

No integration outside the `tmp/vetor` leading page layout is added.

## Data impact

No persistent-model change.

## Security

No new security decision was supplied. Existing project security rules apply.
This feature is frontend only.

## Testing

Frontend validation tests in the `frontend` workspace:

- `npm run typecheck --workspace frontend`
- `npm run lint --workspace frontend`
- `npm run test --workspace frontend`
- `npm run build --workspace frontend`

- AC-001: frontend validation tests listed above
- AC-002: frontend validation tests listed above
- AC-003: frontend validation tests listed above
- AC-004: frontend validation tests listed above

## Delivery

Frontend workspace only. Implementation starts only after a named human sets
`status: approved`. Do not change backend, API, or database files.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-13-importar_frontend`
- Request: copy the frontend layout from `tmp/vetor` into this project,
  keeping this project's current rules.
- Known acceptance: copy the layout exactly, while keeping this project's
  current rules.
- Follow-up: layout includes all leading-page content; use that layout's
  components and design; no extra sections; everything except frontend is
  out of scope; replace `/`; frontend validation tests are required.

## Implementation evidence

- Changed: `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/globals.css`, `frontend/components/layout/`, `frontend/components/sections/`, `frontend/components/ui/button.tsx`, `frontend/package.json`. No backend, API, or database files.
- Tests: `frontend/app/page.spec.tsx`, `frontend/components/layout/header.spec.tsx`, `frontend/components/sections/services.spec.tsx`. Commands: `npm run typecheck --workspace frontend` passed; `npm run lint --workspace frontend` passed; `npm run test --workspace frontend` passed (5 tests); `npm run build --workspace frontend` passed.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
