---
id: VETOR-038
title: Standard form modal layout
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-27-standard-form-modal-layout
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Standard form modal layout

## Context

The shared `frontend/components/ui/modal.tsx` already owns the modal
overlay, portal rendering, focus behavior, Escape handling, overlay dismissal,
body scroll lock, responsive sizing, and internal scrolling. Its default
geometry is close to the layout requested by the human, but current callers
use different tones and size variants.

The human supplied the following modal reference from the project-card form:

- Outer overlay: `fixed inset-0 z-[60] overflow-y-auto bg-navy/80 backdrop-blur-md motion-reduce:backdrop-blur-none`.
- Centering wrapper: `flex min-h-dvh items-center justify-center p-0 md:px-4 md:py-8`.
- Dialog: `relative h-dvh max-h-dvh min-h-0 w-full max-w-none overflow-y-auto overscroll-contain rounded-none p-6 shadow-2xl md:max-h-[calc(100dvh-4rem)] md:rounded-[28px] md:p-8 md:h-auto border border-navy/10 bg-white text-navy md:max-w-xl`.
- Observed reference geometry at the supplied viewport: `top: 286px`, `left: 1074px`, `width: 576px`, and `height: 685px`.

The observed position and height are viewport-dependent evidence, not fixed
pixel requirements. The `md:max-w-xl` constraint represents the requested
576px desktop width.

Current form and form-like modal callers include portal access, user and
tenant registration, profile configuration, Power BI import and distribution,
project finance, project documents, project cards, tenant notes, support
tickets, operating-expense categories, and expense cancellation. Several
callers currently inherit the dark modal tone or explicitly request `lg` or
`viewport` sizing.

The repository UI language remains Portuguese (Brazil). This specification
changes shared visual treatment and responsive behavior, not existing product
copy or form semantics.

## Desired outcome

Every form modal opens as one consistent, accessible light dialog: a white
surface with navy text, the requested scrim and blur, full-viewport mobile
behavior, a 576px maximum desktop width, and internal vertical scrolling.
Existing forms retain their fields, labels, validation, submission behavior,
API calls, authorization, and success or error feedback.

All modal call sites are audited. No feature owns a duplicate outer modal
shell. File preview remains an explicit non-form exception because its
viewport-sized content is a viewing surface rather than a form.

## In scope

- Make the shared `Modal` default form treatment the requested light,
  centered, viewport-safe layout.
- Preserve the shared overlay and centering structure:
  `fixed inset-0`, `z-[60]`, `overflow-y-auto`, `bg-navy/80`,
  `backdrop-blur-md`, the reduced-motion blur fallback, `min-h-dvh`,
  responsive gutters, and centered content.
- Preserve the shared dialog structure:
  full viewport height and width below `md`, `h-auto` and `max-w-xl` from
  `md`, `max-h-dvh`, `md:max-h-[calc(100dvh-4rem)]`, internal vertical
  scrolling, `overscroll-contain`, `rounded-none` below `md`,
  `md:rounded-[28px]`, `p-6` below `md`, `md:p-8`, `shadow-2xl`,
  `border-navy/10`, `bg-white`, and `text-navy`.
- Migrate every form modal to the standard light treatment and default
  `md:max-w-xl` width, including forms currently using the dark default,
  `size="lg"`, or `size="viewport"`.
- Audit and update form content styles so labels, controls, helper text,
  validation feedback, and actions remain readable on the white surface.
  Reuse the existing VETOR tokens, `Button` patterns, focus ring, and
  typography.
- Keep existing `showClose` choices, titles, form fields, action labels,
  validation, loading states, submission behavior, and close callbacks.
- Keep existing modal accessibility behavior: `role="dialog"`,
  `aria-modal="true"`, labelled title, keyboard focus containment, focus
  return, Escape dismissal, overlay dismissal where currently supported, and
  body scroll lock.
- Audit all current shared `Modal` invocations for accidental outer-shell
  overrides and remove duplicated modal containers where found.
- Keep non-form confirmation dialogs on the same shared, viewport-safe
  light shell unless their existing content requires a documented exception.
- Preserve the project-file PDF and image preview as the only documented
  `size="viewport"` exception. It must continue using the shared overlay,
  focus behavior, and internal viewport-safe scrolling.
- Add or update frontend tests for the shared primitive and affected modal
  callers.
- Promote the resulting shared form-modal rule into `docs/design.md` during
  approved delivery.

## Out of scope

- Adding, removing, renaming, or reordering form fields.
- Changing form validation rules, copy, success messages, error messages,
  routes, API methods, request payloads, response DTOs, or persistence.
- Changing authentication, authorization, tenant scope, session handling,
  token handling, or backend security policy.
- Redesigning portal navigation, drawers, the leadpage header, the WhatsApp
  overlay, or other fixed non-modal surfaces.
- Replacing the shared `Modal` with a UI library or introducing a new modal
  implementation.
- Changing the product behavior of project-card detail, file preview,
  Power BI confirmations, finance confirmations, or expense confirmations
  beyond their shared visual shell and accessibility regression coverage.
- Making the supplied top, left, width, and height values fixed across all
  viewport sizes.
- Changing the file-preview content or adding new preview formats.
- Implementing before this specification reaches `approved`.

## Acceptance criteria

- AC-001: All current form modal call sites use the shared `Modal`
  component. No form modal defines an independent fixed overlay, dialog
  container, or centering shell.
- AC-002: A default form modal renders the requested outer structure:
  `fixed inset-0 z-[60] overflow-y-auto bg-navy/80 backdrop-blur-md
  motion-reduce:backdrop-blur-none`, followed by the centered
  `min-h-dvh` wrapper and a dialog with the requested viewport, scrolling,
  radius, padding, border, white surface, navy text, and `md:max-w-xl`
  classes.
- AC-003: At mobile width, every form modal fills the viewport, uses `p-6`,
  has square corners, and scrolls its content inside the dialog without
  horizontal overflow. At `md` and above, it is centered, has `md:p-8`,
  `md:rounded-[28px]`, `md:max-h-[calc(100dvh-4rem)]`, `md:h-auto`, and
  a maximum width of 576px.
- AC-004: A form longer than the available viewport remains usable through
  dialog scrolling. The document body is locked while the modal is open,
  and no nested full-page scroll or clipped submit/cancel actions is
  introduced.
- AC-005: Form modal surfaces use `bg-white` and `text-navy`; labels,
  inputs, selects, textareas, helper text, validation feedback, and action
  buttons remain readable and retain visible focus states. Existing dark
  form-specific text and field styles do not become unreadable on the new
  surface.
- AC-006: Existing form behavior is unchanged. Each affected form still
  opens and closes through its existing trigger, preserves its current
  fields and copy, sends the same request, preserves loading and feedback
  states, and invokes its existing success and cancel callbacks.
- AC-007: Shared modal accessibility behavior remains intact for every
  affected caller: the dialog has an accessible name, initial focus enters
  the form, Tab focus is contained, Escape closes where it did before, the
  overlay closes where it did before, and focus returns to the trigger after
  close.
- AC-008: The project-file PDF and image preview remains the only
  documented viewport-sized modal exception. It continues to fit its
  content inside the viewport and does not regress keyboard or screen-reader
  behavior.
- AC-009: Existing non-form confirmation and detail dialogs do not gain
  duplicated modal shells or lose their existing actions. Any retained
  special sizing is explicitly covered by a test and remains outside the
  form-modal standard.
- AC-010: No backend, API, database, authentication, authorization,
  persistence, or external-integration behavior changes as part of this
  visual consolidation.

## User experience

The standard form modal uses the existing VETOR modal shell and light portal
surface:

```text
fixed inset-0 z-[60] overflow-y-auto bg-navy/80 backdrop-blur-md motion-reduce:backdrop-blur-none
  flex min-h-dvh items-center justify-center p-0 md:px-4 md:py-8
    relative h-dvh max-h-dvh min-h-0 w-full max-w-none overflow-y-auto overscroll-contain
    rounded-none p-6 shadow-2xl md:max-h-[calc(100dvh-4rem)] md:rounded-[28px]
    md:p-8 md:h-auto border border-navy/10 bg-white text-navy md:max-w-xl
```

At the supplied desktop reference viewport, a content-sized form dialog may
measure 576px wide and 685px high. The dialog remains centered and its
height is determined by content up to the viewport cap.

On mobile, the form uses the entire viewport and remains square to avoid
reducing the usable field area. On desktop, the dialog is a centered white
card with the existing 28px radius, navy text, a subtle navy border, and the
existing shadow. Long content scrolls inside the dialog.

Form content keeps the product's existing Portuguese (Brazil) labels and
feedback. The form body must not introduce a second competing surface or
force a wider modal to accommodate long content. Existing headings,
`Salvar`, `Cancelar`, close controls, and confirmation actions retain their
current semantics and copy.

Form modals that previously used the dark tone receive light-surface field
and feedback styles. Existing dark-surface styling is retained only where a
non-form dialog is explicitly documented as requiring it; the approved
standard form treatment has no dark modal variant.

The project-file preview remains a viewport-sized light dialog because PDF
and image viewing need the available content area. It is not a form modal
and is the only retained viewport-size exception.

## API and integrations

No API method, path, payload, response, error contract, authentication
requirement, or integration changes. Existing forms continue to use the
current API client functions and backend endpoints.

## Data impact

No persistence, migration, query, data-retention, or storage change. The
feature changes only shared modal presentation and frontend form styling.

## Security

No new security policy or trust boundary is introduced. Existing backend
authentication, authorization, DTO validation, rate limiting, secure-cookie
handling, file controls, and tenant scoping remain authoritative.

The frontend continues to treat validation as user experience only. The
layout change must not place passwords, tokens, secrets, filesystem paths,
or other sensitive values into new attributes, logs, URLs, or persisted
browser storage.

## Testing

Approved delivery must include:

- Shared `Modal` coverage for the default light surface, exact responsive
  geometry classes, internal scrolling, focus entry, focus containment,
  Escape, overlay dismissal, focus return, and body scroll lock.
- Representative tests for portal access, portal registration and profile
  forms, Power BI forms, project finance and document forms, project-card
  forms, tenant notes, ticket creation, expense categories, and expense
  cancellation.
- Regression coverage that confirms existing form fields, labels, submit and
  cancel actions, loading feedback, error feedback, and close callbacks
  remain available.
- A viewport-focused test or browser inspection at a narrow mobile width
  and a desktop width that verifies the full-screen mobile layout, the
  576px desktop cap, centered placement, internal scrolling, and absence of
  clipped actions.
- A regression check for the project-file PDF and image preview as the
  documented non-form viewport exception.
- Frontend `typecheck`, `lint`, `test`, and `build`.
- `npm run sdd:validate` after this specification changes and after the
  approved delivery updates the specification.

Planned acceptance-test mapping:

- AC-001: `frontend/components/ui/modal.spec.tsx` and the affected modal
  caller tests confirm that production form modals use the shared `Modal`.
- AC-002: `frontend/components/ui/modal.spec.tsx` confirms the requested
  overlay, centering wrapper, and default dialog geometry classes.
- AC-003: `frontend/components/ui/modal.spec.tsx` and representative caller
  tests cover the responsive full-screen and capped desktop classes.
- AC-004: shared modal tests cover internal scrolling and body scroll lock;
  representative long-form tests cover usable actions.
- AC-005: shared modal tests and representative light-surface component tests
  cover readable labels, controls, feedback, and actions.
- AC-006: existing tests for portal, Power BI, finance, project, ticket,
  expense, and portal-access forms.
- AC-007: `frontend/components/ui/modal.spec.tsx` and caller-level
  accessible-name tests.
- AC-008: `frontend/components/projects/project-files-panel.tsx` tests.
- AC-009: project-board, finance, Power BI, and expense confirmation tests.
- AC-010: changed-file inspection confirming frontend and design-contract
  scope only.

## Delivery

This is a frontend visual-system consolidation. After human approval,
delivery is expected to update:

- `frontend/components/ui/modal.tsx` and its tests.
- Form modal callers in:
  `frontend/components/forms/portal-access-modal.tsx`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/powerbi/powerbi-admin.tsx`,
  `frontend/components/finance/finance-home.tsx`,
  `frontend/components/projects/project-board.tsx`,
  `frontend/components/tickets/tickets-home.tsx`,
  `frontend/components/expenses/expenses-home.tsx`, and
  `frontend/components/expenses/expense-detail.tsx`.
- The affected frontend component tests.
- `docs/design.md` to record the shared form-modal layout and the
  documented file-preview exception.

No backend, API, OpenAPI, database, infrastructure, environment, product
route, or authentication-contract file should change.

The delivery agent must preserve the existing form behavior and implement
only this approved visual and responsive scope.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-27-standard-form-modal-layout`.
- Request: use the supplied `Modal` DOM path as the standard layout for all
  form modals and adjust modal instances outside that pattern.
- Intake evidence: the supplied dialog is 576px wide at the reference
  viewport and uses the existing VETOR overlay, centered wrapper, white
  surface, internal scrolling, and responsive full-screen mobile behavior.
- Current implementation evidence: `frontend/components/ui/modal.tsx`
  already contains the requested outer overlay and responsive dialog
  geometry for its default size, while callers currently mix dark and light
  tones and `lg` or `viewport` sizes.
- Current modal inventory consulted:
  `frontend/components/forms/portal-access-modal.tsx`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/powerbi/powerbi-admin.tsx`,
  `frontend/components/finance/finance-home.tsx`,
  `frontend/components/projects/project-board.tsx`,
  `frontend/components/projects/project-files-panel.tsx`,
  `frontend/components/tickets/tickets-home.tsx`,
  `frontend/components/expenses/expenses-home.tsx`,
  `frontend/components/expenses/expense-detail.tsx`, and
  `frontend/components/ui/modal.spec.tsx`.
- Existing contracts consulted: `docs/design.md`, `docs/product.md`,
  `docs/conventions.md`, `.agents/sdd/README.md`,
  `.agents/sdd/configuration.md`, `.agents/sdd/lifecycle.md`,
  `.agents/sdd/decision-authority.md`, `.agents/sdd/roles.md`,
  `.agents/sdd/adapters.md`, `tasks/specs/_template.md`,
  `.agents/sdd/agents.yml`, and the frontend UI and testing guidance.
- Technical decisions recorded here:
  - The shared `Modal` remains the single outer-shell implementation.
  - Form callers use the light `bg-white text-navy` treatment and default
    `md:max-w-xl` size.
  - Dialog scrolling, rather than a wider modal, handles long forms.
  - File preview remains the only explicit viewport-size exception because
    it is not a form.
- Approval: the named human approved VETOR-038 in the agent conversation on
  2026-10-27 and authorized implementation of the recorded scope.

## Open questions

No unresolved business or security questions remain. The reference position
and height are treated as visual evidence at one viewport, not as fixed
cross-viewport requirements.

## Implementation evidence

- Changed: `frontend/components/ui/modal.tsx` and
  `frontend/components/ui/modal.spec.tsx` now default to the light,
  viewport-safe form shell and cover the requested overlay, centering, and
  dialog geometry.
- Changed: portal access, portal registration, profile, tenant, photo,
  Power BI, finance, project-card, support-ticket, operating-expense, and
  expense-cancellation modal callers use the shared light treatment and the
  default `md:max-w-xl` size.
- Changed: `frontend/components/tickets/tickets-home.tsx` and
  `frontend/components/expenses/expense-detail.tsx` use light-surface
  content styles without dark modal-specific controls.
- Changed: `frontend/components/projects/project-files-panel.tsx` retains
  `size="viewport"` as the only production exception for file previews.
- Changed: `docs/design.md` records the shared form-modal rule and the
  file-preview exception.
- Tests: `npm run test --workspace frontend` passed with 82 test files and
  330 tests.
- Tests: focused modal regressions passed with 4 test files and 40 tests.
- Checks: `npm run typecheck --workspace frontend` passed.
- Checks: `npm run lint --workspace frontend` passed with seven existing
  `@next/next/no-img-element` warnings and no errors.
- Checks: `npm run build --workspace frontend` passed.

## Validation evidence

- AC-001: implementation evidence recorded; awaiting human validation.
- AC-002: implementation evidence recorded; awaiting human validation.
- AC-003: implementation evidence recorded; awaiting human validation.
- AC-004: implementation evidence recorded; awaiting human validation.
- AC-005: implementation evidence recorded; awaiting human validation.
- AC-006: implementation evidence recorded; awaiting human validation.
- AC-007: implementation evidence recorded; awaiting human validation.
- AC-008: implementation evidence recorded; awaiting human validation.
- AC-009: implementation evidence recorded; awaiting human validation.
- AC-010: implementation evidence recorded; awaiting human validation.
