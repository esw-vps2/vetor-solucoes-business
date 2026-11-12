---
id: VETOR-039
title: Principal DNS login at /login
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-28-principal-dns-login
created_at: 2026-10-28
updated_at: 2026-10-28
---

# Principal DNS login at /login

## Context

VETOR-030 serves the portal login page at `https://app.vps2.com.br/`. The
leadpage stays at `/` on every other host, including the principal DNS
`vps2.com.br`. An unauthenticated portal route on a leadpage host leaves that
host for `https://app.vps2.com.br/`.

The principal Nginx server already forwards `/` to the same Next.js
application. `/login` had no page, so the principal host could not show the
credential form.

On 2026-10-28 the human requested that the login screen be routed by the
principal DNS at `/login`, so the visitor can enter the account e-mail and
password there.

## Desired outcome

`https://vps2.com.br/login` renders the existing portal login page. The
principal host `/` remains the leadpage. After a successful sign-in, the same
tab opens `/portal` on that same origin.

## In scope

- Add the public route `/login` and render the existing `PortalLoginPage`.
- Keep `/` on `vps2.com.br` and every host other than `app.vps2.com.br` as the
  leadpage.
- Keep `/` on `app.vps2.com.br` as the same login page.
- Send an unauthenticated portal route on a leadpage host to `/login` on that
  same origin.
- After sign-in, open `/portal` on the current origin and ignore a
  caller-provided redirect.
- Allow the principal origin in the documented CORS list.
- Preserve the existing e-mail, password, recovery, MFA, session, and
  account-state behavior.

## Out of scope

- A new login form, new copy, or a username field distinct from e-mail.
- DNS or TLS provisioning.
- Nginx configuration on the VPS.
- Cookie `Domain`, `SameSite`, or session lifetime changes.
- Portal authorization, MFA policy, or password-recovery policy.
- Leadpage copy, header actions, or sections.

## Acceptance criteria

- AC-001: `https://vps2.com.br/login` renders the existing portal login page,
  including the heading `Acesse sua conta`, the corporate e-mail field, the
  password field, and password recovery. The page does not render the
  leadpage header, leadpage sections, portal sidebar, or a modal close
  control.
- AC-002: `https://vps2.com.br/` remains the leadpage and does not render the
  password field.
- AC-003: After successful authentication on `/login`, the same tab opens
  `/portal` on the same origin and does not accept an arbitrary
  caller-provided redirect.
- AC-004: An unauthenticated visit to a portal route on a leadpage host,
  including `vps2.com.br`, redirects to `/login` on that same origin. An
  authenticated visit to `/portal` on `app.vps2.com.br` renders the portal
  home. `/portal/change-password` stays the public password form.
- AC-005: Session cookies remain host-only, without a `Domain` attribute. The
  documented CORS allowlist includes the exact origin `https://vps2.com.br`.
  No new authentication endpoint is added.
- AC-006: `https://app.vps2.com.br/` still renders the same login page.
- AC-007: The sidebar `Sair` control, after a successful logout or a `401` from logout, opens `/login` on the current origin. Another logout failure stays on the portal and enables the control again.

## User experience

The login document is the split workspace already recorded in
`docs/design.md`. From `lg`, the navy brand column sits beside the light
credential column. Below `lg`, only the credential column is shown. The
heading remains `Acesse sua conta`. The fields remain `E-mail corporativo`
and `Senha`. `Esqueceu sua senha?` opens the existing recovery flow.

The principal host `/` keeps the leadpage header, sections, and contact
actions. There is no new portal action in that header.

## API and integrations

No new endpoint. The page reuses `POST /api/v1/auth/login` and the existing
MFA, recovery, refresh, logout, and session operations.

The versioned CORS example includes `https://vps2.com.br` and
`http://vps2.com.br:3000` beside the existing origins. A wildcard origin is
still dropped. The browser must call an origin on that allowlist. When the
deployed API is on another host, the principal Nginx server must also proxy
`/api/` to the backend so the session cookie stays on `vps2.com.br`. This
repository does not change that server.

## Data impact

No new persistence. Existing users, password hashes, refresh sessions,
password-recovery state, MFA challenges, and account status remain the model.

## Security

`/login` is a public authentication surface. The backend remains the
authority for credential validation, authorization, rate limiting, account
state, and session issuance.

Existing controls continue to apply:

- Validate authentication and recovery inputs at the NestJS boundary.
- Keep session cookies HttpOnly, `Secure` in production, `SameSite=Lax`,
  `Path=/`, and without a `Domain`.
- Do not add a user-controlled redirect destination.
- Do not widen CORS to `*`.
- Keep passwords, tokens, and secrets out of URLs, logs, and the frontend
  bundle.

Signing in on `https://vps2.com.br/login` opens
`https://vps2.com.br/portal` on the same host, so the host-only cookie is
available to that portal. Signing in on `app.vps2.com.br` still opens
`/portal` on that host.

## Testing

- AC-001: `frontend/app/login/page.spec.tsx` asserts the credential form and
  the absence of leadpage and portal chrome.
- AC-002: `frontend/app/home-host.spec.tsx` asserts the leadpage on
  `vps2.com.br`.
- AC-003: `frontend/app/login/page.spec.tsx` and
  `frontend/lib/portal-app-host.spec.ts` assert the same-origin `/portal`
  destination and reject a caller redirect.
- AC-004: `frontend/app/portal/entry.spec.tsx` asserts the principal-host and
  localhost redirects to `/login`, and the authenticated portal home on
  `app.vps2.com.br`. Password-change exclusion stays in
  `frontend/lib/portal-app-host.spec.ts`.
- AC-005: `backend/src/common/security/cors-origins.spec.ts` asserts
  `https://vps2.com.br` in the versioned CORS example. Cookie tests already
  assert that `Domain` is omitted.
- AC-006: `frontend/app/home-host.spec.tsx` asserts the login page on
  `app.vps2.com.br`.
- AC-007: `frontend/app/portal/layout.spec.tsx` asserts that `Sair` opens `/login`
  after logout, including a `401`, and does not leave the portal on another
  failure.

## Delivery

`frontend/app/login/page.tsx` renders `DedicatedPortalLogin`.
`frontend/lib/portal-app-host.ts` defines the principal login URL and
same-origin post-login navigation. `AuthenticatedPortal` sends an
unauthenticated leadpage portal route to `/login` on the current origin.
`docs/product.md`, `docs/design.md`, `docs/api.md`, and
`infrastructure/.env.backend.example` record the route and the principal
origin.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-28-principal-dns-login`.
- On 2026-10-28 the human requested that the login screen be served by the
  principal DNS at `/login` so the visitor can enter the account credentials.
- VETOR-030 remains the record of the dedicated host and the removed leadpage
  portal action. This specification replaces only the public login address
  and the unauthenticated leadpage redirect target.
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/api.md`, and `tasks/specs/vetor-030-dedicated-portal-login-host.md`.

## Implementation evidence

- Changed: `frontend/app/login/page.tsx` renders the existing login page at
  `/login`. `frontend/lib/portal-app-host.ts` sets the principal login URL to
  `https://vps2.com.br/login` and opens `/portal` on the current origin.
  `frontend/components/layout/authenticated-portal.tsx` redirects an
  unauthenticated leadpage portal route to that same-origin `/login`.
  `Sair` in `frontend/components/layout/authenticated-portal.tsx` opens
  `/login`. `infrastructure/.env.backend.example` includes `https://vps2.com.br`.
  Updated `docs/product.md`, `docs/design.md`, and `docs/api.md`.
- Tests: `npm run test --workspace frontend` passed on 2026-10-28 with 83 files and 337 tests. `npm run test --workspace frontend -- app/portal/layout.spec.tsx` later passed with 7 tests, including logout to `/login`. `npm run test --workspace backend -- src/common/security/cors-origins.spec.ts` passed with 3 tests. `npm run sdd:validate` passed for 39 specifications.
- Checks: `npm run typecheck --workspace frontend` passed after `next typegen`. `npm run lint --workspace frontend` passed with seven existing `@next/next/no-img-element` warnings and no errors. `npm run build --workspace frontend` passed and lists `/login`. `npm run test:e2e` was not run; this change does not alter an HTTP endpoint. The full backend suite was not run; only the CORS example assertion changed.
- Browser: `http://127.0.0.1:3000/login` showed `Acesse sua conta`, `E-mail corporativo`, and `Senha`, and accepted an e-mail value. `http://127.0.0.1:3000/` stayed the leadpage. `http://localhost:3000/portal` without a session continued to `http://localhost:3000/login`. A request with `Host: vps2.com.br:3000` to `/login` returned the same credential page.

## Validation evidence

- AC-001: implementation evidence recorded; awaiting human validation.
- AC-002: implementation evidence recorded; awaiting human validation.
- AC-003: implementation evidence recorded; awaiting human validation.
- AC-004: implementation evidence recorded; awaiting human validation.
- AC-005: implementation evidence recorded; awaiting human validation.
- AC-006: implementation evidence recorded; awaiting human validation.
- AC-007: implementation evidence recorded; awaiting human validation.
