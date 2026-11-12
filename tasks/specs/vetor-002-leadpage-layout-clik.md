---
id: VETOR-002
title: Restyle leadpage layout after ClikSofthouse
status: in_review
source_kind: human_prompt
source_reference: chat-2026-09-14-layout-clik
created_at: 2026-09-14
updated_at: 2026-09-14
---

# Restyle leadpage layout after ClikSofthouse

## Context

The requester asked to copy the public layout of
[https://www.cliksofthouse.com.br/](https://www.cliksofthouse.com.br/) while
keeping the VETOR product context.

VETOR-001 imported the editorial leadpage from `tmp/vetor`. This specification
changes only the visual structure of `/`. Approved copy, claims, routes,
mailto capture, and section composition stay in `docs/product.md`.

## Desired outcome

`/` keeps the VETOR leadpage composition and content. The visual structure
follows the ClikSofthouse landing pattern: dark grid hero, pill eyebrows,
italic accent words, check-list support, metric strip, feature rows, window
mockups, 2x2 dark cards, and a dark CTA card on a light band.

Brand tokens stay navy and lime. No ClikSofthouse copy, logos, products, or
claims appear.

## In scope

- Restyle Header, Hero, Manifesto, Capabilities, Origin, Projects, Impact,
  Final CTA, and Footer to the ClikSofthouse layout pattern.
- Keep the composed section order and in-page anchors from `docs/product.md`.
- Keep approved Portuguese UI copy, impact metrics, case studies, and
  `mailto:contato@vetor.tech`.
- Update `docs/design.md` so the implemented layout is the visual reference.
- Keep existing interactive behavior: header navigation, hero flow, vector
  trail, capability tabs and accordion, and impact counters.
- Update frontend tests that assert visible structure.

## Out of scope

- Backend, API, and database changes
- Portal work
- New marketing sections
- Client logos or social profile URLs
- Stored lead forms, WhatsApp, or third-party chat
- New claims, metrics, or case studies
- Replacing VETOR brand colors, logo files, or Inter

## Acceptance criteria

- AC-001: `/` keeps the approved VETOR composition, copy, claims, and
  `mailto:contato@vetor.tech` lead capture.
- AC-002: The leadpage visual structure follows the ClikSofthouse pattern
  described in Desired outcome, using navy and lime tokens.
- AC-003: No ClikSofthouse product names, copy, logos, or claims appear.
- AC-004: Header anchors, capability tabs, and frontend validation tests
  continue to pass.

## User experience

A visitor still reads VETOR as a custom software studio. The page looks like a
product landing: centered section intros, feature rows, framed mockups, and a
contained final CTA. Navigation, method, capabilities, origin, projects, and
contact remain the same surfaces.

## API and integrations

No backend API change.

Google Fonts Inter and `mailto:contato@vetor.tech` remain the only adopted
integrations.

## Data impact

No persistent-model change.

## Security

No new public route, form, or secret. Existing frontend security rules apply.
Lead capture stays a `mailto:` action.

## Testing

Frontend validation tests in the `frontend` workspace:

- `npm run typecheck --workspace frontend`
- `npm run lint --workspace frontend`
- `npm run test --workspace frontend`
- `npm run build --workspace frontend`

- AC-001: `frontend/app/page.spec.tsx` asserts VETOR headings, anchors, and
  mailto capture.
- AC-002: visual review of `/` against the ClikSofthouse layout pattern and
  `docs/design.md`.
- AC-003: `frontend/app/page.spec.tsx` asserts unused extracted sections stay
  off `/` and ClikSofthouse names are absent.
- AC-004: `frontend/components/layout/header.spec.tsx` and
  `frontend/components/sections/services.spec.tsx` plus the frontend
  validation commands listed above.

## Delivery

Frontend workspace and the design contract. Implementation starts only after a
named human sets `status: approved`. Do not change backend, API, or database
files.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-14-layout-clik`
- Request: copy the ClikSofthouse layout and keep the VETOR site context.
- Known acceptance: VETOR copy and claims stay; layout structure changes;
  no new sections or third-party brand assets.

## Implementation evidence

- Changed: not recorded
- Tests: not recorded

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
