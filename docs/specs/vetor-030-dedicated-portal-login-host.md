---
id: VETOR-030
title: Dedicated portal login host and leadpage portal-entry removal
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-26-dedicated-portal-login-host
created_at: 2026-10-26
updated_at: 2026-10-26
---

# Dedicated portal login host and leadpage portal-entry removal

## Context

The leadpage previously exposed a `Portal Vector` link in the desktop header
and in the mobile navigation. Both controls pointed to `/portal` on the
leadpage host. An unauthenticated visit to a portal route rendered the
existing `PortalLoginPage` on that same host.

The intake identified the desktop header control by its DOM path, position,
dimensions, and rendered HTML. Those values are evidence of the current
element, not a durable layout contract.

`VETOR-017` previously recorded a dedicated login host, while `VETOR-019`
implemented the later same-host `/portal` entry behavior. This specification
replaces that entry boundary. It does not change the status of either earlier
specification.

The human later confirmed `https://app.vps2.com.br/` as the dedicated login
URL. The authenticated portal remains at `/portal` on that same host. An
unauthenticated visit to `/portal` on the leadpage host redirects to the
dedicated login URL. DNS and TLS provisioning remain outside this repository;
the application only recognizes the already-provisioned host.

## Desired outcome

The public leadpage no longer exposes a portal entry action in its header or
mobile navigation. Portal sign-in is available through a dedicated hostname
and login page that reuses the existing portal authentication capability.

The public login page is `https://app.vps2.com.br/`. After authentication, the
user remains on `https://app.vps2.com.br/portal`.

## In scope

- Remove the `Portal Vector` action from the leadpage desktop header.
- Remove the corresponding `Portal Vector` action from the leadpage mobile
  navigation.
- Ensure the leadpage header no longer opens a portal access modal or navigates
  to a portal route.
- Route the confirmed dedicated hostname and path to the existing portal login
  page.
- Reuse the existing portal e-mail, password, password-recovery, MFA, session,
  and account-state behavior unless a human-approved decision changes that
  contract.
- Preserve the remaining leadpage navigation, contact action, sections,
  responsive behavior, and visual identity.
- Keep host routing explicit and deployment-configured. The application must
  not select a login or post-login destination from an arbitrary
  user-controlled redirect.

## Out of scope

- New portal business capabilities or changes to portal authorization roles.
- Changes to credential, password-recovery, MFA, session, or account-block
  policy beyond the host boundary required by the confirmed topology.
- Leadpage copy, claims, sections, contact flow, or brand assets.
- Portal internal screens after authentication.
- New persistence entities, migrations, or portal data fields.
- DNS or TLS provisioning.

## Acceptance criteria

- AC-001: The desktop leadpage header does not render a `Portal Vector` link,
  button, or equivalent portal action.
- AC-002: The mobile leadpage navigation does not render a `Portal Vector`
  link, button, or equivalent portal action.
- AC-003: No leadpage header control opens `PortalAccessModal`, navigates to a
  portal route, or otherwise exposes portal access. The remaining header
  actions keep their current behavior.
- AC-004: `https://app.vps2.com.br/` renders the existing portal login page
  with its current authentication states. The page does not render the
  leadpage header, leadpage sections, portal sidebar, or modal close control.
- AC-005: The dedicated login page preserves the existing portal
  authentication contract: backend validation and authorization remain the
  source of truth, and the current e-mail, password, recovery, MFA, session,
  and account-state flows remain available as applicable.
- AC-006: After successful authentication, the same tab opens
  `https://app.vps2.com.br/portal` and does not accept an arbitrary
  caller-provided redirect.
- AC-007: An unauthenticated visit to `/portal` on the leadpage host
  redirects to `https://app.vps2.com.br/`. An authenticated visit to
  `/portal` on `app.vps2.com.br` renders the portal home.
- AC-008: Production host and cookie behavior satisfy the confirmed security
  topology: `app.vps2.com.br` serves both login and portal, session cookies
  remain host-only, and credentialed API requests allow the exact dedicated
  origin.

## User experience

### Leadpage

The leadpage keeps the consolidated VETOR header from `docs/design.md`,
including its fixed navy glass treatment, in-page navigation, responsive
breakpoints, `Fale conosco` behavior, focus ring, and reduced-motion behavior.
Only the portal action is removed. The desktop action group must not retain an
empty portal placeholder, and the mobile overlay must not retain a portal row.

### Dedicated login page

The login page is a split workspace. From `lg`, a navy brand column sits beside
a light credential column. Below `lg`, only the credential column is shown, with
the color logo above the form. The document has no leadpage header, hero,
footer, portal sidebar, overlay, or close control, and it has exactly one `h1`,
`Acesse sua conta`.

The brand column uses the existing dark logo, rendered with a light wordmark and the
green arrow kept visible on navy, and the copy supplied for this
layout: `Tecnologia que impulsiona resultados.`, the work-environment sentence,
and the rows `Gestão integrada`, `Acesso seguro`, and `Eficiência operacional`.
The credential column keeps the existing e-mail, password, recovery, MFA,
session, and account-state behavior. `Esqueceu sua senha?` opens that recovery
flow. `Fale com o administrador.` is visible accent text and does not navigate.
There is no login-page entrance animation.

The layout uses the existing VETOR palette, logo files, and typography. It does
not add a second color system, component library, or brand asset.

## API and integrations

No new endpoint is proposed. The login page reuses the existing authentication
API under `/api/v1`, including the current login, MFA, password-recovery,
refresh, logout, and session operations. The login origin is
`https://app.vps2.com.br/`, and the authenticated portal origin is the same.

The frontend-to-backend API origin and the explicit CORS allowlist must
include `https://app.vps2.com.br` when the API is on another origin. The
implementation must not use a wildcard origin or expose private configuration
through `NEXT_PUBLIC_*`.

The existing host-based session behavior remains the technical default. Login
and the authenticated portal use the same host, so delivery does not broaden
the cookie `Domain` or change `SameSite`.

## Data impact

No new persistence is required. Existing portal users, tenant associations,
password hashes, refresh sessions, password-recovery state, MFA challenges,
account status, and audit records remain the data model for this feature.

No login credential, token, session secret, or private configuration is
stored in the frontend or added to a public response.

## Security

The dedicated login page remains a public authentication surface, and the
backend remains the authority for credential validation, authentication,
authorization, rate limiting, account state, and session issuance.

Existing security controls continue to apply:

- Validate all authentication and recovery inputs at the NestJS boundary with
  DTOs and `class-validator`.
- Keep authentication responses and rate-limit behavior generic where the
  current contract requires it.
- Keep passwords, password hashes, raw MFA codes, reset tokens, refresh
  tokens, cookies, secrets, and private mail configuration out of URLs, logs,
  frontend bundles, and unnecessary responses.
- Keep production traffic on HTTPS.
- Keep session cookies HttpOnly and secure in production.
- Do not add a user-controlled redirect destination.

The confirmed security topology is:

- `https://app.vps2.com.br/` serves login.
- `https://app.vps2.com.br/portal` serves the authenticated portal.
- Session cookies remain host-only, without a broader `Domain` attribute.
- The backend CORS allowlist includes the exact dedicated origin when the
  browser calls an API on another origin.
- DNS and TLS provisioning is outside this repository, while production
  application traffic remains HTTPS.

## Testing

After approval, the delivery must include:

- Frontend component tests that the desktop and mobile leadpage headers no
  longer expose portal access and that the remaining header actions still
  work.
- Frontend route or host tests that the confirmed dedicated hostname renders
  the login page and other hosts retain the leadpage behavior.
- Frontend login-flow tests for the existing credential, recovery, MFA, and
  session states on the dedicated page.
- Browser or HTTP end-to-end coverage for the confirmed host, post-login
  destination, host-only cookies, CORS, and unauthenticated portal routes.
- Backend tests only for any approved API, CORS, cookie, or session changes
  required by the confirmed topology.
- The applicable repository checks:
  `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run test:e2e`, `npm run build`, `npm run format:check`, and
  `npm run sdd:validate`.

Planned acceptance-test mapping:

- AC-001: `frontend/components/layout/header.spec.tsx` asserts that the
  desktop header has no `Portal Vector` control.
- AC-002: `frontend/components/layout/header.spec.tsx` asserts that the
  mobile navigation has no `Portal Vector` control.
- AC-003: `frontend/components/layout/header.spec.tsx` asserts that no
  leadpage header interaction opens portal access.
- AC-004: a host-routing test for the dedicated login page asserts the
  `app.vps2.com.br` document composition.
- AC-005: `frontend/components/forms/portal-login-page.spec.tsx` and the
  existing backend authentication tests cover the reused login contract.
- AC-006: a login-flow integration or browser test asserts navigation to
  `https://app.vps2.com.br/portal` without accepting a caller-provided
  redirect.
- AC-007: portal entry tests assert redirect behavior from the leadpage host
  and the authenticated portal home on `app.vps2.com.br`.
- AC-008: backend CORS and authentication tests assert the exact origin and
  host-only cookie behavior.

## Delivery

The leadpage header no longer offers portal access. `https://app.vps2.com.br/`
renders the existing portal login page, and a successful sign-in opens
`https://app.vps2.com.br/portal` in the same tab. An unauthenticated portal
route on any other host redirects to that login URL. `/portal/change-password`
stays the public token form.

Session cookies remain host-only, with no `Domain` and `SameSite=lax`. The
versioned CORS example includes `https://app.vps2.com.br` beside
`https://portal.vps2.com.br`. No authentication route, cookie policy, or
persistence model changed, so `openapi.yaml`, Swagger, and `docs/database.md`
stay as they were. `docs/product.md`, `docs/design.md`, and `docs/api.md`
record the host boundary. DNS and TLS remain outside this repository.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-26-dedicated-portal-login-host`.
- Request: remove the portal button identified in the leadpage header and
  provide a dedicated DNS-accessible login page.
- Intake evidence: the desktop `Portal Vector` anchor in the fixed leadpage
  header, with the DOM path and approximate position supplied by the human.
- Related specification: `docs/specs/vetor-017-portal-login-page.md`
  records a previous dedicated-host login proposal.
- Related specification: `docs/specs/vetor-019-portal-entry-on-leadpage-host.md`
  records the implemented same-host `/portal` entry behavior.
- Contracts consulted: `docs/product.md`, `docs/design.md`, `docs/api.md`,
  `docs/database.md`, and `docs/conventions.md`.

## Follow-up decisions

- On 2026-10-26, the human selected `https://app.vps2.com.br/` as the
  dedicated login URL.
- On 2026-10-26, the human selected `https://app.vps2.com.br/portal` as the
  post-authentication destination.
- On 2026-10-26, the human selected a redirect from unauthenticated
  leadpage-host `/portal` visits to the dedicated login URL.
- On 2026-10-26, the human selected application host routing only; DNS and
  TLS provisioning remains outside this repository.
- On 2026-10-26, the human supplied the split login layout: navy brand column
  and light credential column, with the copy recorded in `docs/design.md`.

## Implementation evidence

- Changed: removed the desktop and mobile `Portal Vector` actions from `frontend/components/layout/header.tsx`. `frontend/app/page.tsx` renders `DedicatedPortalLogin` only when the host is `app.vps2.com.br`. `frontend/lib/portal-app-host.ts` fixes the login URL and the post-login URL, and `frontend/components/layout/authenticated-portal.tsx` sends an unauthenticated leadpage portal route to `https://app.vps2.com.br/`. Cookies in `backend/src/modules/portal/auth.service.ts` stay host-only. `infrastructure/.env.backend.example` and the local ignored backend env include `https://app.vps2.com.br` in `CORS`. Updated `docs/product.md`, `docs/design.md`, and `docs/api.md`.
- Tests: `npm run test` passed on 2026-10-26: backend 41 files and 258 tests, frontend 72 files and 278 tests, and 10 SDD validator tests. `npm run test:e2e` passed: 10 files and 86 tests. `npm run build` passed. `npm run typecheck --workspace frontend` passed. `npm run sdd:validate` passed for 30 specifications. Browser check on `http://localhost:3000/`: desktop and mobile navigation keep `Fale conosco` and do not show `Portal Vector`. A clean browser at `http://app.vps2.com.br:3000/` showed the login heading, e-mail, password, and recovery action, without the leadpage heading. An unauthenticated `http://localhost:3000/portal` navigated to `https://app.vps2.com.br/`. `http://localhost:3000/portal/change-password` stayed on the password form. After recreating the backend, a preflight for `https://app.vps2.com.br` returned that exact `Access-Control-Allow-Origin` with credentials, `https://portal.vps2.com.br` still did, and `https://evil.example` did not.
- Commands: `npm run typecheck` failed on the pre-existing `backend/test/tenants.e2e-spec.ts` assignment of `profile`, which is outside this change. `npm run lint` failed on pre-existing frontend errors in `portal-replace-tenant-photo-form.tsx` and `project-board.tsx`; the files touched here were clean. `npm run format:check` failed on 116 pre-existing files. The files added for this delivery, and the touched frontend and backend tests, were not in that list. `docs/api.md`, `docs/design.md`, and `docs/product.md` were already in it.
- Limitation: DNS and TLS for `app.vps2.com.br` were not provisioned. The authenticated portal home on that host was verified by `frontend/app/portal/entry.spec.tsx`, not by a signed-in browser session. The ignored local env was updated and the backend container was recreated; that file is not part of the commit. A cross-site API still uses `SameSite=lax` and host-only cookies, as this specification requires.

## Validation evidence

- AC-001: not validated.
- AC-002: not validated.
- AC-003: not validated.
- AC-004: not validated.
- AC-005: not validated.
- AC-006: not validated.
- AC-007: not validated.
- AC-008: not validated.
