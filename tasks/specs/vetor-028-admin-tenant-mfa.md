---
id: VETOR-028
title: Administrator screen with per-tenant MFA
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-22-admin-tenant-mfa
created_at: 2026-10-22
updated_at: 2026-10-22
---

# Administrator screen with per-tenant MFA

## Context

Portal sign-in today is e-mail, password, and an e-mailed digit code before
session cookies. `POST /api/v1/auth/login` always returns
`{ mfaRequired: true, challengeId, expiresAt }` for one matching active
account and does not set cookies. VETOR-017 and VETOR-020 own that MFA step.
Login starts from `users.tenant_id`. There is no tenant-level MFA flag.
`tenants` has no column for it.

The requester asked for an Administrator screen that will hold configuration
features. The first feature is enabling MFA per tenant. A user of tenant A
signs in without the token when that tenant's MFA is disabled. A user of
unit B is asked for the token when that unit has MFA enabled.

Original request (Portuguese, preserved):

> Quero crair uma tela Administrador, para por algumas funcionalidade de
> configuração. A primeira que teremos é a possibilidade de habilitar MFA
> por tenant. Se estou logando com um usuário da tenant A, o MFA pode esta
> desabilitado, logo não vai pedir o token, agora se na unidade B tiver
> habilitado, terá que pedir.

Follow-up answers on 2026-10-22:

- `unidade` is the existing portal tenant.
- Only `Administrador` (Administrador Global) may open the screen and change
  the flag.
- The initial value is off for tenants that already exist, including
  bootstrap tenant `vetor`, and for a tenant created later.
- The token remains the e-mailed digit code the portal already sends.
- Login uses the user's home tenant. An `Administrador` whose home tenant
  is `vetor` follows the `vetor` flag, including after a later working-tenant
  switch.

## Desired outcome

An `Administrador` opens a configuration screen named `Administrador` and
sets MFA on or off for every tenant. A tenant starts with MFA off, so a
correct password signs that tenant's users in without the e-mailed code.
When an `Administrador` turns MFA on for a tenant, the next login of a user
whose home tenant is that tenant asks for the existing e-mailed code.
`AdministradorTenant` and `Usuario` cannot open the screen or change the
flag.

## In scope

- A portal screen named `Administrador`, visible only to profile
  `Administrador`. Its first configuration is MFA per tenant.
- Every tenant is listed. The switch stores MFA enabled or disabled for
  that tenant.
- New tenants and existing tenants, including `vetor`, start with MFA off.
- Login of one active user follows that user's home tenant
  (`users.tenant_id`).
- When that flag is off, a correct password signs the user in with the same
  session cookies as a completed MFA login, sends no code, and does not
  show the code step.
- When that flag is on, login stays the current MFA challenge. The code
  step, resend, cancel, expiry, and the three-wrong-code block stay as
  they are.
- A wrong password, or more than one matching active account, stays the
  generic unauthorized response and does not reveal the flag.

## Out of scope

- Any configuration control other than per-tenant MFA.
- A second factor other than the existing e-mailed digit code, including
  an authenticator app, SMS, or a per-user MFA override.
- Letting `AdministradorTenant` or `Usuario` read or change the flag,
  including a `Usuario` with `createTenant`.
- Asking for the code again when an `Administrador` switches the working
  session tenant after login.
- Password recovery, account block, reactivate, and the MFA verify,
  resend, and cancel contracts, except that verify is not used when the
  flag skipped the challenge.
- Changing `users.status` when the flag changes.
- Deleting outstanding `mfa_email_challenges` rows or revoking sessions
  that already exist when the flag changes.
- Creating, renaming, or deactivating tenants.

## Acceptance criteria

- AC-001: Profile `Administrador` sees the sidebar item `Administrador` and
  the screen at `/portal/administrador` with heading `Administrador`.
  `AdministradorTenant` and `Usuario` do not see the item. The settings
  routes return `401` without a session and `403` for every other profile.
- AC-002: The screen lists every tenant, each with name, slug, and an MFA
  switch. Turning the switch on stores MFA enabled for that tenant. Turning
  it off stores MFA disabled. Only profile `Administrador` can save.
- AC-003: After a correct password for exactly one active user whose home
  tenant has MFA disabled, the login response sets the session cookies,
  returns `mfaRequired: false` with the safe user JSON, sends no e-mail,
  and writes no MFA challenge. The login page calls the authenticated
  continuation and does not show the code field.
- AC-004: After a correct password for exactly one active user whose home
  tenant has MFA enabled, login still returns
  `{ mfaRequired: true, challengeId, expiresAt }`, e-mails the code, and
  sets no session cookies until verify.
- AC-005: An incorrect password, or more than one matching active account,
  remains `401` with the existing invalid-credentials behavior. The
  response does not include the tenant MFA flag.
- AC-006: After migration, every existing tenant, including `vetor`, has
  MFA off. `POST /api/v1/tenants` stores MFA off. A user of that tenant is
  not asked for the code until an `Administrador` enables that tenant.

## User experience

The page is a portal route at `/portal/administrador`, inside `PortalShell`.
The sidebar item and the main heading are `Administrador`, the name given
in the request. The item is a link with `cursor-pointer` and a custom
inline gear SVG, in the same nav treatment as `Financeiro` and `Power BI`.
It sits after `Power BI` and before `Cadastro`, inside the links already
limited to profile `Administrador`. Below `lg` it is in the same hamburger
list. The shell stays the off-white light surface, Inter, and the VETOR
tokens. No second palette and no icon library.

The main area has one section. The section heading is `MFA`. Under it, a
list of tenant rows uses the existing portal catalog row: white surface,
`rounded-[28px]`, `border-navy/10`, `p-6`, name in `text-lg` semibold navy,
and the slug in `text-sm` secondary as `({slug})`. Each row ends with the
existing switch pill (`role="switch"`, `aria-checked`, bordered full pill,
`text-sm` semibold). The visible labels are `Habilitado` and
`Desabilitado`. The accessible name is `Habilitar MFA de {name}` or
`Desabilitar MFA de {name}`.

The switch is disabled while its save is in flight. A failed save restores
the previous checked state and shows
`Não foi possível concluir a operação.` with `role="alert"`. A `429`
shows `Aguarde alguns instantes antes de tentar novamente.` Loading the
list shows `Carregando...` with `role="status"`. A failed load shows
`Não foi possível carregar os tenants.` An empty list shows
`Nenhuma tenant.` A successful save leaves the switch in the new state and
shows no toast.

The login panel is unchanged. When login returns `mfaRequired: false`,
`PortalCredentialFlow` completes sign-in the same way a successful verify
does and does not enter the MFA step.

Hiding the nav item from other profiles is presentation only.

## API and integrations

No new public route. Login stays `POST /api/v1/auth/login`.

After exactly one active password match, the service reads
`tenants.mfa_enabled` for `users.tenant_id`.

- `true`: current `issueMfaChallenge` response. No cookies.
- `false`: `issueSession` for that home tenant, audit `login_succeeded`,
  response body is the safe user JSON plus `mfaRequired: false`. No
  challenge row and no MFA e-mail. Cookie attributes stay the current
  HttpOnly session cookies.
- Home tenant row missing: do not skip the code. Keep the current MFA
  challenge path.

`mfa_enabled` is not added to `GET /api/v1/tenants`, the session JSON, or
the access token.

Only profile `Administrador` may call the settings routes. Any other
authenticated profile receives `403`. Missing or invalid credentials
receive `401`. The `403` is decided before a tenant lookup, so an
unauthorized caller does not learn whether a tenant id exists.

| Method | Route                                      | Request                   | Response                                         | Errors                     |
| ------ | ------------------------------------------ | ------------------------- | ------------------------------------------------ | -------------------------- |
| GET    | `/api/v1/admin/tenant-settings`            | None                      | `{ id, name, slug, mfaEnabled }[]` ordered by `name` | `401`, `403`           |
| PATCH  | `/api/v1/admin/tenant-settings/{tenantId}` | `{ mfaEnabled: boolean }` | That tenant's `{ id, name, slug, mfaEnabled }`   | `400`, `401`, `403`, `404` |

`tenantId` is a UUID. `mfaEnabled` is required and boolean. Unknown fields
are rejected. An unknown tenant for an `Administrador` is `404`. Sending
the stored value again returns `200` and does not write another audit row.
A changed value returns `200` and writes audit event `tenant_mfa_changed`
with metadata `previous` and `next` booleans, the actor user id, and the
tenant id. The audit row stores no code, password, or token.

`GET` returns every tenant. Delivery updates Swagger, `openapi.yaml`, and
`docs/api.md` for the login branch and these two routes. No new external
integration.

## Data impact

Add `tenants.mfa_enabled boolean NOT NULL DEFAULT false`. The migration
sets `false` on every existing row, including bootstrap tenant `vetor`.
`POST /api/v1/tenants` stores `false` for a tenant created after this
feature. A later startup create of a missing `vetor` tenant also stores
`false`. No new table. No change to `mfa_email_challenges`. Delivery
updates `docs/database.md` with the column.

The flag is read by primary key with the user. It does not need its own
index.

## Security

The human decided on 2026-10-22 that only profile `Administrador` may read
or change per-tenant MFA, and that every tenant starts with MFA off. Until
an `Administrador` enables a tenant, a correct password for one active user
of that home tenant is enough to open the session. The e-mailed code stays
the factor when the flag is on. Login still uses `users.tenant_id`. An
`Administrador` whose home tenant is `vetor` follows the `vetor` flag at
login. Switching the working tenant afterward does not ask for a code.

The frontend switch is not the control. The backend reads the column on
login and allows the settings routes only for profile `Administrador`.
`AdministradorTenant` and `Usuario` receive `403`, including when
`createTenant` is granted.

Login rate limits stay. Settings routes require the access cookie. DTOs
validate the body. Responses omit secrets, codes, hashes, and filesystem
paths. Audit metadata is the two booleans only. Changing the flag does not
delete challenges, revoke sessions, or change `users.status`. A challenge
already issued still verifies, resends, and cancels under the current
rules. A session already issued stays valid until its current expiry,
refresh, or logout rules. A missing home-tenant row does not skip the code.

Delivery updates the `docs/product.md` authentication sentence so it
matches this rule: the e-mailed code is required only when the user's home
tenant has MFA enabled.

## Testing

- AC-001: Frontend test that an `Administrador` session renders heading
  `Administrador` at `/portal/administrador`, and that an
  `AdministradorTenant` or `Usuario` session does not render the nav item.
  Backend e2e returns `403` for those profiles on both settings routes and
  `401` without a session.
- AC-002: Frontend test that each row switch sends
  `PATCH /api/v1/admin/tenant-settings/{tenantId}` with the inverted
  boolean, restores the control when the request fails, and shows
  `Não foi possível concluir a operação.` Backend unit test that a changed
  boolean persists and writes `tenant_mfa_changed`, and that the same
  boolean does not write another audit row. The list contains every tenant.
- AC-003: Backend unit test that a disabled home tenant returns
  `mfaRequired: false`, sets session cookies, sends no mail, and inserts no
  challenge. Frontend test that `PortalCredentialFlow` completes sign-in
  without the code field.
- AC-004: Backend unit test that an enabled home tenant still returns the
  challenge and sets no cookies. Frontend test that the code step still
  appears.
- AC-005: Backend unit test that a failed password stays `401` and does not
  read or return `mfaEnabled`.
- AC-006: Migration test that existing rows, including `vetor`, store
  `false`. Tenant-create test that `POST /api/v1/tenants` stores `false`.

Commands for delivery: `npm run sdd:validate`, backend `typecheck`, `lint`,
`test`, and `test:e2e`, frontend `typecheck`, `lint`, `test`, and `build`.

## Delivery

Stay in the portal module. Add the column on the tenant entity and a new
migration with default `false`. Serve the two routes from a portal admin
controller that returns DTOs and allows only profile `Administrador`.
Branch `AuthService.login` after the single active match. On the frontend,
add `frontend/app/portal/administrador/page.tsx`, a client list component,
the sidebar item in `PortalShell`, and the login branch in
`PortalCredentialFlow` and `frontend/lib/api/client.ts`.

After approval, update `docs/product.md` (authentication sentence and the
`/portal/administrador` route), `docs/design.md` (the screen row),
`docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`. Do not
promote a new visual identity. The row and switch reuse the portal catalog
pattern.

Branch at implementation: `feature/admin-tenant-mfa`.

## Traceability

- Source: `human_prompt`, `chat-2026-10-22-admin-tenant-mfa`.
- Follow-up on 2026-10-22: tenant equals unit, `Administrador` only,
  initial value off, existing e-mailed code, home tenant at login.
- Login and MFA step: VETOR-017. Cancel: VETOR-020.
- Tenant registration: VETOR-013. Home tenant on the user: VETOR-025.
- Authentication contract this feature changes: `docs/product.md` and
  `docs/api.md` `POST /api/v1/auth/login`.

## Implementation evidence

- Changed: `tenants.mfa_enabled` with migration `1760000017000-add-tenant-mfa-enabled`; `GET` and `PATCH /api/v1/admin/tenant-settings` for profile `Administrador`; `POST /api/v1/auth/login` follows the home tenant flag; portal route `/portal/administrador`, sidebar item, and login skip when `mfaRequired` is false. Updated `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`, `openapi.yaml`, and Swagger.
- Tests: `npm run test --workspace backend` passed (41 files, 252 tests). `npm run test:e2e --workspace backend` passed (10 files, 84 tests). `npm run test --workspace frontend` passed (70 files, 261 tests). `npm run typecheck --workspace backend` passed. `npm run typecheck --workspace frontend` passed. `npm run lint --workspace backend` passed. `npm run lint --workspace frontend` passed with six existing `img` warnings and no errors. `npm run build --workspace backend` passed. `npm run build --workspace frontend` passed, including `/portal/administrador`. `npm run sdd:validate` passed (27 specifications). Live database: existing tenants `vetor` and `ME` stored `mfa_enabled` false after the migration. Browser on `http://localhost:3000/portal`: a home tenant with MFA off signed in without the code field; `/portal/administrador` showed heading `Administrador`, section `MFA`, and both tenant switches as `Desabilitado`; turning VETOR on and back off updated the label and wrote `tenant_mfa_changed` with only `previous` and `next`. Unauthenticated `GET /api/v1/admin/tenant-settings` returned 401.

## Validation evidence

- AC-001: not run
- AC-002: not run
- AC-003: not run
- AC-004: not run
- AC-005: not run
- AC-006: not run
