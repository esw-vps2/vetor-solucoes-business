---
id: VETOR-025
title: Change a user home tenant from Editar usuário
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-02-edit-user-tenant
created_at: 2026-10-02
updated_at: 2026-10-02
---

# Change a user home tenant from Editar usuário

## Context

`Editar usuário` on `/portal` Cadastro opens `PortalEditUserForm`. Today
that form edits first name, last name, cargo, age, sex, email, and photo.
`PATCH /api/v1/users/{id}` does not change `users.tenant_id`. Create
already requires a tenant, and only profile `Administrador` (Administrador
Global) can choose any tenant on `Cadastrar usuário`.
`AdministradorTenant` is locked to their own home tenant at create.
`PATCH /api/v1/auth/session` changes the global administrator working
session tenant and does not rewrite `users.tenant_id`.

The requester pointed at the live `Editar usuário` action card and asked
to add, inside that modal, the ability to change a user's tenant, and to
limit that option to the global administrator.

Original request (Portuguese, preserved):

> Em [Editar usuário] adicione no modal a possibilidade de mudar a tenant
> de um usuário. Essa opção de alterar a tenant, apenas associada ao
> administrador global.

## Desired outcome

An authenticated `Administrador` can change the home tenant of the user
loaded in `Editar usuário`, including their own user. `AdministradorTenant`
and `Usuario` do not see the control, and the API rejects a tenant change
from them. Projects, reports, and the working session tenant switch stay
as they are.

## In scope

- A required `Tenant` select in `Editar usuário`, shown only when the
  signed-in profile is `Administrador`.
- The select lists every tenant from `GET /api/v1/tenants`, labeled
  `{name} ({slug})`, and starts on the loaded user's home tenant.
- Saving the existing registration fields also sends that `tenantId`.
- `PATCH /api/v1/users/{id}` accepts optional `tenantId` and updates
  `users.tenant_id` only when the actor profile is `Administrador`.
- An uploaded user photo pointer moves with the user into the destination
  tenant folder. A brand path such as `/brand/symbol-vetor.png` stays a
  path and is not moved.
- Unknown tenant, and an email that already exists on the destination
  tenant, are rejected.

## Out of scope

- Changing tenant from `Cadastrar usuário`, `Configurar Perfil`, or any
  surface other than `Editar usuário`.
- Showing or enabling the control for `AdministradorTenant` or `Usuario`.
- Rewriting the working session tenant (`PATCH /api/v1/auth/session`).
- Moving projects, cards, comments, attachments, finance notes, or Power
  BI distributions to the new tenant.
- Changing profile, password, `enabledActions`, or `status` as part of
  the tenant change.
- Revoking the target user's existing sessions.
- Creating, renaming, or deactivating tenants.

## Acceptance criteria

- AC-001: An `Administrador` opening `Editar usuário` sees a required
  `Tenant` select. The options are every tenant, each shown as
  `{name} ({slug})`. The selected value is the loaded user's home tenant,
  including after choosing another user in the picker.
- AC-002: An `AdministradorTenant` or `Usuario` using `Editar usuário`
  does not see `Tenant`.
- AC-003: When an `Administrador` saves, `users.tenant_id` becomes the
  selected tenant. Profile, password, `enabledActions`, and `status` stay
  unchanged. The same-tenant selection still saves the other registration
  fields.
- AC-004: `AdministradorTenant` and `Usuario` receive `403` if
  `PATCH /api/v1/users/{id}` includes `tenantId`, including when the value
  equals the target user's current tenant.
- AC-005: An unknown `tenantId` is `400`. A destination tenant that
  already has the same email is `400`. The previous home tenant is kept.
- AC-006: When the user has an uploaded photo pointer, the file is stored
  under the destination tenant folder and removed from the previous
  tenant folder. A non-pointer photo path is unchanged. A photo uploaded
  in the same save is written only under the destination tenant.

## User experience

Reuse the `Cadastrar usuário` field treatment. Label `Tenant`. Control is
a `select` with the shared modal field classes, placeholder option
`Selecione`, and one option per tenant: `{name} ({slug})`. Place it after
`E-mail` and before the status message. It is required for
`Administrador`. It is absent for every other profile. Loading failure
uses the existing sentence `Não foi possível carregar os tenants.` Save
success and save failure stay `Usuário atualizado.` and `Não foi possível
atualizar o usuário.` No new page, route, or card.

## API and integrations

`PATCH /api/v1/users/{id}` stays multipart and `204`. Optional field
`tenantId` is a UUID. Authorization stays the access cookie. Writing
`tenantId` requires actor profile `Administrador`. Any other actor that
sends `tenantId` receives `403`. Unknown tenant and a unique
`(tenant_id, email)` collision receive `400` with the existing invalid
input body. Omitting `tenantId` leaves `users.tenant_id` unchanged.
`GET /api/v1/tenants` is unchanged. Delivery updates Swagger,
`openapi.yaml`, and `docs/api.md`.

## Data impact

No new column or migration. `users.tenant_id` is updated to an existing
`tenants.id`. The unique pair `(tenant_id, email)` still applies. An
uploaded photo file moves from
`infrastructure/repository/files/{previousTenantId}/{pointer}` to
`infrastructure/repository/files/{nextTenantId}/{pointer}`. A missing
source file does not fail the update: the pointer stays stored and the
other fields, including profile, are saved. The edit form sends
`tenantId` only when the selected tenant differs from that user's home
tenant, so a profile or registration save does not relocate the photo.
Audit event
`user_updated` records the destination `tenantId`, the user id, and
metadata `previousTenantId` when the home tenant changes.

## Security

Only profile `Administrador` may change a user's home tenant. The
frontend hides the control; the backend rejects `tenantId` from every
other profile with `403`. The actor may change any user they can already
edit, including themselves. The target may be `Usuario`,
`AdministradorTenant`, or `Administrador`. The tenant must already exist.
This does not grant a new route. It does not change password, profile, or
`enabledActions`. Existing sessions are not revoked: a non-administrator
access token can still name the previous tenant until refresh or expiry,
and refresh then follows `users.tenant_id`. An `Administrador` working
session tenant is unchanged by this save. Projects and other
tenant-owned records stay on the previous tenant, so the moved user no
longer reaches them through the home-tenant rule already in ABAC.

## Testing

- AC-001: Frontend test that an `Administrador` sees `Tenant`, options
  use `{name} ({slug})`, the value follows the loaded user, and save
  sends that `tenantId`.
- AC-002: Frontend test that `AdministradorTenant` and `Usuario` do not
  see `Tenant`, and their save omits `tenantId`.
- AC-003: Backend unit test that an `Administrador` update sets
  `tenantId` and leaves profile, password hash, `enabledActions`, and
  `status` unchanged.
- AC-004: Backend unit test that `AdministradorTenant` and a `Usuario`
  with `editUser` receive forbidden when `tenantId` is present.
- AC-005: Backend unit test that an unknown tenant and a duplicate email
  on the destination tenant are bad requests and do not save the new
  tenant.
- AC-006: Backend unit test that an uploaded photo pointer is written on
  the destination tenant and deleted on the previous tenant, and that a
  brand path is not moved.

## Delivery

Frontend: `PortalEditUserForm` and its test, plus the update payload type.
Backend: `UpdateUserDto`, `UsersService.update`, users service tests,
Swagger, `openapi.yaml`, and `docs/api.md`. No schema migration.

## Traceability

- Source: human prompt `chat-2026-10-02-edit-user-tenant`.
- Supersedes the VETOR-010 statement that edit does not change tenant,
  for this control only. VETOR-010 remains the permission-modal
  specification.
- Does not replace `PATCH /api/v1/auth/session` from the session-tenant
  switch.

## Implementation evidence

- Changed: `PortalEditUserForm` shows `Tenant` only for `Administrador` and sends `tenantId` on save. `UsersService.update` accepts `tenantId` from `Administrador`, rejects it for other profiles, moves an uploaded photo pointer, and keeps the previous tenant when save fails. Contracts: `docs/api.md`, `docs/database.md`, `docs/design.md`, `openapi.yaml`, and `UpdateUserDto`.
- Tests: `backend` `users.service.spec.ts` 28 passed. `frontend` `portal-edit-user-form.spec.tsx` 6 passed. `backend` `test/swagger.e2e-spec.ts` 2 passed. `npm run lint --workspace backend` passed. `npm run typecheck --workspace frontend` passed. `npm run lint --workspace frontend` passed with existing image warnings and no errors. `npm run typecheck --workspace backend` failed on existing errors in `rate-limit.guard.spec.ts`, `session-tenant.e2e-spec.ts`, and `tenants.e2e-spec.ts`, outside this change. `spec-driven-development` passed.
- Limitation: an existing access token can still name the previous tenant until refresh or expiry. Sessions are not revoked, as specified.

## Validation evidence

- AC-001: pending
- AC-002: pending
- AC-003: pending
- AC-004: pending
- AC-005: pending
- AC-006: pending
