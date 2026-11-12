---
id: VETOR-032
title: Send a password reset link from Editar usuário
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-26-reset-login
created_at: 2026-10-26
updated_at: 2026-10-27
---

# Send a password reset link from Editar usuário

## Context

The named human approver invoked `/goal` on this specification on
2026-10-26 and thereby approved it for delivery.

`Editar usuário` on Cadastro opens `PortalEditUserForm`. `Administrador` and
`AdministradorTenant` pick a user, then see `Editar`. `Administrador` also
sees `Excluir`. `Usuario` has no picker and edits only their own registration.
The picker list includes the actor. `Administrador` sees every user.
`AdministradorTenant` sees every user whose home tenant is their own,
including a user with profile `Administrador` on that tenant.

The portal already stores single-use password tokens in
`password_reset_tokens` (hash only). Creating a user emails `Altere a senha`
with `{CORS origin}/portal/change-password?token={token}`. That page accepts
`Nova senha` and `Repetir senha`, then calls
`POST /api/v1/auth/password-recovery/reset`. A successful reset replaces the
password hash, marks the token used, revokes that user's refresh sessions,
and sends `Senha alterada com sucesso - Portal Vector`. Public
`Esqueci minha senha` still emails a token to type on the login page and
expires according to `PASSWORD_RESET_TOKEN_EXPIRES_IN` (default 15 minutes).
`users.status` `active` is the only status that can receive password
recovery today. `blocked` stays until `Reativar`.

The requester pointed at the live `Editar usuário` action card and asked for
a reset option on the user that was selected.

Original request (Portuguese, preserved):

> Adicioner a opção de reset da senha em [Editar usuário]. Ao selecionar um
> usuário, um botão Reset Login aparecerá, e ao clicar um link será enviado
> para o email da pessoa, onde ela poderá alterar a senha. Esse link durá 30
> minutos, e depois disso é expirado. Caso o usuário altere a senha dentro
> dos 30 minutos, o link tambme é expirado.

Human answers on 2026-10-26:

1. `Administrador` and `AdministradorTenant` may send the link for every
   user they can already select, including themselves.
2. A `blocked` account cannot receive the link.
3. The Portuguese status lines and email body below are confirmed. The
   button label stays `Reset Login`.

Human follow-up on 2026-10-27: the button label is `Resetar Login`, and
the control uses the same accent fill and navy text as `Editar`.

## Desired outcome

An `Administrador` or `AdministradorTenant` selects an active user in
`Editar usuário`, clicks `Resetar Login`, and that user receives an email
link. The link opens the existing password-change page. The link stops
working 30 minutes after it is issued. It also stops working as soon as
that password change succeeds. A blocked account stays on `Reativar`.

## In scope

- A `Resetar Login` button on the `Editar usuário` selection step, after an
  active user is selected and before the registration form opens.
- `Administrador` may target any active user, including themselves.
- `AdministradorTenant` may target any active user of their home tenant,
  including themselves and an `Administrador` whose home tenant is that
  same tenant.
- An authenticated request that emails a single-use link to the selected
  user's stored email address.
- Reuse of `/portal/change-password` so the recipient sets a new password.
- A 30-minute lifetime for this link, and immediate expiry when the password
  change succeeds.
- Confirmed status copy: `Link de redefinição enviado.` and
  `Não foi possível enviar o link de redefinição.`
- The link and the raw token stay out of the API response, the page, and
  logs.

## Out of scope

- A new Cadastro card, a new portal route, or a change to `Cadastrar
usuário`, `Configurar Perfil`, `Excluir`, or `Reativar`.
- `Usuario`, including a `Usuario` editing their own account.
- Sending a link to a `blocked` user, or changing `users.status` in this
  flow.
- Changing public `Esqueci minha senha`, its 15-minute token, or the
  create-user invitation lifetime (`PASSWORD_RESET_TOKEN_EXPIRES_IN`).
- Letting the actor choose or see the new password.
- Changing password policy, MFA, profile, tenant, or `enabledActions` as
  part of this reset.
- Bulk reset.

## Acceptance criteria

- AC-001: On the `Editar usuário` selection step, after an `active` user is
  selected and while the registration form is closed, `Administrador` and
  `AdministradorTenant` see a button labeled `Resetar Login` in the same
  action row as `Editar`. The button is absent for a selected `blocked`
  user, for `Usuario`, and while the registration form is open.
- AC-002: Clicking `Resetar Login` sends one email to the selected user's
  stored address. The subject is `Altere a senha`. The body contains the
  sentence `Altere a senha pelo link abaixo. O link expira em 30 minutos.
Depois que a senha é alterada, o mesmo link deixa de valer.` and one link
  to `{CORS origin}/portal/change-password?token={token}`. The HTTP
  response and the portal UI do not include the token or the link. Success
  copy is `Link de redefinição enviado.`
- AC-003: A link that is unused and younger than 30 minutes opens
  `/portal/change-password`. Submitting a new password that meets the
  current password policy changes that user's password. The previous
  password no longer authenticates. The actor may be the target.
- AC-004: The same link is rejected after 30 minutes. It is also rejected
  after a successful password change, including when that change happens
  inside the 30 minutes. The page shows `Link inválido ou expirado.`
- AC-005: A `blocked` target returns `400` and sends no email. `Usuario`
  receives `403`. `AdministradorTenant` targeting a user outside their home
  tenant receives `403`. A missing user id returns `404`. SMTP failure
  returns `503`, marks that attempt's token used, and the form shows
  `Não foi possível enviar o link de redefinição.`

## User experience

The control lives in `PortalEditUserForm`, in the existing
`flex flex-wrap gap-3` row that already holds `Editar` and, for
`Administrador`, `Excluir`. Show it only when a list row is selected,
that row's `status` is `active`, and `editing` is false. Place it after
`Editar` and before `Excluir`. `Usuario` has no picker, so this row is
absent for them.

Label: `Resetar Login`. Treatment: the same accent pill as `Editar`
(`rounded-full bg-accent`, `px-6 py-3`, `text-sm font-semibold text-navy`,
hover `brightness-110`, accent focus ring). It does not use the red
`Excluir` treatment. Disable it while a request is in flight. Click sends
immediately. There is no extra confirm step.

Success and failure use the existing status paragraph under the picker.

- Success: `Link de redefinição enviado.`
- Failure: `Não foi possível enviar o link de redefinição.`

The recipient uses the existing `ChangePasswordForm`: heading `Altere a
senha`, fields `Nova senha` and `Repetir senha`, hint `A senha deve ter
pelo menos 6 caracteres, com letras, números e 1 caractere especial.`,
submit `Salvar senha`, success `Senha alterada.`, and invalid or expired
`Link inválido ou expirado.`

Email uses the existing VETOR transactional layout, Portuguese (Brazil),
and subject `Altere a senha`. Body:

> Altere a senha pelo link abaixo. O link expira em 30 minutos. Depois que
> a senha é alterada, o mesmo link deixa de valer.

The create-user invitation keeps its current body. This mail is a separate
render so the 30-minute sentence is not applied to create-user mail.

## API and integrations

New route:

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                          |
| Route          | `/api/v1/users/{id}/password-reset-link`                                                        |
| Authentication | Access cookie. The actor must be `active` and profile `Administrador` or `AdministradorTenant`. |
| Body           | Empty. Unknown properties are rejected.                                                         |
| Response       | `204 No Content`                                                                                |

`{id}` is the selected user's UUID. The service loads that user, issues the
token, and emails `users.email`. It does not trust an email sent by the
client.

Authorization:

- `Administrador` may target any user, including themselves.
- `AdministradorTenant` may target themselves and any user with the same
  `tenantId`, including profile `Administrador` on that tenant.
- `Usuario` is `403`.
- The target must have `status` `active`.

Errors:

- `401` when the caller has no valid session.
- `403` when the caller is `Usuario`, the actor is not `active`, or an
  `AdministradorTenant` targets a user from another tenant.
- `404` when the user id does not exist.
- `400` when the target `status` is not `active`.
- `429` when the caller exceeds the existing password-reset rate limit.
- `503` when SMTP delivery fails. The token created for that attempt is
  marked used before the error is returned, so a failed send does not leave
  a working link. The form shows the failure sentence.

Rate limit: `@RateLimit` with `identifier: 'ip'`, key
`user-password-reset-link`, and the existing
`PASSWORD_RESET_RATE_LIMIT_MAX` / `PASSWORD_RESET_RATE_LIMIT_WINDOW`
(default 3 requests / 15 minutes).

Link construction reuses `UsersService` frontend origin: the first `CORS`
origin, no trailing slash, path `/portal/change-password`, query `token`
set to the raw token. Completion stays on
`POST /api/v1/auth/password-recovery/verify` and
`POST /api/v1/auth/password-recovery/reset`. Those routes keep their
current contracts. Verify and reset already reject a token whose
`used_at` is set or whose `expires_at` is in the past. Completion still
requires the target to be `active`.

On success, `resetPassword` keeps its current side effects: bcrypt cost 12,
`used_at` set, refresh sessions for that user revoked, and the existing
password-changed confirmation email. This route does not add a second
completion endpoint.

Audit event `password_reset_link_requested` records the actor user id, the
target user id, and the target `tenantId`. It does not record the token,
the link, the password, or the email address.

Delivery updates Swagger, `openapi.yaml`, and `docs/api.md`. The
`docs/product.md` portal-password route sentence is widened so the same
page also serves this link.

## Data impact

No new table and no migration. Reuse `password_reset_tokens`:

- `user_id` is the selected user.
- `token_hash` is SHA-256 of a 32-byte random hex token. The raw token is
  only in the email.
- `expires_at` is 30 minutes after issue. Read that duration from
  `ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN`, default `30m`, documented in
  `infrastructure/.env.backend.example`. Do not change
  `PASSWORD_RESET_TOKEN_EXPIRES_IN`.
- `used_at` stays null until the password is changed, a newer link is
  issued for that user, or this attempt's email fails.

Issuing a link marks every other unused `password_reset_tokens` row for
that same user as used, including an unused create-user or public-recovery
token. The public recovery and create-user flows keep doing the same for
their own issue path.

`docs/database.md` records that this link uses the same table with a
30-minute `expires_at`, and that only `active` users receive it.

## Security

- The route is authenticated. The frontend hide is not the authorization
  check.
- `Administrador` and `AdministradorTenant` are the only profiles that may
  send the link. Each may target the users they can already select,
  including their own account. `Usuario` is denied.
- The target must be `active`. A `blocked` user receives no email. This
  flow does not change `users.status`. Unblock stays on `Reativar`.
- Store only the token hash. Do not return, log, or render the raw token
  except inside the recipient's email.
- One user id, one link. A shared email across tenants does not issue
  tokens for the other accounts.
- Password rules stay the current policy: at least 6 characters, including
  a letter, a number, and a special character, maximum 128.
- A successful change revokes that user's refresh sessions, which is the
  recorded password-reset rule.
- The link in the query string reuses the already approved create-user
  password-change URL. No new public route.

## Testing

- AC-001: `frontend` `portal-edit-user-form.spec.tsx` shows `Resetar Login`
  after an active selection for `Administrador` and `AdministradorTenant`,
  including the actor's own row. It hides the button for a `blocked`
  selection, for `Usuario`, and after `Editar` opens the form.
- AC-002: `backend` `users.service.spec.ts` asserts the mail recipient, the
  subject, the 30-minute sentence, the `/portal/change-password?token=`
  shape, a 30-minute `expires_at`, hash at rest, and that logs omit the
  raw token. `users` HTTP e2e asserts `204` with an empty body. Frontend
  asserts `Link de redefinição enviado.` and that the client does not
  render the link.
- AC-003: `backend` service or auth spec completes
  `POST /api/v1/auth/password-recovery/reset` with the issued token and
  rejects the previous password, including when the actor id equals the
  target id. Frontend `change-password-form.spec.tsx` still submits
  `Nova senha` and `Repetir senha` for a valid token.
- AC-004: `backend` auth spec rejects the token after the 30-minute
  `expires_at` and after `used_at` is set. Frontend shows
  `Link inválido ou expirado.`
- AC-005: `backend` `users.service.spec.ts` and the users HTTP e2e cover
  `400` for `blocked` with no mail, `403` for `Usuario` and for
  `AdministradorTenant` cross-tenant, `404` for a missing id, and `503`
  with the new token marked used. Frontend asserts
  `Não foi possível enviar o link de redefinição.`

Also cover `429` on the new route and invalidation of an older unused token
for that user. `AdministradorTenant` may reset an `active` `Administrador`
on the same home tenant and their own account.

## Delivery

Frontend: `PortalEditUserForm`, API client method, component tests.
Backend: `UsersController` route, `UsersService` issue method, mail
template for the 30-minute sentence, service and e2e tests,
`infrastructure/.env.backend.example`. Contracts: `docs/api.md`,
`openapi.yaml`, Swagger, `docs/database.md`, and the portal-password row
in `docs/product.md`. No `docs/design.md` promotion: the control reuses
the existing accent `Editar` pill.

## Traceability

- Source: human prompt `chat-2026-10-26-reset-login`.
- Target surface: the `Editar usuário` card that opens
  `PortalEditUserForm`, then the selection step.
- Follow-up on 2026-10-26: both administrator profiles, including their own
  account; blocked accounts excluded; Portuguese copy confirmed.
- Follow-up on 2026-10-27: the button label is `Resetar Login` and the
  pill uses the same accent fill and navy text as `Editar`.
- Extends the password-change link from VETOR-008 and the picker from
  VETOR-010 and VETOR-029. It does not replace VETOR-003 public recovery.

## Implementation evidence

- Changed: `POST /api/v1/users/{id}/password-reset-link` on `UsersController` and `UsersService.sendPasswordResetLink` issues a single-use SHA-256 token for an `active` user, marks older unused tokens used, and sends `sendPasswordResetLink` with the 30-minute sentence. `Usuario`, a non-active target, a missing id, and a cross-tenant `AdministradorTenant` are rejected. SMTP failure marks that attempt used and returns `503`. `PortalEditUserForm` shows `Reset Login` after an active selection and before `Excluir`, and hides it while editing. Contracts: `docs/api.md`, `docs/database.md`, `docs/product.md`, `openapi.yaml`, and `infrastructure/.env.backend.example` (`ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN=30m`).
- Tests: `backend` `users.service.spec.ts`, `auth.service.spec.ts`, `email-template.service.spec.ts`, `mail.service.spec.ts`, and `rate-limit.guard.spec.ts` passed in the unit run (43 files, 279 tests). `frontend` `portal-edit-user-form.spec.tsx` and `change-password-form.spec.tsx` passed in the unit run (75 files, 294 tests). `backend` `npm run test:e2e` passed (11 files, 91 tests), including the users HTTP e2e, Swagger `204`/`503`, and the OpenAPI contract path.
- Commands: `npm run typecheck` passed. `npm run lint` passed (`frontend` oxlint reported existing `<img>` warnings and 0 errors). `npm run test --workspace backend` passed (279). `npm run test --workspace frontend` passed (294). `npm run test:e2e --workspace backend` passed (91). `npm run build --workspace backend` passed. `npm run build --workspace frontend` passed. `spec-driven-development` passed (32 specifications).
- Limitation: the live portal was opened as the bootstrap `Administrador`. After selecting that active account, `Reset Login` rendered between `Editar` and `Excluir`, and it disappeared once the edit form opened. `Reset Login` was not clicked, because the running SMTP host would email a real address and burn unused tokens. No blocked account was present in that picker, so the hidden-button case for `blocked` stays on the component test. Unauthenticated `POST` to the new route returned `401`.

## Validation evidence

- AC-001: pending
- AC-002: pending
- AC-003: pending
- AC-004: pending
- AC-005: pending

## Decisions

1. `Administrador` and `AdministradorTenant` may press `Resetar Login` for
   every user they can already select, including themselves. `Usuario` is
   outside this feature.
2. A `blocked` account cannot receive the link. Only `active`. Unblock
   stays on `Reativar`.
3. Status copy is `Link de redefinição enviado.` and
   `Não foi possível enviar o link de redefinição.` The email subject is
   `Altere a senha`. The email body is the confirmed 30-minute sentence:
   `Altere a senha pelo link abaixo. O link expira em 30 minutos. Depois que a senha é alterada, o mesmo link deixa de valer.`
   The button label is `Resetar Login`, with the same accent fill and navy
   text as `Editar`.
