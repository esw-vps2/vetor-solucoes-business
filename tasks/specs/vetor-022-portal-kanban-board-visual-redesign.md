---
id: VETOR-022
title: Portal Kanban board visual redesign
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-01-portal-kanban-board-visual-redesign
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Portal Kanban board visual redesign

## Context

The authenticated project board is rendered by
`frontend/components/projects/project-board.tsx` inside `PortalShell`. The
current board already owns the approved six lanes, live project data, card
actions, drag-and-drop, custom board backgrounds, and the project files panel.
The existing Kanban UI kit under `frontend/components/kanban-ui/` provides
reusable buttons, icon buttons, badges, avatars, lane headers, cards, icons,
and the `KanbanScope` visual boundary.

The requester supplied a screenshot as a visual reference. The screenshot is
only a reference for layout, composition, spacing, visual hierarchy, and
surface treatment. Its branding, copy, sample data, and proprietary assets
are not approved for reuse.

This specification covers a visual redesign of the existing authenticated
board. It does not approve implementation, add product behavior, or replace
the approved six-lane model with the three columns shown in the reference.

## Desired outcome

The authenticated portal project board presents a clean board header, a
secondary horizontal navigation or filter composition, and a horizontally
scrollable six-lane canvas whose cards follow the established Kanban UI kit
visual language. The board remains live, permission-aware, accessible,
responsive, and connected to the current API and persistence behavior.

## In scope

- Recompose the visual structure of `ProjectBoardView` into:
  - board header;
  - board toolbar;
  - persistent filter row;
  - lane canvas;
  - project files panel;
  - status and error feedback.
- Show the project name from the existing board data as the board title.
- Arrange the existing board actions on the header or toolbar using compatible
  components from `frontend/components/kanban-ui/`.
- Make the header actions user-facing:
  - `Share` generates a dashboard link that requires the recipient to be
    authenticated or to authenticate before opening the dashboard;
  - upload stores a document in the dashboard's project files area using the
    existing project-file rules;
  - `+` opens the existing card-creation modal.
- Provide persistent filters for status, date, and task completion.
- Use the existing Kanban primitives for compatible control, badge, avatar,
  lane-header, icon, and card anatomy.
- Preserve the six approved lanes in their current order:
  `Backlog`, `Pronto`, `Trabalhando`, `Revisão`, `Deploy`, and `Finalizado`.
- Preserve the current card fields and metadata without changing their source
  or meaning.
- Apply the screenshot's composition and hierarchy using the VETOR visual
  system, Inter typography, existing tokens, approved assets, and existing
  light and dark themes.
- Update behavioral frontend tests for the visual composition and preserved
  interactions after approval.

## Out of scope

- Approving this specification.
- Implementing code before this specification is approved.
- Changing existing routes, authentication, or sessions, or changing any
  permission other than the explicitly defined dashboard-link access rule.
- Adding filters, tabs, counters, sorting behavior, or API calls beyond the
  filter, dashboard-share, dashboard-upload, and card-creation behaviors
  recorded in this specification.
- Replacing the six approved lanes with the three reference columns.
- Turning the board into static demonstration data.
- Changing card editing, deletion, comments, checklist, card attachments,
  card sharing, card-detail opening, or drag-and-drop behavior.
- Removing or redesigning the project files panel or custom board background
  behavior.
- Changing `PortalShell` responsibilities or the public leadpage.
- Adding a second family of cards, badges, avatars, buttons, or icons.
- Adding Lucide, Radix, shadcn, or any other UI or icon library.
- Copying the reference product's branding, logo, text, sample data, images,
  or proprietary content.
- Adding source-code comments or commented-out code.

## Acceptance criteria

- AC-001: The board header renders the current project name from the existing
  board payload and does not introduce a new project-name source.
- AC-002: The board separates header, toolbar, filter composition, and lane
  canvas without moving business rules out of the existing board
  responsibilities.
- AC-003: The board preserves all six approved lanes, in order, with each
  lane's current card count and existing lane label.
- AC-004: Each lane uses the existing `KanbanLaneHeader` or a compatible
  extension of that primitive, shows a status-specific accent, and exposes
  the add-card action only when the current permission and existing behavior
  allow it.
- AC-005: Card faces preserve the existing number, title, description, tags,
  priority, due date and time, assignee, avatars or fallback, comments,
  checklist, attachments, cover, and other currently displayed metadata.
- AC-006: Cards use the existing Kanban card, badge, avatar, and local SVG
  icon primitives where their contracts are compatible. No parallel visual
  component family is introduced.
- AC-007: Users with the existing move permission can continue dragging cards
  between lanes and the existing placement behavior remains unchanged.
- AC-008: The header `+` opens the existing card-creation modal and preserves
  its current permission-aware behavior.
- AC-009: The header `Share` copies the existing board URL
  `/portal/projetos/{projectId}` and confirms with `Link copiado.`. Opening
  that URL requires an authenticated session, `viewProjects`, and the session
  tenant that owns the project. A global administrator whose session tenant
  does not own the project is denied. Card sharing behavior is unchanged.
- AC-010: Header upload stores the selected document in the dashboard's
  existing project-files area rather than on a card and follows the same
  accepted file types, size limits, and naming behavior as that area.
- AC-011: The board provides persistent filters for status, date, and task
  completion, persisted per project. The date filter supports a start date,
  an end date, or both according to the selected mode, and all selected
  filters are respected by the rendered lane and card results.
- AC-012: Filter persistence uses the existing project update authorization.
  Users who cannot update the project can apply filters for their current
  view but cannot overwrite the project's persisted filters.
- AC-013: Existing card editing, deletion, comments, checklist, card
  attachments, card-detail opening, and drag-and-drop continue to work through
  their existing handlers and API client functions.
- AC-014: The project files panel remains available without navigating away
  from the board, and the custom board background remains supported for users
  with the existing permission.
- AC-015: Desktop renders lanes side by side. Narrow viewports provide
  horizontal board scrolling, independent vertical scrolling inside lanes
  when needed, and controls with at least 40px touch targets.
- AC-016: Light and dark themes preserve readable contrast, focus states,
  existing portal tokens, and the board's current background behavior.
- AC-017: The public leadpage and portal shell navigation remain unchanged.
- AC-018: Header, toolbar, lane, card, panel, and state controls use semantic
  landmarks and accessible names. Active filter state exposes an appropriate
  current state.
- AC-019: Keyboard users can reach and operate board controls, card actions,
  file-panel controls, and drag-and-drop alternatives already provided by the
  product. Focus is visible.
- AC-020: Drag-and-drop states remain perceivable to assistive technology, and
  decorative images or SVGs remain hidden or appropriately labelled.
- AC-021: Existing motion continues to respect `prefers-reduced-motion`; the
  redesign does not add mandatory decorative animation.
- AC-022: Tests use React Testing Library semantic queries and cover the
  header, title, permission-aware actions, six lanes, lane counts, card
  content, filters, dashboard sharing, dashboard upload, card creation,
  responsive scroll structure where applicable, drag-and-drop, detail opening,
  project files, light mode, dark mode, and control accessibility.

## User experience

### Composition

`ProjectBoardView` remains the stateful composition and continues to own
board loading, refresh, permission checks, drag state, card selection,
mutations, status messages, and file-panel visibility. Visual extraction is
allowed only when it reduces complexity and receives explicit props and
callbacks from the board.

The board region has the following visual order:

1. A clean top header with the project title on the left.
2. Existing board actions on the right, grouped with adequate spacing and
   40px minimum targets.
3. A horizontal filter row beneath the header with persistent status, date,
   and task-completion filters. The row exposes each active state.
4. The six-lane canvas.
5. The existing project files panel when opened.

On wide screens, actions and right-side filter controls may share a row when
space permits. On narrow screens, controls wrap or scroll without shrinking
their touch targets, and the lane canvas remains independently horizontally
scrollable.

### Visual treatment

Cards use white or theme-equivalent surfaces, rounded corners, subtle borders,
and restrained shadows consistent with the existing Kanban kit. Card content
keeps the established hierarchy:

1. Priority or tag badge.
2. Number and title.
3. Description when present.
4. Assignee avatar or fallback.
5. Comment, checklist, attachment, due-date, and other existing metadata.

Lane headers use the existing lane status accents recorded in `docs/design.md`
and preserve the current card count. The add-card control uses the existing
button or icon-button primitive and is rendered only for an existing allowed
action.

The screenshot's three-column layout, sample text, sample counts, branding,
logo, colors, and imagery are not copied. The VETOR identity, existing
Inter typography, existing tokens, approved local SVG icons, and existing
assets remain authoritative.

### Accessibility and motion

Use `header`, `main`-compatible region structure, labelled navigation where
navigation is present, and labelled sections for the board canvas. Filter
controls expose their selected state with `aria-pressed`, `aria-selected`, or
the equivalent semantics appropriate to their control pattern. Icon-only
controls require accessible names. Preserve visible focus, keyboard
operation, reduced-motion handling, and the current drag-and-drop
announcements or attributes.

No new animation is required. Any retained or adjusted board motion must
disable decorative movement when `prefers-reduced-motion` is enabled.

## API and integrations

The board continues to use the existing project-board, card, attachment,
comment, checklist, user, background, and project-document contracts where
they already provide the required behavior.

Dashboard sharing uses the existing authenticated board URL:
`/portal/projetos/{projectId}`. It does not create a public token, a new
route, or a share record. The recipient authenticates with the existing portal
flow and must retain `viewProjects`. Access uses the existing session tenant
context and board authorization. A global administrator whose session tenant
does not own the project is denied. There is no independent link expiration
or revocation; access changes when the existing session, tenant context, or
permission changes. The frontend copies the URL and reports success with the
existing `Link copiado.` pattern.

Dashboard upload reuses `POST /api/v1/projects/{id}/documents` with the
existing project-file multipart contract, writing to the project document
tree root unless the existing panel selects a folder. It uses the existing
file allowlist, 5 MB per-file limit, tree 500 MB limit, and 200-node limit.

The filter dimensions are status, date, and task completion. Filtering is
performed from the board payload in the frontend. Status selects one or more
approved lane keys. Date applies to the existing card `dueAt` field and
supports `start`, `end`, and `range` modes. Task completion supports `all`,
`complete`, and `incomplete`; a card is complete when it has at least one
checklist item and every item is done.

Filter persistence uses the existing `PATCH /api/v1/projects/{id}` route with
an explicit `kanbanFilters` DTO field. The board response exposes the same
validated `kanbanFilters` object. The backend stores it in the existing
`projects.metadata` JSONB under the `kanbanFilters` key. Project managers
retain the route's existing authorization; other viewers use the filters
without persisting changes.

The header `+` must use the existing card-creation flow and must not create a
second modal or a second card-creation API.

## Data impact

The project title, lane counts, card fields, permissions, avatars, covers,
documents, and background continue to come from the existing payloads and
state.

Dashboard sharing has no new persisted representation. The existing
authenticated project URL and current authorization remain the authority.

Dashboard upload uses the existing `project_documents` tree and filesystem
lifecycle. No new document entity, table, or migration is required.

Filter selections persist per project in the existing `projects.metadata`
JSONB under `kanbanFilters`. The stored shape is:

```text
{
  status: string[],
  date: {
    mode: "start" | "end" | "range",
    startDate: string | null,
    endDate: string | null
  } | null,
  taskCompletion: "all" | "complete" | "incomplete"
}
```

## Security

No new security policy is requested for the visual redesign. Existing
authentication, backend authorization, permission checks, protected routes,
and error-handling rules remain authoritative.

The redesign must not expose new user, tenant, session, token, credential, or
API data. Hiding or showing a control in the frontend remains a UX decision
and is not an authorization mechanism. Existing backend authorization must
continue to protect every mutation and board read.

### Security decisions

- The shared URL is the existing board route. Restricting that route to the
  global `Administrador` profile would deny `AdministradorTenant` and
  `Usuario` actors that this specification still requires to open the board,
  apply local filters, and, for project managers, persist filters. Dashboard
  access therefore stays the existing board rule: an authenticated session,
  `viewProjects`, and the session tenant that owns the project.
- A global administrator whose session tenant does not own the project must
  not access the shared dashboard.
- The shared URL has no independent lifetime or revocation token. Existing
  session expiration, tenant context, project authorization, and permission
  changes control access.
- Existing project-document authorization and file-validation rules apply to
  dashboard upload unless the human defines a different security policy.

## Business decisions

- Status, date, and task completion are the required filter dimensions.
- The date filter supports a start date, an end date, or both according to
  the selected mode.
- Filters persist per project.
- Dashboard link generation uses the existing `Link copiado.` confirmation
  and the existing clipboard fallback pattern.
- Dashboard upload uses the existing project-files panel's accepted file
  types, size limits, and naming behavior.

## Testing

Frontend tests use Vitest and React Testing Library. Tests assert user-visible
behavior through `getByRole`, `getByLabelText`, `getByText`, and related
semantic queries.

- AC-001: `frontend/components/projects/project-board.spec.tsx`
- AC-002: `frontend/components/projects/project-board.spec.tsx`
- AC-003: `frontend/components/projects/project-board.spec.tsx`
- AC-004: `frontend/components/projects/project-board.spec.tsx` and
  `frontend/components/kanban-ui/kanban-lane-header.spec.tsx`
- AC-005: `frontend/components/projects/project-board.spec.tsx`
- AC-006: `frontend/components/projects/project-board.spec.tsx`
- AC-007: `frontend/components/projects/project-board.spec.tsx`
- AC-008: `frontend/components/projects/project-board.spec.tsx`
- AC-009: `frontend/components/projects/project-board.spec.tsx` and
  `backend/src/modules/projects/projects.service.spec.ts`
- AC-010: `frontend/components/projects/project-board.spec.tsx`
- AC-011: `frontend/components/projects/project-board.spec.tsx` and
  `frontend/lib/project-kanban.spec.ts`
- AC-012: `frontend/components/projects/project-board.spec.tsx` and
  `backend/src/modules/projects/projects.service.spec.ts`
- AC-013: `frontend/components/projects/project-board.spec.tsx`
- AC-014: `frontend/components/projects/project-board.spec.tsx`
- AC-015: `frontend/components/projects/project-board.spec.tsx`
- AC-016: `frontend/components/projects/project-board.spec.tsx`
- AC-017: `frontend/components/layout/portal-shell.spec.tsx` and
  `frontend/app/portal/page.spec.tsx`
- AC-018: `frontend/components/projects/project-board.spec.tsx`
- AC-019: `frontend/components/projects/project-board.spec.tsx`
- AC-020: `frontend/components/projects/project-board.spec.tsx`
- AC-021: `frontend/components/projects/project-board.spec.tsx`
- AC-022: `frontend/components/projects/project-board.spec.tsx`,
  `frontend/lib/project-kanban.spec.ts`,
  `backend/src/modules/projects/kanban-filters.spec.ts`,
  `backend/src/modules/projects/projects.service.spec.ts`, and
  `backend/test/projects.e2e-spec.ts`

Lane header counts in the board test are the counts of cards that pass the
active filters. Drag placement still uses the full lane indexes.

## Delivery

The human `/goal` instruction, together with the approval rule in `SDD.md`,
sets this specification to `approved` for delivery. Delivery then records
`implemented` after the checks below. A named human still owns `validated`.

After approval, frontend delivery should make the smallest composition change
in `frontend/components/projects/project-board.tsx` and may extract visual
components under `frontend/components/projects/` or reuse existing
`frontend/components/kanban-ui/` primitives. `PortalShell` should not change
unless implementation evidence shows that the board-only composition cannot
fit its current content boundary.

No new dependency, icon library, route, or public leadpage change is
permitted. Approved delivery updates `docs/api.md`, `openapi.yaml`, Swagger,
and the relevant project specification sections for the `kanbanFilters` API
field.

If implementation establishes a durable shared visual decision not already
recorded, the approved delivery may update the board section of
`docs/design.md`. Approved delivery updates those global contracts for
`kanbanFilters` and the board composition.

## Validation plan after approval

```bash
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm run test --workspace frontend
npm run build --workspace frontend
npm run sdd:validate
```

The implementation records changed files, reused components, preserved
behavior, command outcomes, and remaining visual limitations in the
implementation evidence section.

## Traceability

| Source                     | Record                                                       |
| -------------------------- | ------------------------------------------------------------ |
| Human request              | `source_kind: human_prompt`                                  |
| Chat reference             | `chat-2026-10-01-portal-kanban-board-visual-redesign`        |
| Visual reference           | Screenshot attached to the human prompt                      |
| Current board              | `frontend/components/projects/project-board.tsx`             |
| Current board tests        | `frontend/components/projects/project-board.spec.tsx`        |
| Existing Kanban primitives | `frontend/components/kanban-ui/`                             |
| Portal shell               | `frontend/components/layout/portal-shell.tsx`                |
| Board route                | `frontend/app/portal/projetos/[id]/page.tsx`                 |
| Related specification      | VETOR-018 Kanban UI kit components                           |
| Global visual contract     | `docs/design.md`                                             |
| Related behavior           | Existing approved project-board specifications and contracts |

## Implementation evidence

- Changed: `ProjectBoardView` shows the project name, a toolbar (`Share`, `Enviar arquivo do painel`, `Novo card`, files, and background), and a persistent filter row. `Share` copies `/portal/projetos/{projectId}` and shows `Link copiado.`, with the existing readonly fallback labelled `Link do painel`. Header upload posts to `POST /api/v1/projects/{id}/documents` at the document root and opens the files panel. `Novo card` and each lane add control open the existing card modal. Filters match lane, `dueAt` in `America/Sao_Paulo`, and checklist completion, and managers persist them with `PATCH /api/v1/projects/{id}` field `kanbanFilters` inside `projects.metadata`. Viewers filter locally. Board reads stay on `viewProjects` plus the session tenant; another tenant's administrator is denied. Six lanes, card actions, drag placement on the full lane, the files panel, and the custom background stay. Updated `docs/api.md`, `openapi.yaml`, Swagger examples, `docs/database.md`, and the board section of `docs/design.md`.
- Tests: `npm run test --workspace backend` passed (36 files, 204 tests). `npm run test:e2e --workspace backend` passed (9 files, 73 tests). `npm run test --workspace frontend` passed (67 files, 217 tests). `npm run typecheck --workspace frontend` passed. `npm run lint --workspace frontend` passed with existing `img` warnings. `npm run lint --workspace backend` passed. `npm run build --workspace backend` passed. `npm run build --workspace frontend` passed. `npm run sdd:validate` passed (22 specifications). `npm run typecheck --workspace backend` failed on two existing errors outside this change: `src/common/security/rate-limit.guard.spec.ts` and `test/session-tenant.e2e-spec.ts`. Browser on the live board: the project title, toolbar, six lanes, filters, card detail, files panel, and dark mode all worked; a status filter survived reload and was then cleared. The clipboard click on `Share` was blocked by browser automation; the component test covers that copy. Visible lane counts follow the active filters. Header upload always writes to the document root because the files panel has no selected-folder state. A persisted filter also shows the existing success status `Operação realizada com sucesso.`

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
- AC-007: not recorded
- AC-008: not recorded
- AC-009: not recorded
- AC-010: not recorded
- AC-011: not recorded
- AC-012: not recorded
- AC-013: not recorded
- AC-014: not recorded
- AC-015: not recorded
- AC-016: not recorded
- AC-017: not recorded
- AC-018: not recorded
- AC-019: not recorded
- AC-020: not recorded
- AC-021: not recorded
- AC-022: not recorded
