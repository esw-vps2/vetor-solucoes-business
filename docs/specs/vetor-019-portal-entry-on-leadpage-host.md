---
id: VETOR-019
title: Portal entry on the leadpage host at /portal
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-01-portal-entry-same-host
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Portal entry on the leadpage host at /portal

## Context

The leadpage is path `/` on the host that serves the public site. The
authenticated portal home is path `/portal` on that same application.
VETOR-017, which is `approved`, routes login to a different host:
`https://portal.vps2.com.br/` is the login document, and a successful
sign-in opens `https://portal.vps2.com.br/portal`.

On 2026-10-01 the requester opened `/portal` without a session and saw
`Sua sessão não está ativa`, with the instruction to use the `Portal
Vector` button. That button leaves the current host. The requester
corrected the address: the portal is the leadpage address plus `/portal`.

This specification replaces only the entry address recorded in VETOR-017.
MFA, password recovery, account block, and reactivation stay as approved
there.

## Desired outcome

A visitor reaches the portal at `/portal` on the same host as the
leadpage. With no session, that address shows the existing portal login.
With a session, it shows the existing Painel. Path `/` stays the leadpage
on every host.

## In scope

- `Portal Vector` in the leadpage header, desktop and mobile, links to
  `/portal` on the current origin and stays in the same tab.
- Path `/` renders the leadpage on every host, including
  `portal.vps2.com.br` and `localhost`.
- Path `/portal` with no session renders the existing login page.
- Path `/portal` with a session renders the existing Painel.
- A successful sign-in on `/portal` reveals the Painel on that same
  origin. The address does not change host.
- Unauthenticated visits to `/portal/projetos`, `/portal/projetos/{id}`,
  `/portal/relatorios`, `/portal/financeiro`, and `/portal/powerbi` render
  the same login page. After a successful sign-in, that visit shows the
  authenticated page for the path that was opened.
- The installed app still has start URL `/`. In standalone display, a
  start on `/` navigates to `/portal` on the current origin.
- Session loss on a portal route shows the login page on that route.
  Logout still leaves the portal for `/`.

## Out of scope

- A new login form, new copy, or a new portal route.
- Changing MFA, the e-mailed code, the countdown, password recovery,
  account block, or reactivation from VETOR-017.
- Choosing the MFA digit count.
- Publishing DNS or a TLS certificate.
- `/portal/change-password`, which stays the public token form.
- Logout destination. `Sair` still opens `/`.
- Widening or narrowing the configured CORS list in a deployed
  environment file.

## Acceptance criteria

- AC-001: On the leadpage, desktop and mobile `Portal Vector` are links
  to `/portal` on the same origin, in the same tab. They do not point at
  `https://portal.vps2.com.br/` and they do not open the access dialog.
- AC-002: Path `/` renders the leadpage for `portal.vps2.com.br`,
  `localhost`, and any other host.
- AC-003: `/portal` with no session shows the login page, including the
  heading `Portal Vector` and the e-mail and password fields. It does not
  show `Sua sessão não está ativa`.
- AC-004: `/portal` with a session shows `Bem-vindo ao Portal Vector.`
- AC-005: After the e-mailed code is accepted on `/portal`, the same
  document shows `Bem-vindo ao Portal Vector.` and the browser stays on
  the leadpage host.
- AC-006: `/portal/projetos`, `/portal/relatorios`, `/portal/financeiro`,
  `/portal/powerbi`, and `/portal/projetos/{id}` with no session show the
  login page. After a successful sign-in they show that route's
  authenticated content without changing host.
- AC-007: `/portal/change-password` still renders the public password form
  for a token and does not render the login page in place of that form.
- AC-008: Standalone display opened at `/` navigates to `/portal` on the
  current origin and does not navigate to `https://portal.vps2.com.br/`.

## User experience

The login document stays the panel already specified for `PortalLoginPage`
in `docs/design.md`: navy page, navy-50 panel, one `h1`, no leadpage
header, and no portal sidebar. It moves from host `portal.vps2.com.br` at
`/` to path `/portal` on the leadpage host when no session exists.

`Portal Vector` keeps the accent pill on desktop and the existing mobile
item. The href is the relative path `/portal`. The link has no
`target="_blank"`.

The unauthenticated panel `Sua sessão não está ativa` is removed. An
expired or missing session on a portal route shows the login panel on
that route. `Validando sua sessão...` stays while the session check is in
progress.

After sign-in, the portal shell replaces the login panel in place. The
visitor is not sent to another host.

## API and integrations

No new HTTP route. Login, MFA verify, MFA resend, password recovery, and
session cookies stay the VETOR-017 contract. The browser calls them from
the leadpage origin.

`NEXT_PUBLIC_PORTAL_LOGIN_URL` no longer selects the login document.
Delivery removes that public variable from the frontend example and from
the compose mapping. The portal entry is the relative path `/portal`.

## Data impact

No schema change. No migration.

## Security

The login page remains public. Portal data remains behind the existing
session. Cookies stay host-only on the origin that served the page. Do
not set a `Domain` attribute and do not change `SameSite`.

CORS stays an explicit list. This specification does not add
`https://portal.vps2.com.br` as a required origin and does not allow `*`.
Do not edit a deployed environment file to drop an origin an operator
still uses.

`/portal/change-password` stays reachable without a session. Showing the
login page on other `/portal` routes does not authorize those routes.
The backend remains the authority.

## Testing

- AC-001: `frontend/components/layout/header.spec.tsx`
- AC-002: `frontend/app/page.spec.tsx`
- AC-003: `frontend/components/layout/authenticated-portal` coverage in
  `frontend/app/portal/page.spec.tsx`
- AC-004: `frontend/app/portal/page.spec.tsx`
- AC-005: `frontend/components/forms/portal-login-page.spec.tsx` and
  `frontend/app/portal/page.spec.tsx`
- AC-006: portal route tests for projetos, relatorios, financeiro,
  powerbi, and the project board, asserting the login page without a
  session and the authenticated surface after sign-in
- AC-007: `frontend/components/forms/change-password-form.spec.tsx`
- AC-008: `frontend/components/layout/header.spec.tsx`

## Delivery

Do not implement while `status` is `in_review`.

When approved: point `Portal Vector` at `/portal` in the same tab, render
the leadpage at `/` for every host, and render `PortalLoginPage` for a
portal route that has no session, except `/portal/change-password`.
After sign-in, show that route's authenticated content on the same
origin. Standalone startup at `/` goes to `/portal` on the current
origin. Remove the host check that treats `portal.vps2.com.br` as the
login document.

Update `docs/product.md` and `docs/design.md` so the portal login route
is `/portal` on the leadpage host, path `/` is the leadpage on every
host, and standalone startup opens `/portal` on that host. Leave the PWA
start URL as `/`.

Do not change MFA, cookies' `Domain` or `SameSite`, or the logout
destination.

## Traceability

- Source: human prompt on 2026-10-01, after the unauthenticated `/portal`
  screen `Sua sessão não está ativa`.
- `source_kind: human_prompt`
- `source_reference: chat-2026-10-01-portal-entry-same-host`
- Replaces the entry address in
  `docs/specs/vetor-017-portal-login-page.md`: login is no longer
  `https://portal.vps2.com.br/`, and the portal home is no longer that
  host plus `/portal`. VETOR-017 stays the authority for MFA and account
  block.
- Current behavior: `frontend/app/page.tsx`,
  `frontend/lib/portal-login-host.ts`,
  `frontend/components/layout/header.tsx`,
  `frontend/components/layout/authenticated-portal.tsx`.

Recorded decision:

1. The portal address is the leadpage address with path `/portal`.

## Implementation evidence

- Changed: portal entry is `/portal` on the leadpage host. `Portal Vector` links to `/portal` in the same tab. Path `/` is the leadpage on every host. A portal route without a session renders `PortalLoginPage`, and a successful code replaces that panel with the route's authenticated content on the same origin. Standalone startup at `/` uses the Next.js router to open `/portal`. `/portal/change-password` stays the public token form. Logout still opens `/`. Removed `frontend/lib/portal-login-host.ts` and `NEXT_PUBLIC_PORTAL_LOGIN_URL` from `infrastructure/.env.frontend.example` and `infrastructure/docker-compose.yml`. Updated `docs/product.md` and `docs/design.md`.
- Tests: frontend unit 67 files, 200 tests passed on 2026-10-01. `npm run typecheck --workspace frontend` passed. `npm run lint --workspace frontend` passed with existing image warnings outside this change. `npm run build --workspace frontend` passed. `npm run test:e2e` was not run because this change does not cross HTTP. Browser check on `http://localhost:3000/`: the leadpage stays, `Portal Vector` has `href="/portal"` with no `target`, and activating it opens the login form at `http://localhost:3000/portal` in the same tab. `http://localhost:3000/portal/change-password` shows `Altere a senha` and does not show the login form.
- Limitation: `infrastructure/.env.frontend` still lists `NEXT_PUBLIC_PORTAL_LOGIN_URL`. The application no longer reads it. That file was left unchanged because this specification does not edit a deployed environment file.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
- AC-007: not recorded
- AC-008: not recorded
