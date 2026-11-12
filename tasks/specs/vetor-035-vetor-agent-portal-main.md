---
id: VETOR-035
title: Vetor Agent in the portal main column
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-27-vetor-agent-main-column
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Vetor Agent in the portal main column

## Context

VETOR-033 delivered `Vetor Agent` as a dedicated full-viewport workspace at
`/portal/vetor-agent`. That page replaces the portal shell. The conversation
sidebar, the prompt area, and a `Voltar ao portal` control occupy the whole
viewport, and the portal navigation is not visible.

The named human then asked that the content of the sidebar item `Vetor Agent`
open in the space to the right of the portal navigation, and that it not
open as a separate page. This specification replaces only that placement.
The illustrative workspace, the `vetorAgent` permission, and the absence of
an agent gateway stay as VETOR-033 defined them.

This specification supersedes VETOR-033 acceptance criterion AC-003, the
VETOR-033 user-experience paragraphs that require a full-screen surface
outside the portal shell, and the `Vetor Agent workspace` section of
`docs/design.md` where it said the route does not repeat the portal sidebar.
The rest of VETOR-033 remains in force. VETOR-033 stays `implemented`.

## Desired outcome

An authenticated user who has `vetorAgent` selects `Vetor Agent` in the
portal sidebar and sees the existing illustrative workspace in the main
column, to the right of that sidebar. The portal shell stays in place. The
selection does not replace the portal with a separate full-screen page.

## In scope

- Render `/portal/vetor-agent` inside the same authenticated `PortalShell`
  used by `Suporte` and `Projetos`.
- Keep the sidebar item labeled `Vetor Agent`, immediately below `Suporte`,
  visible only when the session includes `vetorAgent`, linking to
  `/portal/vetor-agent`.
- Show the illustrative workspace in the shell main column. The portal
  sidebar remains available.
- Set the shell heading to `Vetor Agent`.
- Remove `Voltar ao portal` and the extra workspace title bar, because the
  portal shell already provides navigation and the page heading.
- Keep `Novo chat`, the static conversation rows, the static prompts, and
  the non-functional composer from VETOR-033.
- Keep the conversation list inside the main column, beside the prompt area
  from the `lg` breakpoint, and behind `Abrir conversas` below that
  breakpoint.
- Show the existing denial copy in that same main column when the session
  lacks `vetorAgent`.
- Update `docs/product.md` and `docs/design.md` so the route is described as
  the portal main column, not a full-screen surface.

## Out of scope

- Removing `/portal/vetor-agent` or opening the workspace without a route
  change.
- An overlay, drawer, or second browser tab.
- Changing who receives `vetorAgent`, or the Cadastro assignment rules.
- Connecting to an LLM, agent gateway, model provider, or external service.
- Sending prompts or persisting conversations.
- A new HTTP path, DTO field, database entity, or migration.
- A public or unauthenticated Vetor Agent route.
- Replacing the portal sidebar with the conversation list.
- New production conversation or prompt copy.

## Acceptance criteria

- AC-001: Selecting `Vetor Agent` from the portal sidebar opens
  `/portal/vetor-agent` inside the portal shell. The portal navigation,
  including `Vetor Agent`, stays visible, and the illustrative workspace
  occupies the main column to the right of that navigation.
- AC-002: The destination does not render a separate full-viewport page, a
  second VETOR wordmark header, or `Voltar ao portal`. The shell heading is
  `Vetor Agent`.
- AC-003: The main column still shows `Novo chat`, the static conversation
  rows, the static prompts, and the composer note that no message is sent.
  Using those controls does not call fetch, a project API, or browser
  storage.
- AC-004: Below `lg`, `Abrir conversas` opens the conversation list over the
  main column, and `Fechar conversas`, `Dispensar conversas`, or Escape
  closes it. From `lg`, that list stays beside the prompt area and to the
  right of the portal sidebar. The page does not scroll horizontally.
- AC-005: A session without `vetorAgent` does not see the sidebar item and,
  on a direct visit, sees `Você não tem acesso ao Vetor Agent.` in the
  portal main column. An unauthenticated caller does not see the workspace.

## User experience

The sidebar item keeps the existing portal navigation treatment and the
href `/portal/vetor-agent`. Activation follows the same shell pattern as
`Suporte` and `Projetos`: the left navigation stays, and the destination
replaces only the main column. The route stays so refresh and the existing
link keep the same surface. The workspace is not a full-viewport takeover
and not an overlay on top of another portal page.

The shell header shows `Vetor Agent`. The workspace body does not repeat
that title, the VETOR logo, or `Voltar ao portal`.

Inside the main column, the workspace uses the light dialog surface from
`Novo card`: an off-white field, then a white card with navy text, a
`navy/10` border, `shadow-2xl`, and a `28px` radius from `md`. The
conversation list, illustrative prompts, and composer sit on that white
surface. `Novo chat` and `Enviar` keep the accent fill. The composer remains
a visual preview and states that no message is sent.

The shell main for this route drops the default page padding and document
scroll. The workspace fills the remaining height of the main column. The
conversation list and the prompt column scroll inside that height, and the
composer stays at the bottom of the main column.

Below `lg`, the portal menu stays on the shell hamburger. `Abrir conversas`
stays inside the main column and opens the conversation list over that
column only. From `lg`, the portal sidebar and the conversation list are
both visible, with the prompt area to the right of the conversation list.
Interactive targets stay at least 40px tall. Focus uses the existing accent
ring. A transform on the conversation list is removed when
`prefers-reduced-motion` is set.

The denial state uses the portal shell and the off-white main surface. The
copy remains `Você não tem acesso ao Vetor Agent.` It does not use a
full-viewport navy screen or a return link.

## API and integrations

No HTTP path is added or changed. The page continues to use the existing
session read and `canUseVetorAgent`. The frontend must not call an LLM
gateway, agent service, persistence endpoint, or external provider.

## Data impact

No new entity, table, column, migration, or conversation record. Illustrative
rows and prompts stay static and must not be written to PostgreSQL, cookies,
local storage, or session storage.

## Security

The route stays inside the authenticated portal boundary. The backend
remains the authority for `vetorAgent`. Frontend visibility is only a user
experience optimization. This change does not add a public route, weaken a
guard, or collect prompts.

## Testing

- AC-001: The Vetor Agent page renders the portal navigation and the
  workspace together, and the sidebar link still points to
  `/portal/vetor-agent`.
- AC-002: The page heading is `Vetor Agent`, and `Voltar ao portal` is
  absent.
- AC-003: `Novo chat`, example rows, example prompts, and the composer note
  render. Exercising them does not call fetch or browser storage.
- AC-004: The conversation list exposes open, dismiss, and Escape, and the
  workspace fills the main column without a full-viewport height.
- AC-005: A session without `vetorAgent` sees the denial copy inside the
  shell and no sidebar item. An unauthenticated caller sees the portal
  login path already used by the portal, not the workspace.

Frontend coverage uses Vitest and React Testing Library. Update the
VETOR-033 page test that expects the workspace outside the shell.

## Delivery

The named human invoked `/goal` on this specification on 2026-10-27. That
invocation set `status: approved`.

Delivery choices: wrap the page with `PortalShell` and `pageTitle="Vetor Agent"`;
add `flushMain` so this route's main column has no page padding and does not
scroll as a document; change the workspace root from `h-dvh` to filling the
main column; remove the workspace header that contains the logo, title, and
`Voltar ao portal`; keep `Abrir conversas` in the prompt column below `lg`;
render denial inside the shell without a return link; update the route row
in `docs/product.md` and the Vetor Agent section in `docs/design.md`. Record
the superseded placement in VETOR-033.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-27-vetor-agent-main-column`.
- The human asked that the `Vetor Agent` sidebar item open in the space to
  the right and not as a new page.
- This replaces the full-screen placement the human had selected in
  VETOR-033.
- The route `/portal/vetor-agent` is kept so the item behaves like the other
  portal destinations. That placement choice is a design decision recorded
  here.
- Approval: the human invoked `/goal` on this file on 2026-10-27.
- The human then asked to match the light `Novo card` dialog surface for the
  workspace background and layout.

## Implementation evidence

- Changed: `frontend/app/portal/vetor-agent/page.tsx`, `frontend/components/vetor-agent/vetor-agent-workspace.tsx`, `frontend/components/layout/portal-shell.tsx`, `docs/product.md`, `docs/design.md`, and `tasks/specs/vetor-033-vetor-agent-screen.md`.
- Tests: `frontend/app/portal/vetor-agent/page.spec.tsx`, `frontend/components/vetor-agent/vetor-agent-workspace.spec.tsx`, and `frontend/components/layout/portal-shell.spec.tsx`.
- Commands: frontend `lint` passed with seven existing image warnings and no errors, frontend `typecheck` passed, frontend `test` passed (310 tests), frontend `build` passed, and `npm run sdd:validate` passed. Backend `test` and `test:e2e` were not run because this delivery does not change the API or persistence.
- Limitations: browser checks used the running app at `http://app.vps2.com.br:3000` with an existing `Administrador` session. From Suporte, `Vetor Agent` opened in the main column and the portal sidebar stayed visible. A prompt filled the composer, `Enviar` showed the preview status, and `Novo chat` cleared it. At 390px there was no horizontal overflow; `Abrir conversas` opened the list below the shell header and over the main column, and Escape closed it. A session without `vetorAgent` was not signed in during this check.

## Validation evidence

- AC-001: awaiting human confirmation.
- AC-002: awaiting human confirmation.
- AC-003: awaiting human confirmation.
- AC-004: awaiting human confirmation.
- AC-005: awaiting human confirmation.
