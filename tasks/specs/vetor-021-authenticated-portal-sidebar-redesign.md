---
id: VETOR-021
title: Authenticated portal sidebar redesign
status: approved
source_kind: human_prompt
source_reference: chat-2026-10-01-authenticated-portal-sidebar-redesign
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Authenticated portal sidebar redesign

## Context

The authenticated portal currently composes its sidebar, navigation, theme
control, logout action, mobile overlay, and authenticated session chrome in
`frontend/components/layout/portal-shell.tsx`. Session loading, logout, and
user updates remain owned by `frontend/components/layout/authenticated-portal.tsx`.

The requester supplied an image as a visual direction for a white vertical
sidebar and asked for the authenticated portal to move closer to that
composition. The existing VETOR visual system, routes, permissions, API
calls, authentication, authorization, responsive behavior, and portal content
remain the source of truth for behavior.

The project already contains copied Figma primitives under
`frontend/components/kanban-ui/`, including logo, logomark, input, sidebar
item, featured card, avatar, badge, button, icon button, and local SVG icon
components. The redesign must inspect and reuse those primitives where their
anatomy fits the portal shell. It must not create a second equivalent
component family or add a UI or icon dependency.

This specification records the approved scope and implementation decisions
for the authenticated portal sidebar redesign.

## Desired outcome

An authenticated user sees a VETOR-branded portal shell with a sidebar that
visually follows the supplied reference while preserving every current portal
route, permission, API call, authentication behavior, authorization behavior,
and main-content surface.

The sidebar is white in light mode, uses the existing VETOR assets and tokens,
and has a dark-mode equivalent that preserves the same hierarchy and
contrast. The public leadpage at `/` is unchanged.

## In scope

- Recompose the authenticated portal sidebar and shell using the existing
  components in `frontend/components/kanban-ui/` and the existing portal
  layout components.
- Preserve the existing portal navigation and its current routes:
  `Painel`, `Projetos`, `Relatórios`, `Financeiro`, `Power BI`, `Cadastro`,
  and `Sair`.
- Preserve the current permission checks that determine which navigation
  items are rendered.
- Add the visual structure requested for:
  - VETOR logo at the top using the approved assets already in the project.
  - Rounded search field.
  - Icon navigation with labels, active state, hover state, and visible
    focus state.
  - Search filtering for the visible sidebar navigation items.
  - Authenticated user area at the bottom with avatar, name, profile or
    tenant context, optional cargo, and logout action.
  - Optional `cargo` field in user registration and editing, following the
    existing user-edit permissions.
- Preserve the existing desktop sidebar and mobile menu/overlay behavior,
  adapting the presentation to the new visual composition.
- Preserve the current portal main region and all existing project, report,
  finance, Power BI, registration, password, and Kanban surfaces.
- Preserve the use of `frontend/components/kanban-ui/` for the Kanban region.
- Add or update frontend tests for active navigation, absence of numeric
  badges, authenticated
  user information, logout, mobile menu, search, navigation permissions, and
  light and dark modes when the dark-mode implementation is present.

## Out of scope

- Any change to the public leadpage at `/`.
- Any new portal route, permission, role, or authorization rule.
- Any change to login, MFA, sessions, token handling, refresh behavior,
  logout destination, authentication, or backend authorization.
- Any change to portal main-content behavior or existing business actions.
- Any replacement of the existing Kanban components with a new component
  family.
- Any new UI, icon, font, analytics, messaging, or external integration
  library.
- Lucide, Radix, shadcn, or another icon/UI library.
- Slothui logo, copy, colors, proprietary branding, sample content, or
  assets.
- New marketing claims, product claims, metrics, pricing, or promotional
  behavior.
- Numeric navigation badges or new count sources.
- Adding source-code comments or commented-out code.
- Updating `docs/design.md` before approval. An approved delivery may promote
  durable sidebar decisions there.

## Acceptance criteria

- AC-001: An authenticated portal page presents a vertical sidebar visually
  close to the supplied reference while using VETOR identity, existing
  project tokens, Inter, and approved local assets.
- AC-002: The sidebar renders VETOR branding and never renders the Slothui
  logo, wordmark, colors, copy, or proprietary assets.
- AC-003: The existing allowed navigation remains available at its existing
  route and keeps its existing permission behavior for `Painel`, `Projetos`,
  `Relatórios`, `Financeiro`, `Power BI`, `Cadastro`, and `Sair`.
- AC-004: The current active route is exposed through an accessible active
  state, and navigation controls provide hover, visible keyboard focus, and
  touch targets of at least 40px.
- AC-005: The sidebar does not display numeric navigation badges or introduce
  a count source.
- AC-006: The sidebar includes a search field with rounded visual treatment
  and an accessible label. Entering text filters the visible sidebar
  navigation items by their labels without changing routes or calling an
  API. Clearing the field restores all items allowed by permissions.
- AC-007: The authenticated user area shows the existing avatar or fallback,
  name, profile, tenant context, and optional cargo without exposing sensitive
  fields. A missing photo renders the first letters of the first and last
  names. Logout continues to call the existing logout flow and displays its
  existing pending state.
- AC-008: Desktop keeps the sidebar visible at the existing desktop
  breakpoint, and smaller viewports keep the existing hamburger and overlay
  behavior, focus behavior, and close behavior.
- AC-009: The main portal region remains compatible with current screens,
  including the project board and its existing
  `frontend/components/kanban-ui/` components.
- AC-010: Light mode preserves the requested white sidebar. Dark mode, when
  enabled by the current implementation, preserves the same information
  hierarchy, readable contrast, active state, focus state, and theme toggle
  behavior without changing the public leadpage.
- AC-011: No existing portal route, API call, permission result, business
  behavior, authentication behavior, or authorization behavior is broken.
- AC-012: Frontend tests cover active navigation, search filtering,
  authenticated user rendering, logout, mobile menu, search behavior,
  permission-based navigation, and applicable light/dark states.
- AC-013: The relevant frontend lint, typecheck, tests, and build checks pass.
- AC-014: User registration and editing expose an optional `cargo` field and
  send it through the existing user contracts. Existing permission rules for
  user editing remain unchanged.
- AC-015: The authenticated sidebar displays the profile followed by the
  cargo when cargo is present, and displays only the profile when it is absent.

## User experience

### Composition

The shell remains owned by `PortalShell`. `AuthenticatedPortal` remains
responsible for session loading, refresh, logout orchestration, and user
updates. The implementation composes existing primitives instead of
introducing parallel button, icon, avatar, badge, card, input, or navigation
implementations.

The desktop sidebar is a fixed-height vertical region that remains visible
from the existing `lg` breakpoint. It is a white surface in light mode with
the existing VETOR border, radius, spacing, typography, and focus tokens. The
main region retains its current layout and scroll behavior.

The sidebar order is:

1. VETOR logo or approved logo composition.
2. Rounded search field.
3. Existing permission-aware portal navigation.
4. Flexible spacer.
5. Theme control, when currently enabled.
6. Authenticated user area and logout action.

The mobile experience keeps the current hamburger trigger, overlay layer,
sidebar transition, close control, keyboard behavior, and focus return. The
sidebar may use a compact mobile arrangement when required by the existing
layout, but it must retain the same information and actions.

### Existing components to inspect and reuse

The delivery agent must inspect and prefer the existing components before
changing composition:

- `frontend/components/kanban-ui/kanban-logo.tsx`
- `frontend/components/kanban-ui/kanban-logomark.tsx`
- `frontend/components/kanban-ui/kanban-input-text.tsx`
- `frontend/components/kanban-ui/kanban-sidebar-item.tsx`
- `frontend/components/kanban-ui/kanban-featured-card.tsx`
- `frontend/components/kanban-ui/kanban-avatar.tsx`
- `frontend/components/kanban-ui/kanban-badge.tsx`
- `frontend/components/kanban-ui/kanban-button.tsx`
- `frontend/components/kanban-ui/kanban-icon-button.tsx`
- Existing local SVG icons under `frontend/components/kanban-ui/icons/`.
- `frontend/components/layout/portal-shell.tsx`
- `frontend/components/layout/authenticated-portal.tsx`
- Existing project components under `frontend/components/projects/`.
- Existing portal routes under `frontend/app/portal/`.

`KanbanAppSidebar` is a Kanban composition and must not replace the portal
shell. Its reusable primitives may be composed when their props and behavior
fit the portal navigation. Portal-specific route links, permission checks,
and logout remain owned by the portal shell.

### Content and branding

The logo uses the existing approved VETOR asset files under
`frontend/public/brand/`. The design must not copy the supplied reference's
logo, text, colors, or product language.

The navigation labels remain the current approved portal labels. The
authenticated user area uses data already present in `SafeUser`; it does not
request email, tokens, passwords, or other fields solely for display.

The search field filters the existing visible navigation labels on the client.
It does not filter portal content, change routes, submit a query, or call an
API. Navigation items remain constrained by the existing permission checks.

The white-sidebar composition, including its hierarchy, spacing, and reuse of
the existing primitives, is the visual standard to adopt for the
authenticated portal. Approved delivery may promote the durable decision to
`docs/design.md`.

### Interaction and accessibility

Navigation uses semantic links for routes and a button only for actions that
do not navigate. The current item exposes `aria-current="page"` where
appropriate. Icon-only controls have accessible names. The search field has
an accessible label and remains keyboard reachable.

The overlay has an accessible close control, visible focus, keyboard
navigation, and focus return consistent with the current shell behavior.
Decorative SVGs are hidden from assistive technology. Reduced-motion
behavior follows the existing project contract.

## API and integrations

No new route or integration is defined by this preliminary draft.

The frontend continues to use the existing session, navigation, project,
report, finance, Power BI, registration, and logout APIs. Search behavior,
including filtering, is local to the sidebar and introduces no API call.
The existing user registration, editing, session, and user-list contracts
will include the optional `cargo` field after the approved delta is delivered.

## Data impact

The user persistence model will add an optional `cargo` column through a
migration. No new entity, seed, or independent data source is introduced.

This feature does not add navigation badge counts, persistence, or a new
static data source.

## Security

No new security policy is requested. Existing authentication, backend
authorization, and user-edit permissions remain unchanged and authoritative.

The redesign must not expose new sensitive session fields, tokens,
credentials, tenant-internal data, or API responses to the browser. Hiding a
navigation item remains a UX behavior and must not be treated as
authorization.

The implementation must preserve the existing logout operation, session
handling, protected routes, and backend permission checks. No new route,
external script, third-party library, browser token storage, or trust
boundary is introduced.

The formal accessibility conformance level follows the product contract.
This specification preserves the recorded requirements for semantic markup,
keyboard navigation, visible focus, reduced motion, accessible labels, and
minimum touch targets.

## Testing

Frontend tests use Vitest and React Testing Library. Tests should assert
user-visible behavior through roles, labels, accessible names, and visible
copy rather than implementation-specific class strings.

- AC-001: `frontend/app/portal/page.spec.tsx` verifies the authenticated
  portal shell and `frontend/components/layout/portal-shell.tsx` provides the
  approved sidebar composition.
- AC-002: `frontend/app/portal/page.spec.tsx` verifies the VETOR logo asset
  and no reference-brand asset or copy is present.
- AC-003: `frontend/components/layout/portal-shell.spec.tsx` and existing
  portal route tests verify route links and permission-based navigation.
- AC-004: `frontend/components/layout/portal-shell.spec.tsx` verifies active
  state, accessible controls, focusable navigation, and minimum-height
  navigation targets.
- AC-005: Portal shell tests verify that navigation items do not render
  numeric badges.
- AC-006: Portal shell tests verify the search label, filtering by visible
  navigation labels, permission-preserving results, clearing, and absence of
  an API call.
- AC-007: Portal shell tests verify authenticated name, avatar/fallback,
  profile or tenant context, and pending logout state.
- AC-008: Portal shell tests verify menu open, close, overlay, and mobile
  navigation behavior.
- AC-009: Existing project and Kanban tests remain passing; no test moves the
  shell responsibility into the Kanban region.
- AC-010: Portal theme tests verify the light and dark shell states when
  dark mode is enabled.
- AC-011: Existing portal route and permission tests remain passing.
- AC-012: `frontend/components/layout/portal-shell.spec.tsx` covers active
  navigation, search filtering, user rendering, logout, mobile menu,
  permission-based visibility, and theme behavior.
- AC-013: `npm run typecheck --workspace frontend`, `npm run lint --workspace
  frontend`, `npm run test --workspace frontend`, and `npm run build
  --workspace frontend`.
- AC-014: Frontend and backend user registration/edit tests verify the
  optional cargo field and preservation of existing edit permissions.
- AC-015: Portal shell tests verify profile-only and profile-with-cargo
  sidebar rendering.

The approved delta requires backend unit and E2E coverage, API contract
updates, and a database migration for the optional cargo field.

## Delivery

Implementation is prohibited while this specification is `draft` or
`in_review`. A named human must approve this specification before delivery.

After approval, the frontend delivery should update the smallest existing
composition necessary, primarily `PortalShell` and its tests, and adjust
existing reusable primitives only when their established contract can
support the portal without regressing the Kanban kit.

No new dependency is permitted. The approved delta requires the existing
backend user DTOs, service mapping, API documentation, database migration,
and corresponding tests to carry the optional cargo field. If the approved
visual treatment becomes a durable shared sidebar decision, delivery may
update the portal section and component inventory in `docs/design.md` in the
same change.

The delivery must execute the applicable frontend checks and
`spec-driven-development`. It must record command results and changed files in
the implementation evidence section.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-10-01-authenticated-portal-sidebar-redesign`
- Visual source: image attached to the human prompt; no Slothui brand or
  reference copy is approved for reuse.
- Existing shell: `frontend/components/layout/portal-shell.tsx`
- Existing session boundary:
  `frontend/components/layout/authenticated-portal.tsx`
- Existing Kanban primitives: `frontend/components/kanban-ui/`
- Existing project region: `frontend/components/projects/` and
  `frontend/app/portal/`
- Global contracts consulted: `docs/product.md`, `docs/design.md`, and
  `docs/conventions.md`
- Related specifications: VETOR-008, VETOR-012, VETOR-014, VETOR-016,
  VETOR-018, VETOR-019, and VETOR-020

## Decisions

### Business

1. The promotional card is removed from the authenticated portal sidebar.
2. The search field filters the sidebar navigation buttons by their labels.
3. Navigation badges do not display numeric counts.
4. `cargo` is an optional persisted user field.
5. `cargo` follows the existing user-edit permissions.

### Security

No new security decision was identified. Existing authentication,
authorization, session, logout, and data-exposure policies remain in force.

## Implementation evidence

- Changed: `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/layout/portal-shell.spec.tsx`,
  `frontend/components/kanban-ui/kanban-sidebar-item.tsx`,
  `frontend/components/kanban-ui/kit-contract.spec.tsx`,
  `frontend/app/portal/page.spec.tsx`,
  `frontend/components/forms/portal-register-form.tsx`,
  `frontend/components/forms/portal-register-form.spec.tsx`,
  `frontend/components/forms/portal-edit-user-form.tsx`,
  `frontend/lib/api/client.ts`,
  backend user DTOs, entity, services, auth mappings, API documentation,
  OpenAPI schema, database migration, and `docs/design.md`. The portal shell
  now composes the existing VETOR logo, search input, avatar, navigation item,
  and local sign-out icon primitives. Navigation filtering is local and
  permission-aware. The authenticated footer now shows avatar fallback,
  profile, optional cargo, and icon-only logout. User registration and editing
  carry the optional cargo field through the existing user contract and
  persistence migration. No authentication or authorization rule changed.
- Tests: frontend passed with 67 test files and 211 tests. Backend unit tests
  passed with 35 test files and 199 tests. Backend E2E tests passed with 9
  test files and 73 tests. Frontend lint passed with five pre-existing
  `@next/next/no-img-element` warnings. Backend lint passed. Frontend build
  and backend build passed. Frontend typecheck passed. Backend typecheck is
  not clean because of three pre-existing errors in
  `src/common/security/rate-limit.guard.spec.ts` and
  `test/session-tenant.e2e-spec.ts`; no cargo-related type errors were
  reported. `spec-driven-development` passed with 21 specifications and
  `git diff --check` passed.

## Validation evidence

- AC-001: Passed by the authenticated portal shell implementation and
  frontend portal test coverage.
- AC-002: Passed by the VETOR asset assertion and absence of reference-brand
  assets in the changed shell.
- AC-003: Passed by portal shell route and permission tests.
- AC-004: Passed by active-state, semantic-control, focus, and target-size
  assertions in the portal shell implementation and tests.
- AC-005: Passed by the absence-of-counts portal shell test.
- AC-006: Passed by the local navigation-filtering and clearing tests.
- AC-007: Passed by authenticated user and logout tests.
- AC-008: Passed by the mobile menu and overlay tests.
- AC-009: Passed by the frontend test suite and unchanged portal content
  composition.
- AC-010: Passed by the theme toggle implementation and test coverage.
- AC-011: Passed by the frontend test suite and preserved route/API
  composition.
- AC-012: Passed by the portal shell test coverage.
- AC-013: Frontend typecheck, lint, tests, and build passed. Backend lint,
  tests, E2E tests, and build passed. Backend typecheck remains failed due to
  the pre-existing errors recorded above. SDD validation and diff checks
  passed.
- AC-014: Passed by the registration/edit forms, backend DTOs and services,
  API contract updates, migration, and related tests.
- AC-015: Passed by the authenticated footer composition and profile/cargo
  rendering logic.
