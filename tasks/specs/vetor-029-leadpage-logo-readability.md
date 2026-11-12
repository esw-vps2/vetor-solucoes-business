---
id: VETOR-029
title: Leadpage logo subtitle readability
status: approved
source_kind: human_prompt
source_reference: chat-2026-10-24-leadpage-logo-readability
created_at: 2026-10-24
updated_at: 2026-10-24
---

# Leadpage logo subtitle readability

## Context

The public leadpage header currently renders
`frontend/public/brand/logo_vetor_dark.png` with the approved inverted-logo
treatment. The current image uses intrinsic dimensions `180 × 54` and a
responsive rendered height of `44px` below `lg` and `48px` from `lg`.

The intake evidence reports a rendered element position of `top: 20px`,
`left: 40px`, `width: 106px`, and `height: 44px`. At that size, the
`BUSINESS & TECHNOLOGY` wording contained in the approved asset is not
readable enough.

The existing header, asset, typography, colors, responsive behavior, and
accessibility requirements are recorded in `docs/design.md`. The requested
change is a visual adjustment to the existing leadpage header, not a new
brand treatment.

## Desired outcome

A visitor can read the `BUSINESS & TECHNOLOGY` wording beneath `VETOR` in the
leadpage header while the existing logo asset, brand identity, header
behavior, and consolidated VETOR visual system remain unchanged.

## In scope

- Increase the rendered size of the existing leadpage header logo.
- Preserve the approved dark logo asset and its inverted treatment on the navy
  header.
- Preserve the logo aspect ratio, accessible alternative text, home-link
  behavior, fixed header, navigation, scroll compaction, and mobile menu.
- Verify the logo in the existing mobile and desktop responsive contexts.
- Record the final shared header sizing in `docs/design.md` during approved
  delivery if the implementation confirms it as a durable visual decision.

## Out of scope

- Editing, replacing, cropping, or redrawing the logo asset.
- Rendering `BUSINESS & TECHNOLOGY` as separate HTML text or introducing a
  second logo treatment.
- Changing the VETOR brand wording, colors, typography, or logo artwork.
- Changing header navigation, header destinations, leadpage sections, footer
  branding, or portal branding.
- Backend, API, database, authentication, authorization, persistence, or
  external-integration changes.

## Acceptance criteria

- AC-001: The leadpage header continues to use
  `frontend/public/brand/logo_vetor_dark.png` with the existing `alt="VETOR"`
  identity, without modifying or replacing the asset.
- AC-002: The `BUSINESS & TECHNOLOGY` wording contained in the logo is
  readable in the existing supported responsive contexts and in both the
  resting and scrolled header states. Visual review at those contexts is the
  acceptance method; no separate numeric threshold is introduced.
- AC-003: The logo may be larger than the current rendering, but it keeps its
  aspect ratio and does not overlap the header navigation, actions, mobile
  menu control, or page content at the existing responsive breakpoints.
- AC-004: The fixed header, navy glass treatment, responsive gutters,
  navigation links, scroll compaction, active-section behavior, and mobile
  menu continue to behave as defined in `docs/design.md`.
- AC-005: The change adds no route, API request, persistence behavior,
  authentication flow, authorization behavior, or external integration.

## User experience

The existing fixed leadpage header remains full width with the approved
navy-glass surface, `z-50` stacking, backdrop blur, responsive gutters, and
the current navigation order. The same approved logo remains the first
interactive element in the header.

The design decision for this specification is to render the logo at `h-14` below `lg`
and `lg:h-16` from `lg`, with `w-auto`. This increases the available size for
the subtitle without changing the asset, its proportions, or its content.
The existing resting and scrolled header padding remains in place so the
header keeps its current spacing rhythm and compact-scroll behavior.

The logo remains visible in the header when the mobile navigation overlay is
closed. The mobile menu, desktop links, contact action, portal action, focus
behavior, and reduced-motion behavior are unchanged.

## API and integrations

No API or integration change. The browser continues to load the approved
static logo asset through the existing Next.js image component.

## Data impact

No persistent-model change. No visitor, identity, or logo-related data is
collected, stored, transmitted, or logged by this feature.

## Security

No new security policy or trust boundary is introduced. The feature uses an
existing public static asset and does not accept input, expose secrets, add a
route, or change authentication or authorization. Existing frontend security
rules continue to apply.

No security decision is currently pending.

## Testing

Approved delivery must include:

- A frontend component test that preserves the approved logo source,
  alternative text, and header link behavior.
- Visual verification of the logo at the existing mobile and desktop
  responsive contexts, including resting and scrolled header states.
- Regression verification for desktop navigation, the mobile menu, active
  section behavior, keyboard focus, and reduced-motion behavior.
- The applicable frontend commands:
  `npm run typecheck --workspace frontend`,
  `npm run lint --workspace frontend`,
  `npm run test --workspace frontend`, and
  `npm run build --workspace frontend`.
- `spec-driven-development` and `npm run format:check`.

Planned acceptance-test mapping:

- AC-001: `frontend/components/layout/header.spec.tsx`.
- AC-002: visual verification at the existing responsive contexts.
- AC-003: visual verification of header layout and responsive overflow.
- AC-004: `frontend/components/layout/header.spec.tsx` and the applicable
  frontend validation commands.
- AC-005: static inspection confirming no backend, API, database, or
  integration changes.

## Delivery

This is a frontend-only change to the leadpage header and its related
frontend test coverage. The human-supplied goal command authorized the
specification's transition to `approved` and implementation within the
recorded scope.

Expected approved-delivery files are
`frontend/components/layout/header.tsx`,
`frontend/components/layout/header.spec.tsx`, and `docs/design.md` if the
final header sizing becomes a durable shared decision. No backend, API,
database, environment, or security-contract files should change.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-24-leadpage-logo-readability`.
- Request: make the leadpage logo large enough for the wording below VETOR to
  be readable, keep the logo as it is, and allow increasing its size if
  necessary.
- Intake evidence: the current header image uses
  `logo_vetor_dark.png`, `alt="VETOR"`, `180 × 54` intrinsic dimensions,
  `h-11 w-auto brightness-0 invert lg:h-12`, and the supplied DOM position
  and size.
- Existing contracts consulted: `docs/design.md`, `docs/product.md`,
  `docs/conventions.md`, `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`,
  `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`, and `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`.
- Approval signal: the human-supplied `/goal
@tasks/specs/vetor-029-leadpage-logo-readability.md` command on
  2026-10-24.

## Open questions

No unresolved business or security questions remain for this scoped delivery.
Legibility is validated by visual review at the existing responsive contexts,
without adding a new numeric requirement.

## Decisions recorded for validation

- Keep `frontend/public/brand/logo_vetor_dark.png` unchanged.
- Keep `BUSINESS & TECHNOLOGY` inside the image asset rather than adding
  separate page copy.
- Use proportional rendering with `h-14` below `lg` and `lg:h-16` from `lg`
  as the initial design decision.
- Use visual review at the existing responsive contexts as the legibility
  acceptance method; do not add a separate numeric threshold.
- Keep the existing header structure, padding rhythm, navigation, scroll
  behavior, mobile menu, and accessibility behavior.
- Do not add backend, API, database, authentication, authorization,
  persistence, or external-integration scope.

## Implementation evidence

- Changed: `frontend/components/layout/header.tsx` now renders the approved
  logo at `h-14` below `lg` and `lg:h-16` from `lg`;
  `frontend/components/layout/header.spec.tsx` covers the asset and
  responsive classes; `docs/design.md` records the durable header sizing;
  and this specification records the approved scope and evidence.
- Tests: the Header test passed with 8 tests. Full frontend tests passed with
  70 test files and 263 tests. Frontend typecheck passed. Frontend lint
  passed with six existing image-optimization warnings. Frontend build
  passed. SDD validation passed for 28 specifications.
- Visual evidence: desktop browser verification at `1280 × 800` measured
  the header logo at `153.59 × 64px`. Mobile verification at `390 × 844`
  measured it at `133.98 × 56px`; the mobile menu remained separated from
  the logo. The scrolled mobile header kept the logo at `56px` high with
  the compact `12px` vertical padding.
- Formatting: targeted Prettier checks passed for the changed TypeScript
  files and this specification. The repository-wide format check failed on
  112 files, including pre-existing formatting warnings in `docs/design.md`
  and unrelated application files. `git diff --check` passed.

## Validation evidence

- AC-001: passed; the Header test and browser inspection confirm the
  unchanged approved asset and `alt="VETOR"`.
- AC-002: passed; desktop and mobile screenshots show the enlarged logo and
  its `BUSINESS & TECHNOLOGY` wording in resting and scrolled states.
- AC-003: passed; the responsive measurements show proportional sizing with
  no overlap with the desktop actions or mobile menu control.
- AC-004: passed; the Header test, browser navigation, and scroll-state
  inspection preserve the existing header behavior.
- AC-005: passed; the changed-file inspection contains only frontend,
  design-contract, and specification changes, with no backend, API,
  persistence, authentication, authorization, or integration changes.
