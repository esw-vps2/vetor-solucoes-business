---
id: VETOR-010
title: Perfil modal for per-user permissions
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-20-perfil-modal-user-permissions
created_at: 2026-09-20
updated_at: 2026-09-20
---

# Perfil modal for per-user permissions

## Context

The requester selected the live `/portal` sidebar control `Cadastro Usuário`
in `PortalShell` (`aria-current="page"`) and asked to create a `Perfil`
modal. The stated purpose of that modal is to edit permissions per user.

VETOR-009 is `implemented`. Authenticated `/portal` already has a
`Cadastro Usuário` sidebar item. Selecting it shows a main-area section
with action cards that open modals: `Cadastrar usuário` (`Administrador`
only) and `Editar usuário`. Edit changes first name, last name, age, sex,
email, and photo. Password, tenant, and profile are not changed on that
edit unless a later decision adds them. Create stores profile `Usuario`.

Existing authorization uses the user `profile` field. Recorded values are
`Administrador` and `Usuario`. ABAC default is deny. `Administrador` has
all-tenant scope. Other profiles are limited to their associated tenant.
`PATCH /api/v1/users/{id}` does not change profile.

VETOR-011 is `approved` and adds `Relatórios` and `Power BI`. Those
surfaces are not mapped as access options in this specification.

Follow-up decisions:

- The `Perfil` modal opens from a third `Cadastro Usuário` action card
  labeled `Configurar Perfil`.
- The card icon is a custom inline SVG in the existing action-card style
  (no icon library): a user silhouette with a gear, matching
  `Configurar Perfil` beside the create (user plus plus) and edit (pencil)
  cards. The requester asked delivery to choose the most adherent mark.
- Only `Administrador` may open the modal and change permissions.
- A permission is an action the administrator can grant to the created
  profile, and the enabled actions.
- The first mapped access options follow the current portal surfaces:
  `Painel`, `Cadastrar usuário`, and `Editar usuário`.
- Access options are not a closed list. New access options will be mapped
  as the system grows.
- The administrator selects a tenant. That selection filters all available
  users.
- Persistence extends `PATCH /api/v1/users/{id}` and `POST /api/v1/users`
  with `enabledActions`.
- An `Administrador` may change their own permissions. The last
  `Administrador` may be changed.
- After a successful save, the UI shows `Configuração realizada com
  sucesso`. The modal does not close, so the administrator can configure
  another user.
- The create-user flow also collects these permissions. Create keeps the
  submit label `Cadastrar`. The `Perfil` modal submit label is `Salvar`,
  matching the existing edit modal.
- Grants **add** to `users.profile`. `Administrador` keeps every mapped
  action even when `enabledActions` omits them. `enabledActions` grants
  extra mapped actions to `Usuario`. A `Usuario` with `createUser` can
  use `Cadastrar usuário`. A `Usuario` with `editUser` still edits only
  their own registration and cannot edit another user.
- When the signed-in `Administrador` saves a permission change for
  themselves, the session is refreshed while the modal stays open. The
  refreshed session includes `enabledActions`.
- Bootstrap `admin@vetor.tech` starts as `Administrador` and therefore
  has every mapped action. The prompt wrote `admin@vector.tech`; the
  existing account remains `admin@vetor.tech`.

## Desired outcome

An `Administrador` on `Cadastro Usuário` opens `Configurar Perfil`, sees
a `Perfil` modal, selects a tenant, sees the available users of that
tenant, and enables `Painel`, `Cadastrar usuário`, and/or `Editar
usuário` for that user. Those grants add to `Administrador` / `Usuario`.
A `Usuario` with `editUser` still edits only themselves. Create collects
the same actions. A successful save shows `Configuração
realizada com sucesso`, leaves the modal open, and refreshes the session
when the signed-in user was edited. `POST /api/v1/users` and
`PATCH /api/v1/users/{id}` persist `enabledActions`. Bootstrap
`admin@vetor.tech` remains `Administrador`. New access options will be
mapped as the system grows.

## In scope

- Add a third `Cadastro Usuário` action card labeled `Configurar Perfil`
  that opens a modal titled `Perfil`.
- Use a custom inline SVG icon in the existing action-card style: user
  silhouette with a gear. No icon library.
- Restrict that modal to `Administrador`.
- Let the administrator select a tenant and then see all available users
  of that tenant.
- Present the first mapped access options: `Painel`, `Cadastrar usuário`,
  and `Editar usuário`.
- Collect the same options on create.
- Persist `enabledActions` on `POST /api/v1/users` and by extending
  `PATCH /api/v1/users/{id}`.
- Treat grants as additive: `Administrador` keeps every mapped action;
  `Usuario` receives extra mapped actions listed in `enabledActions`. A
  `Usuario` with `editUser` still edits only themselves.
- Allow an `Administrador` to change their own permissions, including
  when they are the last `Administrador`.
- Show `Configuração realizada com sucesso` after a successful save,
  keep the modal open, and refresh the session when the signed-in user
  was edited.
- Keep bootstrap `admin@vetor.tech` as `Administrador`.
- Keep the access-option catalog open so later mapped options can be
  added as the system grows.

## Out of scope

- Mapping access options beyond `Painel`, `Cadastrar usuário`, and
  `Editar usuário` in this specification, including VETOR-011
  `Relatórios` and `Power BI`
- Changing the bootstrap email away from `admin@vetor.tech`
- Letting a `Usuario` edit another user, including when `editUser` is
  granted
- Changing `Sair`, photo upload, or the existing edit fields except by
  adding this permission flow
- Implementation outside the recorded scope

## Acceptance criteria

- AC-001: A modal titled `Perfil` exists and is used to edit permissions
  per user.
- AC-002: `Cadastro Usuário` presents a third action card labeled
  `Configurar Perfil` that opens the `Perfil` modal. The card uses a
  custom inline SVG (user silhouette with a gear). A non-`Administrador`
  does not get a working `Configurar Perfil` control.
- AC-003: Only an authenticated `Administrador` can change permissions.
  Unauthenticated callers receive `401`. Other profiles receive `403`.
- AC-004: In the `Perfil` modal, the administrator selects a tenant and
  the list shows all available users of that tenant.
- AC-005: The modal and the create form present the mapped actions
  `Painel`, `Cadastrar usuário`, and `Editar usuário` as the actions the
  administrator can grant. The selected user's enabled actions are
  edited in the `Perfil` modal.
- AC-006: `POST /api/v1/users` and `PATCH /api/v1/users/{id}` persist
  `enabledActions` with API values `painel`, `createUser`, and
  `editUser`. Values outside that mapped set receive `400`.
- AC-007: An `Administrador` can change their own permissions. The last
  `Administrador` can be changed.
- AC-008: A successful save shows `Configuração realizada com sucesso`.
  The modal stays open so the administrator can configure another user.
- AC-009: The create-user flow also collects these permissions. Create
  submit stays `Cadastrar`. `Perfil` submit is `Salvar`.
- AC-010: The access-option catalog is not closed. New access options
  will be mapped as the system grows. This specification maps only
  `Painel`, `Cadastrar usuário`, and `Editar usuário`.
- AC-011: Grants add to `users.profile`. `Administrador` keeps `Painel`,
  `Cadastrar usuário`, and `Editar usuário` even when those values are
  absent from `enabledActions`. A `Usuario` with `createUser` can use
  `Cadastrar usuário`. A `Usuario` without `createUser` cannot.
- AC-012: After a successful permission save for the signed-in user, the
  session is refreshed and includes `enabledActions`. The modal stays
  open.
- AC-013: Bootstrap `admin@vetor.tech` starts as `Administrador` and
  therefore has every mapped action.
- AC-014: A `Usuario` with `editUser` can edit only their own
  registration. Editing another user remains `Administrador` only and
  returns `403` for a `Usuario`.

## User experience

1. An `Administrador` on `/portal` selects `Cadastro Usuário`.
2. The section shows three action cards: `Cadastrar usuário`, `Editar
   usuário`, and `Configurar Perfil`. `Configurar Perfil` opens a modal
   titled `Perfil`. Other profiles do not get that card.
3. In the modal, the administrator selects a tenant. The user list then
   shows all available users of that tenant.
4. After a user is selected, the administrator enables or disables
   `Painel`, `Cadastrar usuário`, and `Editar usuário`, then submits with
   `Salvar`.
5. After a successful save, the UI shows `Configuração realizada com
   sucesso`. The modal does not close, so the administrator can select
   another user and configure that user.
6. If the saved user is the signed-in `Administrador`, the session is
   refreshed while the modal stays open.
7. When an `Administrador` creates a user, that create flow also
   presents `Painel`, `Cadastrar usuário`, and `Editar usuário`, and
   submits with `Cadastrar`.
8. A `Usuario` with `createUser` sees and can use `Cadastrar usuário`.
   A `Usuario` with `editUser` still uses `Editar usuário` only for
   their own record. `Administrador` always sees and can use the mapped
   actions, including `Configurar Perfil` and editing any user.

## API and integrations

If this feature adds or changes an HTTP endpoint, record the method, path,
payload, response, errors, and authentication. Approved delivery must update
Swagger, `openapi.yaml`, and `docs/api.md` in the same change.

Portuguese UI labels map to English API values:

| UI label             | API value    |
| -------------------- | ------------ |
| `Painel`             | `painel`     |
| `Cadastrar usuário`  | `createUser` |
| `Editar usuário`     | `editUser`   |

The request field is `enabledActions`: an array of those API values. An
empty array is allowed. A value outside the mapped set is `400`. Later
mapped options add values to this set; they are not in this
specification.

| Method | Path                 | Auth | Request | Success | Errors |
| ------ | -------------------- | ---- | ------- | ------- | ------ |
| POST   | `/api/v1/users`      | Access cookie. `Administrador`, or `Usuario` with `createUser` | Existing multipart create fields plus `enabledActions` | `204` | `400`, `401`, `403`, `429` |
| PATCH  | `/api/v1/users/{id}` | Access cookie. `Administrador` only for `enabledActions` | `enabledActions` for the `Perfil` save. Existing multipart edit fields stay on the edit modal and do not need to be sent by `Perfil`. | `204` | `400`, `401`, `403`, `404` |
| GET    | `/api/v1/users/{id}` | Access cookie. `Administrador` or self | None | Safe user including `enabledActions` | `401`, `403`, `404` |
| GET    | `/api/v1/tenants`    | Access cookie. `Administrador`, or `Usuario` with `createUser` | None | Existing tenant list | `401`, `403` |

`GET /api/v1/users/{id}` returns `enabledActions` so `Perfil` can show
the current grants after a user is selected.

How the modal loads tenants and the tenant-filtered user list uses
`GET /api/v1/tenants` and `GET /api/v1/users`. Writing `enabledActions`
and opening `Configurar Perfil` remain `Administrador` only.

Existing self-edit of first name, last name, age, sex, email, and photo
on `PATCH /api/v1/users/{id}` is unchanged. A `Usuario` with `editUser`
may PATCH only their own registration. PATCH of another user's
registration stays `Administrador` only.

Login, refresh, and session payloads include `enabledActions` in
addition to the VETOR-008 journey fields, so a self-save can refresh the
signed-in session.

## Data impact

Each user persists `enabledActions` as the granted API values (`painel`,
`createUser`, `editUser`). PostgreSQL already stores `users.profile`
(`Administrador`, `Usuario`). This specification does not change those
profile values. Approved delivery records the column or relation in
`docs/database.md`.

Bootstrap `admin@vetor.tech` remains `Administrador` and therefore has
every mapped action under the additive rule. This specification does not
require that account to store all three `enabledActions` values.

## Security

Existing project security rules apply.

- Portal authorization remains backend-enforced. Hiding `Configurar
  Perfil` is UX only.
- Only `Administrador` may grant actions or change `enabledActions`.
- An `Administrador` may change their own permissions. The last
  `Administrador` may be changed.
- Grants add to profile. `Administrador` keeps every mapped action even
  when `enabledActions` is empty. `Usuario` receives a mapped extra only
  when that value is in `enabledActions`. Backend authorization for
  `POST /api/v1/users` and `GET /api/v1/tenants` allows `Administrador`
  or `Usuario` with `createUser`.
- `Configurar Perfil` and permission writes stay `Administrador` only.
  They are not granted through `enabledActions`.
- A `Usuario` with `editUser` still cannot edit another user. Backend
  `PATCH` of another user's registration returns `403`.
- The frontend must not be the authority for which actions are enabled.
- Unknown `enabledActions` values are rejected with `400`.
- Passwords, password hashes, refresh tokens, reset tokens, and tenant
  filesystem paths must not appear in the login token or session JSON.

## Testing

- AC-001: a `Perfil` modal is present and is used to edit permissions per
  user
- AC-002: `Cadastro Usuário` has `Configurar Perfil` with the user-and-gear
  SVG; a non-`Administrador` does not get a working control
- AC-003: unauthenticated permission change is `401`; non-`Administrador`
  is `403`
- AC-004: selecting a tenant lists all available users of that tenant
- AC-005: modal and create present `Painel`, `Cadastrar usuário`, and
  `Editar usuário`; `Perfil` edits the selected user's enabled actions
- AC-006: `POST /api/v1/users` and `PATCH /api/v1/users/{id}` persist
  `enabledActions`; unknown values are `400`
- AC-007: an `Administrador` can change their own permissions; the last
  `Administrador` can be changed
- AC-008: successful save shows `Configuração realizada com sucesso` and
  the modal stays open so another user can be configured
- AC-009: create collects the same permissions; create submit is
  `Cadastrar`; `Perfil` submit is `Salvar`
- AC-010: this specification maps only those three options; later options
  are out of scope here
- AC-011: `Administrador` keeps mapped actions without them in
  `enabledActions`; `Usuario` with `createUser` can create; `Usuario`
  without `createUser` cannot
- AC-012: saving permissions for the signed-in user refreshes the session
  with `enabledActions` and leaves the modal open
- AC-013: bootstrap `admin@vetor.tech` is `Administrador` and has every
  mapped action
- AC-014: `Usuario` with `editUser` edits only self; another user's
  registration edit is `403`

Workspace commands after approved delivery: frontend and backend
`typecheck`, `lint`, `test`, and `build` for the touched workspaces;
`npm run sdd:validate`.

## Delivery

This specification is `implemented`. The named human requested delivery with
`/goal` on this specification.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-20-perfil-modal-user-permissions`
- Request: create a `Perfil` modal; this modal is for editing permissions
  per user. Selected node: `/portal` sidebar button `Cadastro Usuário` in
  `PortalShell`.
- Follow-up: third card `Configurar Perfil`; requester-delegated icon
  (user silhouette with gear, existing action-card SVG style);
  `Administrador` only; permission is an action granted to the created
  profile plus enabled actions; first mapped options are the current
  `Cadastrar usuário` and `Editar usuário` plus `Painel`; catalog stays
  open; select a tenant then filter available users; extend
  `PATCH /api/v1/users/{id}` and `POST /api/v1/users` with
  `enabledActions` (`painel`, `createUser`, `editUser`); `Administrador`
  may change themselves including the last `Administrador`; success copy
  `Configuração realizada com sucesso`; modal stays open to configure
  another user; create also collects permissions; `Perfil` submit
  `Salvar`; create submit stays `Cadastrar`; grants add to profile
  (`Administrador` keeps all mapped actions; `Usuario` with `createUser`
  can create); session refreshes on self-save and includes
  `enabledActions`; bootstrap `admin@vetor.tech` starts as
  `Administrador`; a `Usuario` with `editUser` still edits only
  themselves.
- Conflicts with: VETOR-009 profile-change out of scope on edit; VETOR-008
  create profile default `Usuario` unless a later decision adds profile
  to the form; VETOR-008 session payload exact field list; VETOR-008 and
  VETOR-009 `POST /api/v1/users` and `GET /api/v1/tenants` as
  `Administrador` only.
- Existing contracts consulted: `docs/specs/vetor-008-portal-layout-dashboard.md`,
  `docs/specs/vetor-009-user-photo-upload-sidebar-logo.md`,
  `docs/specs/vetor-003-leadpage-contact-and-vector-portal.md`,
  `docs/specs/vetor-011-portal-powerbi-embedded.md`,
  `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`

## Implementation evidence

- Changed: `backend/src/modules/portal/enabled-actions.ts`, `user.entity.ts`,
  migration `1760000003000-add-user-enabled-actions.ts`, DTOs, `users.service.ts`,
  `users.controller.ts`, `auth.service.ts`, `AdministradorOrCreateUserGuard`,
  `tenants.controller.ts`, `bootstrap-admin.service.ts`,
  `frontend/lib/portal-actions.ts`, `portal-configure-profile-form.tsx`,
  `portal-register-form.tsx`, `portal-shell.tsx`, `frontend/lib/api/client.ts`,
  `docs/api.md`, `docs/database.md`, `docs/product.md`, `docs/design.md`,
  `openapi.yaml`
- Tests: `enabled-actions.spec.ts`, `users.service.spec.ts`,
  `auth.service.spec.ts`, `administrador-or-create-user.guard.spec.ts`,
  `self-or-administrador.guard.spec.ts`, `users-tenants.e2e-spec.ts`,
  `portal-configure-profile-form.spec.tsx`, `portal-register-form.spec.tsx`,
  `portal-actions.spec.ts`, `frontend/app/portal/page.spec.tsx`

## Validation evidence

- AC-001: passed — `page.spec.tsx` opens a modal titled `Perfil`;
  `portal-configure-profile-form.spec.tsx` edits enabled actions per user
- AC-002: passed — `page.spec.tsx` shows `Configurar Perfil` with an SVG for
  `Administrador` and hides it for a non-`Administrador`
- AC-003: passed — `users-tenants.e2e-spec.ts` returns `401` without a
  session; `users.service.spec.ts` rejects a `Usuario` writing
  `enabledActions`
- AC-004: passed — `portal-configure-profile-form.spec.tsx` filters users by
  tenant
- AC-005: passed — `page.spec.tsx` and `portal-register-form.spec.tsx`
  present `Painel`, `Cadastrar usuário`, and `Editar usuário`; the `Perfil`
  form loads and saves the selected user's actions
- AC-006: passed — `users.service.spec.ts` and `users-tenants.e2e-spec.ts`
  persist mapped `enabledActions` on create and patch and reject unknown
  values with `400`
- AC-007: passed — `users.service.spec.ts` lets the last `Administrador`
  persist `enabledActions` on themselves
- AC-008: passed — `portal-configure-profile-form.spec.tsx` and
  `page.spec.tsx` show `Configuração realizada com sucesso` and keep the
  `Perfil` modal open
- AC-009: passed — create collects the same checkboxes and submits
  `Cadastrar`; `Perfil` submits `Salvar`
- AC-010: passed — `MAPPED_ACTIONS` / `MAPPED_PORTAL_ACTIONS` list only
  `painel`, `createUser`, and `editUser`
- AC-011: passed — `hasMappedAction` and `canCreateUser` keep mapped
  actions for `Administrador` with an empty array; a `Usuario` needs
  `createUser`
- AC-012: passed — self-save calls `refreshSession` and leaves the form
  open; saving another user does not refresh
- AC-013: passed — `bootstrap-admin.service.spec.ts` keeps
  `admin@vetor.tech` as `Administrador`; additive rule grants every mapped
  action
- AC-014: passed — `self-or-administrador.guard.spec.ts` rejects a
  `Usuario` with `editUser` editing another user; `users.service.spec.ts`
  still allows that user to update their own registration

