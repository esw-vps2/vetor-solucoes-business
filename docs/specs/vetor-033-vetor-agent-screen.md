---
id: VETOR-033
title: Vetor Agent visual workspace
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-27-vetor-agent-screen
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Vetor Agent visual workspace

## Context

The authenticated portal already has a tenant-scoped shell, a sidebar
navigation, and a Cadastro permission model based on `enabledActions`. The
request adds a sidebar item named `Vetor Agent` that opens a workspace
inspired by the supplied ChatGPT reference image. The intended workspace has
a conversation sidebar with a `Novo chat` action and recent conversations,
plus a main area with prompts for interacting with agents.

The human confirmed that this delivery is visual only. A future LLM gateway
will connect the workspace to an agent. This delivery must therefore use
static illustrative content and must not implement real agent execution,
conversation persistence, or an external integration.

The human confirmed that the navigation item is restricted to users who
receive a permission through Cadastro. The proposed action label is
`Vetor Agent`, with the technical key `vetorAgent`. The first delivery used
a dedicated full-screen surface. VETOR-035 supersedes that placement: the
workspace now renders in the portal shell main column. Acceptance criterion
AC-003 below, the user-experience paragraphs that required a surface outside
the portal shell, and the full-screen section of `docs/design.md` are no
longer the product behavior.

The supplied image is a composition reference only. It does not authorize
ChatGPT branding, external copy, a second visual identity, or an external
integration.

## Desired outcome

An authenticated portal user who has the `vetorAgent` action can select
`Vetor Agent` from the portal sidebar and reach the illustrative workspace.
VETOR-035 places that workspace in the portal main column. The workspace communicates the future agent experience through
static illustrative conversations and prompts while remaining visibly
non-functional until a separately approved gateway specification is
delivered.

## In scope

- Add `Vetor Agent` to the existing Cadastro action catalog using the
  `vetorAgent` key.
- Reuse the existing enabled-action assignment and tenant authorization
  rules for granting and revoking the action.
- Add an authenticated portal navigation item labeled `Vetor Agent` for
  users whose backend session includes `vetorAgent`.
- Define the dedicated portal route `/portal/vetor-agent`.
- Define an agent workspace. VETOR-035 replaces the original full-screen
  placement with the portal main column. The workspace still has:
  - A dedicated conversation sidebar. VETOR-035 removes the extra wordmark
    header and the return control, because the portal shell provides both.
  - A visible `Novo chat` action.
  - Static illustrative recent conversation rows.
  - A main prompt area with static illustrative agent or prompt entries.
  - A visually recognizable prompt composer prepared for a future gateway.
- Define responsive, keyboard-accessible, focus-visible, and reduced-motion
  behavior for the workspace.
- Adapt the supplied composition to the VETOR visual system, tokens, and
  custom inline SVG conventions.

## Out of scope

- Connecting to an LLM, agent gateway, model provider, or external service.
- Sending prompts or receiving, streaming, regenerating, or displaying real
  agent responses.
- Selecting or configuring real agents.
- Persisting, loading, renaming, deleting, or synchronizing conversations.
- Storing conversation data in PostgreSQL, browser storage, cookies, or
  session storage.
- A new HTTP path, a new DTO field, database entities, migrations,
  notifications, uploads, voice input, or file attachments.
- A public or unauthenticated Vetor Agent route.
- ChatGPT branding, logo, product copy, or a second visual identity.
- Changes to existing portal roles or action-granting rules beyond adding the
  new action to the established catalog.
- Final agent catalog, prompt catalog, or production conversation copy. Those
  remain a later product decision. This delivery uses static example labels.
- LLM usage limits, retention, audit logging, model selection, data handling,
  or third-party access policy for the future gateway.

## Acceptance criteria

- AC-001: The authenticated portal action catalog exposes one new action
  labeled `Vetor Agent` with the technical key `vetorAgent`, and it follows
  the existing Cadastro action-assignment rules.
- AC-002: A user with `vetorAgent` in the backend session sees a sidebar item
  named `Vetor Agent`. A user without that action does not see the item.
  An unauthenticated caller cannot use the feature route.
- AC-003: Superseded by VETOR-035. Selecting `Vetor Agent` opens
  `/portal/vetor-agent` inside the portal shell main column. The original
  full-screen criterion no longer applies.
- AC-004: The workspace visibly contains a conversation sidebar with a
  `Novo chat` control and static illustrative recent conversation rows. The
  workspace visibly contains a main prompt area with static illustrative
  agent or prompt entries and a composer affordance for the future gateway.
- AC-005: The visual-only workspace performs no LLM, gateway, agent, API,
  database, persistence, or external-service operation when it is opened or
  when its illustrative controls are used.
- AC-006: The workspace uses VETOR tokens, Inter, existing focus-ring
  treatment, accessible custom inline SVGs, and a VETOR-branded adaptation of
  the supplied reference without ChatGPT branding or a second visual system.
  VETOR-035 removes the separate wordmark header; the portal shell keeps the
  brand.
- AC-007: On narrow viewports the conversation sidebar can be opened and
  dismissed without horizontal page overflow. On desktop it remains available
  beside the main prompt area. Interactive targets are keyboard reachable and
  at least 40px tall.
- AC-008: The workspace exposes semantic landmarks and accessible names for
  the sidebar, `Novo chat`, prompt affordances, and composer. VETOR-035
  removes the return control.
  Visible focus remains available, contrast remains readable, and decorative
  motion is disabled when `prefers-reduced-motion` is set.

## User experience

The feature is an authenticated portal destination at
`/portal/vetor-agent`. Its sidebar entry uses the existing portal navigation
item treatment, sits immediately below `Suporte`, and is rendered only when
the backend-provided session action set contains `vetorAgent`. Hiding the
entry is a usability behavior, not an authorization mechanism.

VETOR-035 places this destination inside the portal shell. The portal
sidebar stays visible and the workspace occupies the main column.
`Voltar ao portal` and the extra wordmark header are not part of the
current surface. The conversation list stays inside that main column.

The conversation sidebar is visually distinct from the prompt column and
uses the light dialog surface: white, navy text, and a `navy/10` border.
It contains `Novo chat` near the top, followed by a scrollable list of static
illustrative conversation rows. The rows use example labels and state that
they are illustrative. They are not loaded from a backend. Production
conversation copy stays a later product decision.

The main workspace follows the supplied composition at a product level:
generous empty space, a centered introductory area, static prompt or agent
suggestions, and a rounded composer near the lower content boundary. The
composer is a visual preview of the future gateway and must have a clear
non-functional treatment. Prompt labels are static examples. Production
prompt copy stays a later product decision.

The workspace starts from the narrow layout. On small screens the
conversation sidebar is collapsed behind an accessible control and opens as
an overlay or sheet with a clear dismissal path. On larger screens the
sidebar is persistently visible. The layout must preserve the viewport,
avoid horizontal overflow, and keep the main prompt area usable with browser
zoom.

Use the existing VETOR design contract rather than reproducing ChatGPT's
black-only palette, logo, controls, or wording. Use `navy`, `navy-50`,
`off-white`, `text-primary`, `text-dark`, and `accent` as appropriate for
surface contrast. Use custom inline SVGs and the established focus ring; do
not add an icon library.

## API and integrations

This visual-only feature adds no HTTP path. `vetorAgent` joins the existing
`enabledActions` allowed set used by user create, user update, and the
session. The payload shape does not gain a field. The frontend must not call
an LLM gateway, agent service, persistence endpoint, or external provider in
this delivery.

The route remains inside the authenticated portal boundary. The existing
session read is the authenticated-user check. `hasMappedAction` for
`vetorAgent` is the enabled-action check. `Administrador` receives the action
through the existing rule that grants every mapped action. The action is not
added to the `AdministradorTenant` implied baseline. `Administrador` and
`AdministradorTenant` may store it with the writer rules that already apply
to non-lane actions. A future gateway integration requires a separate
approved specification covering its endpoint, payload, authentication,
authorization, rate limits, failures, and data handling.

## Data impact

No new entity, table, column, migration, or conversation record is required.
The `vetorAgent` value extends the existing `enabledActions` action catalog;
existing user records remain unchanged until an authorized administrator
assigns the action.

Illustrative conversations, prompts, and agent entries are static UI content.
They must not be read from or written to PostgreSQL, cookies, local storage,
session storage, or another browser persistence mechanism.

The production prompt catalog, agent catalog, conversation shape, retention
period, and data ownership stay undecided for the future gateway feature.

## Security

The feature is portal-only and requires an authenticated session. The
backend is the authority for both the `vetorAgent` action and access to
`/portal/vetor-agent`; frontend visibility is only a user experience
optimization.

The new action reuses the existing enabled-action governance. `Administrador`
and the applicable tenant administrator flow may grant it only within the
scope already allowed by the product contract. No new role bypass,
unauthenticated exception, or public route is introduced.

This delivery stores and transmits no prompt, conversation, agent response,
credential, token, or gateway secret. No future gateway credential may be
placed in frontend code or a `NEXT_PUBLIC_*` variable. Future collection,
retention, logging, encryption, provider access, and prompt-data policy
remain undecided and require a separate human-approved security decision
before gateway work.

## Testing

- AC-001: Cadastro lists `Vetor Agent` / `vetorAgent`, and saving an
  `Administrador` includes it without adding it to the implied tenant
  baseline.
- AC-002: The sidebar link renders only for an effective `vetorAgent` grant.
  An unauthenticated caller does not see the workspace.
- AC-003: Superseded by VETOR-035. The page test expects the workspace
  inside the portal shell, with no `Voltar ao portal` link.
- AC-004: The workspace shows `Novo chat`, example rows, example prompts, and
  the composer note.
- AC-005: Opening the workspace and using its controls does not call fetch,
  project APIs, or browser storage.
- AC-006: The workspace uses navy and accent tokens and inline SVG. The
  separate VETOR wordmark header was removed by VETOR-035.
- AC-007: The conversation sidebar exposes open, dismiss, and Escape, and
  controls use a 40px minimum.
- AC-008: Conversas, `Novo chat`, prompts, and the composer have accessible
  names. The return link was removed by VETOR-035. The sidebar transition
  includes `motion-reduce:transition-none`.

Frontend coverage uses Vitest and React Testing Library. Backend coverage
asserts `vetorAgent` on the mapped-action predicate.

## Delivery

The named human invoked `/goal` on this specification on 2026-10-27. That
invocation set `status: approved`.

Delivery choices: append `vetorAgent` to the mapped catalog; do not imply it
for `AdministradorTenant`; keep the `Administrador` all-actions rule; place
the workspace in `frontend/components/vetor-agent/`; gate the route with the
existing session and `canUseVetorAgent`; use static example copy; record the
portal-main placement from VETOR-035 in `docs/design.md` and the route plus action in
`docs/product.md`, `docs/api.md`, `docs/database.md`, and `openapi.yaml`.
No new Nest path, table, or migration. A future gateway delivery must be
specified separately.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-27-vetor-agent-screen`.
- The human confirmed visual-only scope, with an LLM gateway planned later.
- The human selected the portal sidebar as the entry location.
- The human first selected a dedicated full-screen agent workspace. VETOR-035
  supersedes that placement with the portal main column.
- The human selected static illustrative content for the first visual version.
- The human specified permission-based access through Cadastro and confirmed
  the `Vetor Agent` / `vetorAgent` action proposal.
- Approval: the human invoked `/goal` on this file on 2026-10-27.
- The supplied ChatGPT screenshot is a visual composition reference only.
- Relevant global contracts: `docs/product.md`, `docs/design.md`,
  `docs/conventions.md`, and the existing authenticated portal action model.

## Implementation evidence

- Changed: `frontend/app/portal/vetor-agent/page.tsx`, `frontend/components/vetor-agent/vetor-agent-workspace.tsx`, `frontend/components/layout/portal-shell.tsx`, `frontend/lib/portal-actions.ts`, `frontend/components/forms/portal-configure-profile-form.tsx`, `backend/src/modules/portal/enabled-actions.ts`, `docs/design.md`, `docs/product.md`, `docs/api.md`, `docs/database.md`, and `openapi.yaml`.
- Tests: `frontend/components/vetor-agent/vetor-agent-workspace.spec.tsx`, `frontend/app/portal/vetor-agent/page.spec.tsx`, `frontend/components/layout/portal-shell.spec.tsx`, `frontend/lib/portal-actions.spec.ts`, `frontend/components/forms/portal-configure-profile-form.spec.tsx`, and `backend/src/modules/portal/enabled-actions.spec.ts`.
- Commands: backend `test` passed (284 tests), backend `test:e2e` passed (92 tests), frontend `test` passed (309 tests), backend and frontend `lint` passed with seven existing image warnings, backend and frontend `typecheck` passed, backend and frontend `build` passed, and `npm run sdd:validate` passed. `npm run format:check` failed on files outside this delivery.
- Limitations: browser checks used the running app at `http://app.vps2.com.br:3000`. A signed-in user without `vetorAgent` saw the denial screen, no sidebar item, and `Voltar ao portal` returned to `/portal`. The full workspace and the sidebar item were then checked by rendering an `Administrador` session in that same page, because a fresh login requires the emailed MFA code. In that workspace, prompts filled the composer, `Enviar` showed the preview status, example rows and `Novo chat` stayed local, and those controls did not call fetch or write browser storage. At 390px the sidebar was closed, opened, and dismissed with Escape, with no horizontal overflow. `npm run format:check` still fails on files outside this delivery. The earlier signed-in portal session was signed out during the check.

## Validation evidence

- AC-001: awaiting human confirmation.
- AC-002: awaiting human confirmation.
- AC-003: awaiting human confirmation.
- AC-004: awaiting human confirmation.
- AC-005: awaiting human confirmation.
- AC-006: awaiting human confirmation.
- AC-007: awaiting human confirmation.
- AC-008: awaiting human confirmation.
