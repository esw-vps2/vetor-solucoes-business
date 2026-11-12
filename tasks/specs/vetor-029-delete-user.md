---
id: VETOR-029
title: Delete a portal user from Editar usuário
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-24-delete-user
created_at: 2026-10-24
updated_at: 2026-10-24
---

# Delete a portal user from Editar usuário

## Context

`Editar usuário` lists tenant-scoped users for administrators. The requester
asked to select a user, then choose `Editar` or `Excluir`. Only profile
`Administrador` (Administrador Global) may hard-delete a user.

## Desired outcome

An authenticated `Administrador` can permanently remove another portal user
from the picker. `AdministradorTenant` and `Usuario` keep the existing edit
flow without delete. Deletion clears auth-related rows by database cascade,
removes content that references the user as creator or author, and reassigns
open card assignees before the user row is removed.

## In scope

- Picker flow: select user, then `Editar` or `Excluir` (`Excluir` only for
  `Administrador`).
- Confirm copy `Excluir este usuário?` with `Cancelar` and `Excluir`.
- `DELETE /api/v1/users/{id}` guarded by `Administrador` only.
- Migration updating user foreign keys to `ON DELETE CASCADE` where safe.
- Reassign `cards.assignee_user_id` to the deleting administrator before
  delete.
- Remove uploaded photo pointer from tenant storage after delete.

## Out of scope

- Soft delete or `blocked` status as a substitute for delete.
- Delete from `Cadastrar usuário`, `Configurar Perfil`, or other surfaces.
- `deleteUser` in `enabledActions`; profile `Administrador` is the gate.
- Deleting tenants or bulk delete.

## Acceptance criteria

- AC-001: `Administrador` sees `Excluir` after selecting a user in the
  picker. `AdministradorTenant` and `Usuario` do not see `Excluir`.
- AC-002: `Excluir` asks `Excluir este usuário?` with `Cancelar` and
  `Excluir`. Success copy is `Usuário excluído.`
- AC-003: `Editar` loads the registration form for the selected user.
- AC-004: `DELETE /api/v1/users/{id}` returns `204` for `Administrador` only.
  Self-delete is `400`. Other profiles receive `403`.
- AC-005: Deletion removes the user row, cascades dependent auth rows,
  cascades rows that reference the user as creator or author, reassigns
  `cards.assignee_user_id` to the deleting administrator, and removes an
  uploaded photo pointer from tenant storage.

## User experience

Reuse the existing picker in `PortalEditUserForm`. After a list selection,
show `Editar` for every administrator profile and `Excluir` only for
`Administrador`. `Editar` opens the existing registration form. `Excluir`
opens an inline confirm panel. Success returns to the picker with the user
removed from the list. Failure copy is `Não foi possível excluir o usuário.`

## API and integrations

New `DELETE /api/v1/users/{id}` returns `204`. Authorization requires
profile `Administrador` via `AdministradorGuard`. Delivery updates Swagger,
`openapi.yaml`, and `docs/api.md`.

## Data impact

Migration `1760000018000-user-delete-cascade` sets `ON DELETE CASCADE` on
user creator and author foreign keys documented in `docs/database.md`.
`cards.assignee_user_id` stays `ON DELETE RESTRICT`; the service reassigns
assignees to the deleting administrator before delete. `refresh_sessions`,
`password_reset_tokens`, and `mfa_email_challenges` already cascade.

## Security

Only profile `Administrador` may delete users. The frontend hides `Excluir`
for other profiles; the backend enforces the guard. Self-delete is rejected
with `400`. The actor must be active. No secrets in responses or audit
metadata beyond user ids.

## Testing

- AC-001: `frontend` `portal-edit-user-form.spec.tsx` delete visibility cases.
- AC-002: `frontend` `portal-edit-user-form.spec.tsx` confirm and success copy.
- AC-003: `frontend` `portal-edit-user-form.spec.tsx` edit flow after picker.
- AC-004: `backend` `users.service.spec.ts` and `users-tenants.e2e-spec.ts`.
- AC-005: `backend` `users.service.spec.ts` transaction assignee update and remove.

## Delivery

Frontend: `PortalEditUserForm`, `deleteUser` client, tests. Backend:
`UsersService.delete`, `UsersController` route, migration, service and e2e
tests, contracts.

## Traceability

- Source: human prompt `chat-2026-10-24-delete-user`.
- Extends `Editar usuário` from VETOR-010 without changing permission modal
  behavior.

## Implementation evidence

- Changed: `PortalEditUserForm` picker step with `Editar`/`Excluir`,
  `DELETE /api/v1/users/{id}`, `UsersService.delete`, cascade migration,
  `docs/api.md`, `docs/database.md`, `openapi.yaml`.
- Tests: `backend` `users.service.spec.ts` delete cases passed.
  `frontend` `portal-edit-user-form.spec.tsx` 9 passed. `backend`
  `users-tenants.e2e-spec.ts` delete route passed.

## Validation evidence

- AC-001: passed (`portal-edit-user-form.spec.tsx`)
- AC-002: passed (`portal-edit-user-form.spec.tsx`)
- AC-003: passed (`portal-edit-user-form.spec.tsx`)
- AC-004: passed (`users.service.spec.ts`, `users-tenants.e2e-spec.ts`)
- AC-005: passed (`users.service.spec.ts`)
