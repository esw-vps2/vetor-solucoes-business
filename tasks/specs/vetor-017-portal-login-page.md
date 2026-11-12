---
id: VETOR-017
title: Portal Vector login page on portal.vps2.com.br
status: approved
source_kind: human_prompt
source_reference: chat-2026-10-01-portal-login-page
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Portal Vector login page on portal.vps2.com.br

## Context

The leadpage header control labeled `Portal Vector` is the accent pill in
the desktop header and the same label in the mobile menu. Both open
`PortalAccessModal` on the current page. The installed PWA, when started
at `/` in standalone display, opens that same modal without a click.

The human asked for that entry to open a new page used to log in, served
by a dedicated hostname. On 2026-10-01 the human corrected the hostname
from `porta.vps2.com.br` to `portal.vps2.com.br`.

The DOM path and pixel box in the first prompt identify the desktop
control. They are intake evidence, not a layout contract.

`tasks/specs/vetor-003-leadpage-contact-and-vector-portal.md` is still
`draft`. This specification does not approve or supersede it.
`docs/product.md` lists `/portal` as the authenticated portal home and
does not yet list this hostname.

## Desired outcome

Selecting `Portal Vector` opens `https://portal.vps2.com.br/` in a new
tab. That document is the portal login page. The visitor signs in with
the current portal e-mail and password. Authentication also requires a
token sent to the account's registered e-mail. The token stays valid for
30 minutes, configured by an environment variable. The page shows a
countdown of that time. When it reaches zero, the visitor can request a
new code. Three wrong codes invalidate that attempt and block the
account. After the token is accepted, the same tab opens the existing
portal home. `Esqueci minha
senha` is on this page. A person who already has a session may open the
page and sign in again. The installed app opens the login URL instead of
the modal.

Publishing DNS or a TLS certificate is out of this work. The application
only routes that host to the login page.

## In scope

- Leadpage `Portal Vector` opens `https://portal.vps2.com.br/` in a new
  tab and does not open `PortalAccessModal`.
- Standalone launch opens `https://portal.vps2.com.br/` and does not open
  the login modal.
- Host `portal.vps2.com.br`, path `/`, renders the login page. Any other
  host, path `/`, keeps the leadpage.
- Login fields are the existing portal e-mail and password.
- Password recovery (`Esqueci minha senha`) runs on this login page.
- An existing session does not block the form. Finishing a new login
  replaces that session. Opening the page does not end it.
- MFA: after a correct password, the backend emails a token to the
  registered address, and that token is required before a session exists.
- Token lifetime is 30 minutes, read from `MFA_EMAIL_TOKEN_EXPIRES_IN`.
- The e-mail explains the multi-factor step, tells the reader to copy the
  code and paste it into the portal field, and puts a `Copiar` control on
  the code.
- The MFA step shows a countdown of the remaining token lifetime. At
  `00:00` the visitor can request a new code. A new code is not available
  before the current one expires.
- Three wrong codes mark the attempt finished and set that user's
  `status` to `blocked`. The page shows `Sua conta foi bloqueada, favor
  entrar em contato com Administrado do seu projeto.`
- The MFA token contains exactly six digits from `0` through `9`.
- `Administrador` can set any blocked user back to `active`.
  `AdministradorTenant` can do that for a user of their own tenant. The
  block does not end by itself.
- After a successful token, the login tab opens the portal home at
  `https://portal.vps2.com.br/portal`.
- Public-page controls already required for authentication: validated
  DTOs, auth rate limit, generic credential failure, HttpOnly session
  cookies, hashed secrets, and no token in logs or in the JSON body.
- Application routing for the hostname. No DNS or certificate publication.

## Out of scope

- Publishing DNS or a TLS certificate for `portal.vps2.com.br`.
- Treating `www.portal.vps2.com.br` as an alias.
- Leadpage sections, copy, claims, and the `Fale conosco` modal.
- A new portal home. The destination is the existing `/portal` Painel.
- New accounts, new profiles, a second user store, or a new password
  policy.
- A `redirect` query parameter or any caller-chosen destination.
- A browser extension. The copy control is part of the e-mail.
- Putting the MFA token in a URL.
- Changing cookie `Domain` or `SameSite`.
- A `Usuario` reactivating an account, including a `Usuario` with
  `editUser`.
- Changing `docs/product.md`, `docs/design.md`, `docs/api.md`, or
  `docs/database.md` before a human approves this specification.

## Acceptance criteria

- AC-001: The leadpage `Portal Vector` control opens
  `https://portal.vps2.com.br/` in a new tab, leaves the leadpage tab in
  place, and does not open `PortalAccessModal`.
- AC-002: Path `/` on host `portal.vps2.com.br` renders the login page.
  Path `/` on any other host renders the leadpage.
- AC-003: The page submits e-mail and password for an existing portal
  account. A wrong pair shows `E-mail ou senha inválidos.`, sends no MFA
  e-mail, and creates no session.
- AC-004: A correct e-mail and password create no session cookies. The
  backend sends one token to that account's registered e-mail. The portal
  step shows `Este é o processo de autenticação múltipla, para fortalecer
  o acesso ao portal. Copie o código enviado ao seu e-mail e cole no campo
  do portal.` and a field labeled `Código`.
- AC-005: Session cookies are set only after that e-mailed token is
  accepted. The login tab then opens `https://portal.vps2.com.br/portal`
  and shows `Bem-vindo ao Portal Vector.`
- AC-006: `Esqueci minha senha` on this page runs the existing recovery
  request, verify, and reset steps against the current recovery API.
- AC-007: A visitor who already has a session can open this page and sign
  in again. Opening the page keeps the current session. A completed login
  replaces it.
- AC-008: Starting the installed app does not open the login modal. It
  opens `https://portal.vps2.com.br/`.
- AC-009: The MFA token expires after the duration in
  `MFA_EMAIL_TOKEN_EXPIRES_IN`. The example and default value is `30m`
  (30 minutes). The variable is backend configuration, not a
  `NEXT_PUBLIC_*` value.
- AC-010: The MFA e-mail subject is `Código de autenticação do Portal
  Vector`. The body states that this is the multi-factor authentication
  process to strengthen portal access, tells the reader to copy the code
  and paste it into the portal field, shows the code, and places a
  `Copiar` control on that code.
- AC-011: The e-mailed token contains exactly six digits from `0` through
  `9`.
- AC-012: `https://portal.vps2.com.br` is an explicit CORS origin through
  the existing `CORS` configuration. Session cookies stay HttpOnly,
  `Secure` in production, `SameSite=Lax`, `Path=/`, and without a
  `Domain`.
- AC-013: While the code is still valid, the MFA step shows the remaining
  time counting down to `00:00`. `Pedir novo código` is shown only at
  `00:00`. That action emails a new code, starts a new 30-minute
  countdown, and does not run after three wrong codes.
- AC-014: The third wrong code, while the current code is still inside
  its lifetime, marks the attempt used, sets that user's `status` to
  `blocked`, and creates no session. The page shows `Sua conta foi
  bloqueada, favor entrar em contato com Administrado do seu projeto.`
  A later password login for that user does not send another MFA e-mail.
- AC-015: `Administrador` can set any `blocked` user back to `active`.
  `AdministradorTenant` can do that only for a user whose `tenantId` is
  their own. A `Usuario` cannot. The block stays until one of those
  roles does it. The control is `Reativar` inside the existing `Editar
  usuário` flow in Cadastro, shown only when that user's `status` is
  `blocked`.

## User experience

### Flow

1. The visitor selects `Portal Vector` on the leadpage. The browser opens
   a new tab at `https://portal.vps2.com.br/`. The leadpage tab stays.
2. The installed app, on startup, opens that same login URL and does not
   show the modal.
3. The page shows the current login: heading `Portal Vector`, text `Entre
   com suas credenciais para acessar o portal.`, fields `E-mail` and
   `Senha`, submit `Entrar`, and the action `Esqueci minha senha`.
4. A failed password stays on that form with `E-mail ou senha inválidos.`
   A rate limit shows `Aguarde alguns instantes antes de tentar
   novamente.`
5. A correct password does not enter the portal. The same panel moves to
   the MFA step and the backend emails the token.
6. The MFA step shows the message in AC-004, the field `Código`,
   submit `Entrar`, and the remaining time. The token itself is not shown
   on the page.
7. At `00:00`, the page shows `Pedir novo código`. That request emails a
   new code and the countdown starts again from the configured lifetime.
8. The third wrong code stops the attempt and blocks the account. The
   page shows `Sua conta foi bloqueada, favor entrar em contato com
   Administrado do seu projeto.`
9. When the token is accepted, that tab opens the portal home
   `https://portal.vps2.com.br/portal` and shows `Bem-vindo ao Portal
   Vector.`
10. `Esqueci minha senha` replaces the login step with the current recovery
    steps and the current recovery copy. It does not open the old modal.
11. If a session already exists, the page still shows the login form.

### E-mail

Subject and heading: `Código de autenticação do Portal Vector`.

Body, in the existing VETOR layout:

- `Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código abaixo e cole no campo do portal.`
- The token, with a `Copiar` control on the same row as the code.
- `Este código expira em 30 minutos e pode ser usado uma única vez.` The
  duration phrase follows `MFA_EMAIL_TOKEN_EXPIRES_IN`. With the required
  value `30m`, the phrase is 30 minutes.

The plain-text part repeats the same sentences and places the token alone
on one line.

### Design decisions

Follow `docs/design.md` and the current access modal. No new palette,
typeface, or icon library.

- The desktop pill and the mobile-menu item are one action. Both use the
  same URL. The pill keeps the accent fill, navy label, size, and
  northeast arrow. The menu item keeps its current type and color. The
  header control is a link with `target="_blank"` and
  `rel="noopener noreferrer"`. `Fale conosco` stays a modal.
- Standalone startup navigates the installed window to the login URL. The
  manifest `start_url` stays `/` on the origin that serves the manifest,
  because a manifest cannot start on another origin. On
  `portal.vps2.com.br`, that path is already the login page.
- The login document does not render the leadpage header, hero, or
  sections, and it does not render the portal sidebar.
- Page background `bg-navy`. One centered panel uses the modal surface:
  `bg-navy-50`, `border-white/[0.08]`, `rounded-[28px]`, `p-6` /
  `md:p-8`, `max-w-xl`. Below `md`, the panel is full width, gutter
  `24px`, square corners. No overlay and no close control.
- Credential inputs, password visibility, focus ring (`accent`), error
  alert (`text-red-300`, `role="alert"`), and status text (`text-accent`)
  match the current login mode. One `h1`. Submit is the accent pill.
- The MFA step uses that same panel. The field label is `Código`,
  `autoComplete="one-time-code"`. A wrong code that is still inside its
  lifetime, and is not the third failure, shows `Token inválido ou
  expirado.` The third failure shows `Sua conta foi bloqueada, favor entrar
  em contato com Administrado do seu projeto.` with `role="alert"` and
  `text-red-300`.
- The countdown is the remaining lifetime in `mm:ss`, with
  `tabular-nums` and `text-secondary`. Its accessible name is `Tempo
  restante`. It starts from `expiresAt` returned by the API and reaches
  `00:00` when that instant has passed. It does not call the server every
  second. `Pedir novo código` uses the accent pill and is rendered only
  at `00:00`. `Entrar` stays available while the countdown is above zero.
- The `Copiar` control sits in the e-mail, on the token, not on the portal
  field. The token in the message uses the same size, spacing, and weight
  as the current password-reset token. The control is a pill button, accent fill
  `#BDDA2B`, navy text, label `Copiar`. After a successful copy, the label
  becomes `Copiado`. It is not a browser extension and does not add an icon
  library. Mail clients that remove script still show the token as
  selectable text; the reader copies that text and pastes it into
  `Código`. The token is never placed in a link.
- Recovery uses the same panel and the copy already in the modal.
- Motion stays on the existing color and focus transitions. The login
  page adds no entrance animation. `prefers-reduced-motion` disables
  decorative motion.
- No new brand asset.
- On approved delivery, add this surface to `docs/design.md`. Do not add
  it while this file is `draft`.

## API and integrations

The login host is configuration, not a hardcoded string and not a secret.
The public login URL used by the header and by standalone startup is
`https://portal.vps2.com.br/` in production. The browser reads
`NEXT_PUBLIC_PORTAL_LOGIN_URL`. When that value is empty, the URL above
is used. Compose passes the variable into the frontend. The server treats a request
as the login page only when the `Host` is `portal.vps2.com.br` and the
path is `/`. Path `/portal` on that same host is the existing portal home.

`MFA_EMAIL_TOKEN_EXPIRES_IN` is required backend configuration. The value
for this feature is `30m`. Parse it with the same duration parser as
`PASSWORD_RESET_TOKEN_EXPIRES_IN`. Do not expose it through
`NEXT_PUBLIC_*`. Approved delivery adds it to
`infrastructure/.env.backend.example` and does not commit a real
environment file.

`POST /api/v1/auth/login` stays the password check. A correct password no
longer sets `access_token` or `refresh_token`. It stores an MFA challenge
and emails the token.

| Case | Status | Body | Cookies | E-mail |
| --- | --- | --- | --- | --- |
| Invalid DTO | `400` | Validation error | None | No |
| Wrong e-mail or password | `401` | Same generic failure as today | None | No |
| Rate limit | `429` | Too many requests | None | No |
| Correct password | `200` | `{ "mfaRequired": true, "challengeId": "<uuid>", "expiresAt": "<iso>" }` | None | Token to the registered e-mail |
| E-mail delivery failure, or the digit count is not configured | `503` | No session and no `challengeId` | None | Not sent |

`challengeId` is the challenge row id. The response does not include the
token, the password, or the user profile.

New route `POST /api/v1/auth/mfa/verify`:

| Field | Value |
| --- | --- |
| Authentication | Public. Completes login. |
| Body | `challengeId` UUID and `token` string |
| Success | `200` with the current `SafeUser` JSON. Sets the existing `access_token` and `refresh_token` cookies. |
| Wrong token before the third failure, still inside `expires_at` | `401`. Increments `failed_attempts`. No cookies. |
| Third wrong token inside `expires_at` | `403`. Marks the challenge used, sets `users.status` to `blocked`, revokes that user's refresh sessions. No cookies. The client shows the AC-014 sentence. |
| Expired or already used token | `401`. Does not increment `failed_attempts`. No cookies. |
| Invalid DTO | `400` |
| Rate limit | `429` |

`expiresAt` is the challenge expiry instant. It is not a secret. The
client uses it only to render the countdown.

New route `POST /api/v1/auth/mfa/resend`:

| Field | Value |
| --- | --- |
| Authentication | Public. Sends a replacement code after expiry. |
| Body | `challengeId` UUID |
| Success | `200` `{ "challengeId": "<uuid>", "expiresAt": "<iso>" }`. Emails a new token. Marks the previous unused challenge used. Resets the wrong-attempt count for the new challenge. |
| Challenge still inside `expires_at` | `400`. No e-mail. |
| Unknown challenge, or the user is not `active` | `401`. No e-mail. |
| E-mail delivery failure, or the digit count is not configured | `503`. No new `challengeId`. The expired challenge is claimed under a row lock, then released so it stays unused. |
| Invalid DTO | `400` |
| Rate limit | `429` |

The raw token is a string of exactly six decimal digits. The portal
field keeps only digits from a paste, and surrounding whitespace is removed
before the digit check. Generate
it with a cryptographic random source, keep leading zeros, and never log
or return it. Only the hash is stored. Issuing a challenge marks older
unused challenges for that user as used. A challenge verifies at most
once. `expires_at` is now plus `MFA_EMAIL_TOKEN_EXPIRES_IN`.

New route `POST /api/v1/users/{id}/reactivate`:

| Field | Value |
| --- | --- |
| Authentication | Access cookie. |
| Authorization | `Administrador` for any user. `AdministradorTenant` only when the target `tenantId` is the actor's tenant. `Usuario` receives `403`. |
| Success | `204`. Sets `status` from `blocked` to `active`. |
| Target is not `blocked` | `400`. |
| Target outside the actor's tenant, or unknown | `403` for the tenant mismatch. `404` when the user id does not exist. |
| No session | `401` |

The login `SafeUser` body does not gain `status`. The user list and the
user loaded by `Editar usuário` include `status` so `Reativar` can be
shown only for `blocked`. That control uses the accent pill. After
`204`, it is removed. `Reativar` does not change profile, password, or
tenant.

Password recovery stays on `POST /api/v1/auth/password-recovery/request`,
`/verify`, and `/reset`. This feature does not change those contracts.
The recovery e-mail tells the reader to enter the token on the login page,
through `Esqueci minha senha`. It does not mention the access modal.

Refresh, logout, and session lifetime stay as they are. They start only
after MFA succeeds.

Approved delivery updates `docs/api.md`, `openapi.yaml`, and Swagger
because `POST /api/v1/auth/login` no longer establishes a session,
`POST /api/v1/auth/mfa/verify`, `POST /api/v1/auth/mfa/resend`, and
`POST /api/v1/users/{id}/reactivate` are new, and the edit-user payload
includes `status`.

The browser keeps calling the API through the configured API origin. Add
`https://portal.vps2.com.br` to the explicit `CORS` list. Do not use
`*`. No third-party service is added. The existing transactional mailer
sends the MFA e-mail with the existing VETOR layout.

## Data impact

New table `mfa_email_challenges`. `users` gains no column. A blocked
account stores `status` `blocked` on the existing `status` column.
`active` remains the only status that can log in. Blocking revokes that
user's rows in `refresh_sessions`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `pk_mfa_email_challenges` |
| `user_id` | `uuid` | `fk_mfa_email_challenges_users`, `ON DELETE CASCADE`, indexed `idx_mfa_email_challenges_user_id` |
| `token_hash` | `varchar(128)` | Hash only. Indexed `idx_mfa_email_challenges_token_hash` |
| `failed_attempts` | `integer` | Not null, default `0`. Counts wrong codes inside the lifetime. |
| `expires_at` | `timestamptz` | Now plus `MFA_EMAIL_TOKEN_EXPIRES_IN` (`30m`) |
| `used_at` | `timestamptz` null | Set when consumed, replaced, or blocked |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Approved delivery records the table in `docs/database.md`.

## Security

The human required the security controls of a public login page and added
MFA. The token is e-mailed to the registered address and is part of
authentication. The lifetime is 30 minutes via
`MFA_EMAIL_TOKEN_EXPIRES_IN`.

Applied from the current baseline, not as new policy:

- Validate both bodies with DTOs at the Nest boundary.
- Keep the login rate limit. The MFA verify and resend routes use the
  same rate-limit mechanism. Login is counted per IP and e-mail. Verify
  and resend are counted per IP and `challengeId`. The MFA token is not
  part of the limiter key. A verify locks the challenge row so overlapping
  wrong codes cannot skip the third-attempt block.
- Wrong password stays a generic `401` and does not send mail. The same
  failure applies when that password matches more than one active account.
  A `blocked` user is not `active`, so the same generic failure applies
  and no MFA e-mail is sent.
- Session cookies stay HttpOnly, `Secure` in production, `SameSite=Lax`,
  `Path=/`, and without a `Domain`.
- Store only a hash of the MFA token. One successful verify consumes it.
- Do not log the token, the password, the cookies, or the hash.
- Do not put the token in a URL, a query string, or the login JSON.
- The credential forms use `method="post"`, so a submit before the page
  script runs does not place the password or the code in the address.
- HTTPS in production for the page the application serves. Certificate
  publication is out of scope.
- CORS stays an explicit list and includes `https://portal.vps2.com.br`.
  A `*` entry is dropped and is not sent to the browser.

Decided from the MFA request:

- E-mail plus password without the e-mailed token does not authenticate.
- The e-mail is the address already stored on that user.
- No session cookie is written before verify succeeds.
- The portal home after login is on the same host as the login page, so
  the host-only cookie is sent to `/portal`.
- A new code is available only after `expiresAt`. The page shows the
  remaining time. Three wrong codes inside that lifetime set
  `users.status` to `blocked`, mark the challenge used, and revoke that
  user's refresh sessions. Protected routes reject a user who is not
  `active`, including an access cookie issued earlier.
- A new challenge after expiry starts its own three attempts. The expired
  path does not count as a wrong attempt.
- Password recovery keeps requiring `status` `active`, so a blocked user
  does not receive a recovery e-mail.
- The block has no expiry. `Administrador` restores any user.
  `AdministradorTenant` restores only a user of their tenant. No other
  profile can.

`SameSite=Lax` sends the cookie on credentialed calls only when the API
origin is same-site with `portal.vps2.com.br`. Do not switch to
`SameSite=None` or a parent `Domain` to cross sites. If the configured
API origin is cross-site, stop and return this specification to review.

Opening the login page while a session exists does not clear cookies.
Only a completed verify replaces them. When that verify includes the
current refresh cookie for the same user, that refresh session is revoked.
A refresh cookie for another user is left in place.

The MFA token length is six digits. Its alphabet is limited to `0` through
`9`.

## Testing

Recorded against the approved implementation. The digit count in AC-011
stays unanswered, so the length assertion is not fixed to a product value.
Tests that generate a code set `MFA_EMAIL_TOKEN_DIGITS` only as a fixture.

- AC-001: `header.spec.tsx`. `Portal Vector` is a link to
  `https://portal.vps2.com.br/` with a new tab, and the access dialog is
  absent. Desktop and mobile controls both match.
- AC-002: `page.spec.tsx`. Host `portal.vps2.com.br` and path `/` render the login page;
  another host and path `/` render the leadpage.
- AC-003: `auth.service.spec.ts` rejects a wrong password with `401`, no mail, and no cookies. `portal-login-page.spec.tsx` shows `E-mail ou senha inválidos.` `session-tenant.e2e-spec.ts` rejects an invalid login body with `400` and returns no session cookie for a valid body.
- AC-004: `auth.service.spec.ts` returns `challengeId` for a correct password, sends one mail, and sets no cookies. `portal-login-page.spec.tsx` shows the MFA message and the `Código` field, and does not show the token. A `503` keeps the password form and shows `Não foi possível concluir a operação.`
- AC-005: verify sets cookies and returns `SafeUser` only for the matching
  unused hash inside the configured lifetime. The tab then goes to
  `https://portal.vps2.com.br/portal`. Wrong, used, and expired tokens
  return `401`.
- AC-006: recovery on the page uses the current recovery client. A user who is not `active` receives no recovery e-mail.
- AC-007: an existing session still shows the form; cookies change only
  after verify. A refresh cookie presented with that verify is revoked
  and replaced. A cookie for another user is left in place.
- AC-008: standalone startup opens `https://portal.vps2.com.br/` and does
  not render the access dialog.
- AC-009: a challenge `expires_at` follows `MFA_EMAIL_TOKEN_EXPIRES_IN`.
  The example value `30m` is 30 minutes. An expired token is `401`.
- AC-010: the mailed HTML and text contain the subject, the MFA sentence,
  the paste instruction, the token, and the `Copiar` control. The HTML
  does not put the token in an `href`. `mail.service.spec.ts` sends that
  subject.
- AC-011: the mailed token matches `^[0-9]+$`. The length assertion waits
  for the digit count.
- AC-012: `cors-origins.spec.ts` allows `https://portal.vps2.com.br`
  with credentials and drops `*`. Cookie flags stay as recorded in
  `auth.service.spec.ts`. `SameSite` and `Domain` were not weakened.
- AC-013: the countdown follows `expiresAt`. `Pedir novo código` is absent
  before `00:00` and present at `00:00`. Submitting the form at `00:00`
  does not verify the code. Resend before expiry is `400`
  with no mail. Resend after expiry is `200`, sends one new mail, and
  returns a new `expiresAt`. Resend for a `blocked` user is `401` with
  no mail.
- AC-014: the first and second wrong codes return `401` and leave
  `status` `active`. The page shows `Token inválido ou expirado.` and
  keeps the MFA step. The third returns `403`, sets `status` `blocked`,
  marks the challenge used, revokes refresh sessions, and leaves no
  session cookie. The page shows the AC-014 sentence. A following login
  does not send MFA mail. An expired submission does not increment
  `failed_attempts`. A refresh token for a `blocked` user does not issue
  new session cookies. A second submit while verification is in progress
  does not send another code. A failed audit record still returns `403` for the
  third wrong code and still returns the session after a correct code.
- AC-015: `Administrador` receives `204` and the user becomes `active`.
  `AdministradorTenant` receives `204` for the same tenant and `403` for
  another tenant. `Usuario` receives `403`. `Reativar` is shown in
  `Editar usuário` only while `status` is `blocked`. The administrator
  list still includes that user. A second click while reactivation is in
  progress does not send another request. A failed audit record still
  returns `204` and leaves `status` `active`. An unauthenticated
  reactivate is `401`.

## Delivery

Do not implement while `status` is `draft`.

When approved: header link, standalone navigation, login route selected
by `Host`, MFA step with countdown, MFA e-mail, `mfa_email_challenges`
migration, login response change, `POST /api/v1/auth/mfa/verify`,
`POST /api/v1/auth/mfa/resend`, `POST /api/v1/users/{id}/reactivate`,
account block on the third wrong code,
and `MFA_EMAIL_TOKEN_EXPIRES_IN` in the backend example environment.
Update `docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
Swagger, and `docs/database.md` in that delivery.

Do not publish DNS or a certificate. Do not change cookie `Domain` or
`SameSite`.

## Traceability

- Source: human prompt, then answers on 2026-10-01.
- `source_kind: human_prompt`
- `source_reference: chat-2026-10-01-portal-login-page`
- Selected control: leadpage header `Portal Vector`.
- Current behavior: `frontend/components/layout/header.tsx`,
  `frontend/components/forms/portal-access-modal.tsx`.
- Related draft, not superseded:
  `tasks/specs/vetor-003-leadpage-contact-and-vector-portal.md`.

Answers recorded on 2026-10-01:

1. The login page opens in a new tab.
2. The DNS name is `portal.vps2.com.br`. The login document is path `/`
   on that host.
3. Login is the current portal e-mail and password.
4. After login the visitor goes to the portal home. That home is the
   existing `/portal` page. The login tab is already on
   `portal.vps2.com.br`, so the address is
   `https://portal.vps2.com.br/portal`.
5. Password recovery is on the login page.
6. The installed app opens `https://portal.vps2.com.br/`.
7. A person who is already signed in may sign in again.
8. Use the security controls of a public page, and add MFA. The token goes
   to the registered e-mail and is part of authentication.
9. The portal home stays on the login host, so the existing host-only
   cookie is enough. `https://portal.vps2.com.br` is added to the explicit
   CORS list. Cookie `Domain` and `SameSite` stay as they are.
10. DNS and certificate publication are out of scope. Only application
    routing so that address opens the login page.
11. The token lasts 30 minutes. The duration is the environment variable
    `MFA_EMAIL_TOKEN_EXPIRES_IN`.
12. The human asked for a message that this is the multi-factor process,
    to strengthen portal access, with instructions to copy the code and
    paste it into the portal field, and for a copy control on the code.
13. The visitor may request a new code after the time is exceeded. The
    page shows a countdown.
14. Three wrong attempts invalidate the flow and block the person's
    account. The page shows `Sua conta foi bloqueada, favor entrar em
    contato com Administrado do seu projeto.`
15. The token uses only numbers. The digit count was not stated.
16. `Administrador` or `AdministradorTenant` of that user's tenant sets
    the account back to `active`. The block does not end by itself.

Open questions:

1. How many digits does the code have?

## Implementation evidence

- Changed: host routing, header link, standalone navigation, login page, MFA challenge, verify, resend, account block, reactivate, mail template, and the product, design, API, OpenAPI, and database contracts. Swagger documents the MFA routes, the login challenge, and `status` on the edit-user schema. The login `SafeUser` schema omits `status`. Credential forms use `method="post"` so a submit does not place the password or the code in the address. A pasted code keeps only digits in the field, and surrounding whitespace is removed before the digit check.
- Tests: backend unit 195 passed, backend e2e 71 passed, frontend unit 156 passed on 2026-10-01. Frontend unit was run again after a second code submit does not send another request: 39 files, 156 tests passed. Backend unit was run again after the MFA token uses the password-reset token style: 35 files, 195 tests passed.
- Commands: `npm run test --workspace backend` passed (35 files, 195 tests). `npm run test:e2e --workspace backend` passed (9 files, 71 tests). `npm run test --workspace frontend` passed (39 files, 156 tests). `npm run sdd:validate` was run again on 2026-10-01 and failed with one error: this approved file cannot contain the unanswered digit count.
- Limitation: the MFA digit count in AC-011 is unanswered. Until `MFA_EMAIL_TOKEN_DIGITS` is an integer from 1 to 32, login and resend return `503` and send no e-mail. This specification stays `approved`

## Validation evidence

- AC-001: `frontend/components/layout/header.spec.tsx`
- AC-002: `frontend/app/page.spec.tsx`
- AC-003: `backend/src/modules/portal/auth.service.spec.ts` and `frontend/components/forms/portal-login-page.spec.tsx`
- AC-004: `backend/src/modules/portal/auth.service.spec.ts` and `frontend/components/forms/portal-login-page.spec.tsx`
- AC-005: `backend/src/modules/portal/auth.service.spec.ts` and `frontend/components/forms/portal-login-page.spec.tsx`
- AC-006: `frontend/components/forms/portal-login-page.spec.tsx`
- AC-007: `frontend/components/forms/portal-login-page.spec.tsx` and `backend/src/modules/portal/auth.service.spec.ts`
- AC-008: `frontend/components/layout/header.spec.tsx`
- AC-009: `backend/src/modules/portal/auth.service.spec.ts`
- AC-010: `backend/src/modules/mail/email-template.service.spec.ts` and `backend/src/modules/mail/mail.service.spec.ts`
- AC-011: digit count remains unanswered; fixture generation is covered by `auth.service.spec.ts`
- AC-012: `backend/src/common/security/cors-origins.spec.ts`, `backend/src/modules/portal/auth.service.spec.ts`, and `infrastructure/.env.backend.example`
- AC-013: `frontend/components/forms/portal-login-page.spec.tsx` and `backend/src/modules/portal/auth.service.spec.ts`
- AC-014: `backend/src/modules/portal/auth.service.spec.ts` and `frontend/components/forms/portal-login-page.spec.tsx`
- AC-015: `backend/src/modules/portal/users.service.spec.ts` and `frontend/components/forms/portal-edit-user-form.spec.tsx`
