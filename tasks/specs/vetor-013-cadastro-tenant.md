---
id: VETOR-013
title: Cadastro tenant form
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-21-cadastro-tenant
created_at: 2026-09-21
updated_at: 2026-09-21
---

# Cadastro tenant form

## Context

The requester asked to add a form in Cadastro to register a tenant.
Follow-up answers on 2026-09-21 locked fields, copy, HTTP, persistence,
duplicates, presentation, who may register, and create status.

Original request (Portuguese, preserved):

> Faça a seguinte mudança. Em cadastro, criar um formulário para cadastrar
> a tenant. Nesse cadastro precisamos dos campos de Nome Empresa e email.
> Essa ação criara a tenant.

Follow-up (2026-09-21): email is optional tenant contact; the human fills
`Slug`; duplicate name, email, or slug must not create; fourth Cadastro
action card; persist nullable email on `tenants`; `POST /api/v1/tenants`;
close the modal on success; rename the Cadastro heading to `Cadastro`;
map `enabledActions` UI `Tenant` / API `createTenant`; authorized pt-BR
copy recorded below; only VETOR `Administrador` (Global) may register a
tenant; the new company is usable immediately with stored status
`active`.

Surface: existing portal Cadastro in `PortalShell`. Not a new top-level
sidebar item.

Current Cadastro action cards: `Cadastrar usuário`, `Editar usuário`,
`Configurar Perfil`. This feature adds a fourth card `Cadastrar tenant`,
shown only to `Administrador`.

Today the Cadastro **page heading** is `Cadastro Usuário` (VETOR-008 /
VETOR-009). The implemented sidebar button already reads `Cadastro`.
This specification changes the heading to `Cadastro` and keeps the nav
label `Cadastro` so they match.

Current HTTP: `GET /api/v1/tenants` lists `{ id, name, slug }`. This
feature adds `POST /api/v1/tenants`. No tenant PATCH.

Current persistence: `tenants` has `id`, `name` (varchar 160), `slug`
(varchar 80, unique), `status` (varchar 30, stored value `active` for
bootstrap `vetor` and the entity/migration default), timestamps. No
tenant `email` yet.

VETOR-008 creates `infrastructure/repository/files/{tenantId}` when a
tenant row is inserted. A duplicate must not create a folder. A
successful **new** tenant still gets that folder. No extra file
behavior.

VETOR-010 / VETOR-012: mapped `enabledActions` catalog is additive and
open. `Administrador` (Global) keeps every mapped action even when
`enabledActions` omits them. `createTenant` is added to that catalog and
appears on create-user and `Perfil`. Granting `createTenant` to
`Usuario` or `AdministradorTenant` does **not** authorize
`POST /api/v1/tenants` (`403`), same pattern as `manageProjects` on
`Usuario` in VETOR-012. `createTenant` is not added to the
`AdministradorTenant` implied mapped set.

UI language remains Portuguese (Brazil). This specification body is
English.

## Desired outcome

On Cadastro, an `Administrador` sees a fourth action card `Cadastrar
tenant` that opens a form with `Nome Empresa`, `Slug`, and optional
`Email`. Submitting creates the tenant with status `active`, usable
immediately. Email is company contact only and does not create a user. A
duplicate name, email, or slug is refused. The modal closes on success.
The Cadastro heading and nav read `Cadastro`. Other profiles do not see
the card and receive `403` on create, even with `createTenant` granted.

## In scope

- Fourth Cadastro action card `Cadastrar tenant` on the existing Cadastro
  surface (with `Cadastrar usuário`, `Editar usuário`, `Configurar
Perfil`). No new top-level nav item.
- Show `Cadastrar tenant` only to `Administrador` (Global / VETOR
  all-tenant admins). Hide it from `AdministradorTenant` and `Usuario`.
- Rename the Cadastro page heading from `Cadastro Usuário` to `Cadastro`.
  Keep the sidebar label `Cadastro` so heading and nav match. This
  updates VETOR-008 / VETOR-009 copy for that heading.
- Modal/form titled `Cadastrar tenant` with fields `Nome Empresa`
  (required), `Slug` (required, human-filled), `Email` (optional tenant
  contact, not marked required).
- Submit creates the tenant through `POST /api/v1/tenants`. Only
  `Administrador` may call it. Unauthenticated callers receive `401`.
  `AdministradorTenant` and `Usuario` receive `403`, including when
  `createTenant` is in `enabledActions`.
- Persist unique `name`, unique `slug` (as today), nullable unique
  `email` on `tenants` (empty email does not collide with other empty
  emails), and `status` `active` (existing usable value used by `vetor`
  and current tenants).
- Duplicate name, email (when provided), or slug: do not create; inform
  the user; do not create a folder.
- Successful new tenant: create `repository/files/{tenantId}` per
  VETOR-008 / VETOR-009.
- Map `enabledActions` API `createTenant` to UI `Tenant`. Present that
  checkbox on create-user and `Perfil`. Global keeps every mapped action
  including `createTenant`. Granting it does not authorize tenant create
  for non-`Administrador` callers.
- Recorded pt-BR copy in the copy table.
- Close the modal after success.
- Delivery-chosen custom inline SVG icon (no icon library), action-card
  style, building/company mark, same delegated-icon pattern as the
  VETOR-010 gear.

## Out of scope

- A new top-level sidebar item
- `PATCH` / `DELETE` tenant, or any extra tenant HTTP besides
  `POST /api/v1/tenants`
- Creating a user, sending invite or password-change mail, or treating
  email as anything other than optional tenant contact
- Extra filesystem behavior beyond folder-on-insert for a **new** tenant
- Creating a folder when create is refused (duplicate or other failure)
- Letting `AdministradorTenant` or `Usuario` create a tenant, including
  when `createTenant` is granted
- Adding `createTenant` to the `AdministradorTenant` implied mapped set
- A new tenant status value or status enum (create uses existing
  `active`)
- Changing bootstrap tenant `vetor` or `admin@vetor.tech`
- Public or unauthenticated tenant self-registration
- Implementation before a named human sets `status: approved`

## Acceptance criteria

- AC-001: Existing Cadastro presents a fourth action card labeled
  `Cadastrar tenant` that opens a modal titled `Cadastrar tenant`. The
  page heading and sidebar nav are `Cadastro` (heading no longer
  `Cadastro Usuário`). This specification does not add a new top-level
  sidebar item. Only `Administrador` sees a working `Cadastrar tenant`
  card. `AdministradorTenant` and `Usuario` do not get that card.
- AC-002: The form fields are `Nome Empresa` (required), `Slug`
  (required), and `Email` (optional, not marked required).
- AC-003: Submitting a valid form creates the tenant through
  `POST /api/v1/tenants`.
- AC-004: Only an authenticated `Administrador` (Global / VETOR
  all-tenant admins) may open the form or call `POST /api/v1/tenants`.
  Unauthenticated callers receive `401`. `AdministradorTenant` and
  `Usuario` receive `403`, including when `createTenant` is present in
  `enabledActions`. Frontend hiding of the card is UX only.
- AC-005: `Email` is optional tenant contact only. It does not create a
  user and does not send mail. When provided it is persisted on the
  tenant. When omitted it is stored as empty/null.
- AC-006: The human fills `Slug`. The API persists it as unique
  `tenants.slug` (existing uniqueness).
- AC-007: If `name`, provided `email`, or `slug` already exists, the
  tenant is not created, no folder is created, the API returns `409`,
  and the UI shows `Já existe uma tenant com estes dados. Não é possível
criar outra.` Empty optional emails do not collide with other empty
  emails.
- AC-008: A newly created tenant is usable immediately. Stored
  `tenants.status` is `active`, matching bootstrap `vetor` and the
  existing tenant column default. This specification does not add a
  new status value.
- AC-009: UI copy matches the copy table in User experience.
- AC-010: `Cadastrar tenant` is a fourth Cadastro action card alongside
  `Cadastrar usuário`, `Editar usuário`, and `Configurar Perfil`.
- AC-011: Mapped action API `createTenant` / UI `Tenant` is added to the
  open catalog and appears as a checkbox on create-user and `Perfil`.
  `Administrador` (Global) keeps every mapped action including
  `createTenant` (existing additive rule). Granting `createTenant` to
  `Usuario` or `AdministradorTenant` does not authorize
  `POST /api/v1/tenants` (`403`), same pattern as `manageProjects` on
  `Usuario` in VETOR-012. `createTenant` is not implied for
  `AdministradorTenant` by profile.
- AC-012: `tenants` persists nullable `email`. Approved delivery updates
  `docs/database.md`.
- AC-013: A successful **new** tenant gets
  `infrastructure/repository/files/{tenantId}` per VETOR-008 / VETOR-009.
  A refused create (including duplicate) does not create a folder.
- AC-014: `POST /api/v1/tenants` accepts `{ name, slug, email? }`,
  requires an access cookie, is `Administrador` only, returns `201`
  with `{ id, name, slug, email }`, and errors `400`, `401`, `403`,
  `409`. No tenant PATCH in this specification. `GET /api/v1/tenants`
  stays `{ id, name, slug }` unless a later approved specification adds
  `email` to the list.
- AC-015: `name` is required, max 160 (existing `tenants.name`). `slug`
  is required, max 80 (existing `tenants.slug`). `email` is optional;
  when provided it must be a valid email, max 255 (same as user email).
  Missing required fields are `400` and UI
  `Preencha todos os campos obrigatórios.`
- AC-016: After success the modal closes. Success copy is `Operação
realizada com sucesso.`
- AC-017: Delivery chooses a custom inline SVG (building/company mark)
  in the existing action-card style. No icon library.

## User experience

1. An authenticated actor opens Cadastro on `/portal`. Heading and nav
   show `Cadastro`.
2. The section shows `Cadastrar usuário`, `Editar usuário`, and
   `Configurar Perfil` according to existing rules. `Administrador` also
   sees `Cadastrar tenant`. `AdministradorTenant` and `Usuario` do not
   see that card, even if `createTenant` is granted. Frontend hiding is
   UX only.
3. `Cadastrar tenant` opens a modal titled `Cadastrar tenant`. Icon is a
   delivery-chosen inline SVG (building/company), no library, matching
   existing action-card SVGs (same pattern as the VETOR-010 gear).
4. Fields: `Nome Empresa` (required), `Slug` (required), `Email`
   (optional, not marked required).
5. Submit is `Cadastrar` (loading `Cadastrando...`, same as create-user).
   Cancel is `Cancelar` and closes without creating. Modal dismiss (X /
   Escape) also closes without creating.
6. Valid submit creates the tenant with status `active`. The company is
   usable immediately (tenant lists and other session-tenant surfaces
   can use it). The UI shows `Operação realizada com sucesso.` and
   **closes** the modal (unlike `Perfil`, which stays open).
7. Duplicate name, email, or slug: stay on the form, show `Já existe uma
tenant com estes dados. Não é possível criar outra.`
8. Missing required name or slug: `Preencha todos os campos
obrigatórios.` (same as create/edit user).
9. Forbidden: `Você não tem permissão para esta ação.`
10. Other failure: `Não foi possível concluir a operação.`
11. Create-user and `Perfil` present checkbox `Tenant` mapped to
    `createTenant`, in addition to the already mapped actions. Checking
    it on a non-`Administrador` user does not reveal `Cadastrar tenant`
    or allow `POST /api/v1/tenants`.

### Copy table (pt-BR, exact)

Cadastro create-user success today is `Usuário cadastrado.` (then the
modal closes). `Perfil` success is `Configuração realizada com sucesso`
and stays open. This tenant form uses the shared portal success line
already recorded for Projetos, because the create-user line is
user-specific.

| Surface                       | Exact copy                                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| Sidebar nav                   | `Cadastro`                                                          |
| Page heading                  | `Cadastro`                                                          |
| Action card                   | `Cadastrar tenant`                                                  |
| Modal / form title            | `Cadastrar tenant`                                                  |
| Company name field            | `Nome Empresa`                                                      |
| Slug field                    | `Slug`                                                              |
| Email field                   | `Email` (not marked required)                                       |
| Submit                        | `Cadastrar`                                                         |
| Submit while loading          | `Cadastrando...`                                                    |
| Cancel                        | `Cancelar`                                                          |
| Success                       | `Operação realizada com sucesso.`                                   |
| Duplicate name / email / slug | `Já existe uma tenant com estes dados. Não é possível criar outra.` |
| Missing required fields       | `Preencha todos os campos obrigatórios.`                            |
| Forbidden                     | `Você não tem permissão para esta ação.`                            |
| Generic failure               | `Não foi possível concluir a operação.`                             |
| `enabledActions` checkbox     | `Tenant`                                                            |

## API and integrations

If this feature adds or changes an HTTP endpoint, record the method, path,
payload, response, errors, and authentication. Approved delivery must update
Swagger, `openapi.yaml`, and `docs/api.md` in the same change.

Portuguese UI labels map to English API fields and actions:

| UI label       | API                                      |
| -------------- | ---------------------------------------- |
| `Nome Empresa` | `name`                                   |
| `Slug`         | `slug`                                   |
| `Email`        | `email` (omit or null/empty when unused) |
| `Tenant`       | `createTenant`                           |

`POST /api/v1/users` and `PATCH /api/v1/users/{id}` `enabledActions`
accept `createTenant` in addition to the VETOR-012 mapped set. Unknown
values remain `400`. Storing `createTenant` on a non-`Administrador`
user does not authorize tenant create.

| Method | Path              | Auth                                                                                                                             | Request                       | Success                                                                | Errors                     |
| ------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| GET    | `/api/v1/tenants` | Unchanged: `Administrador`; `AdministradorTenant` (own tenant); `Usuario` with `createUser`                                      | None                          | `{ id, name, slug }[]`                                                 | `401`, `403`               |
| POST   | `/api/v1/tenants` | Access cookie. `Administrador` only. `AdministradorTenant` and `Usuario` are `403` even with `createTenant` in `enabledActions`. | JSON `{ name, slug, email? }` | `201` `{ id, name, slug, email }` (`email` null or empty when omitted) | `400`, `401`, `403`, `409` |

`GET /api/v1/tenants` is unchanged. This specification does not add
`email` to the list DTO.

POST does not accept `id` or `status` from the client. Extra properties
are rejected (`400`). The backend sets `status` to `active`.

`400`: missing/blank `name` or `slug`, `name` longer than 160, `slug`
longer than 80, `email` present but invalid or longer than 255.

`409`: another tenant already has that `name`, that `slug`, or that
non-empty `email`.

`401`: no valid access cookie.

`403`: authenticated but not `Administrador`.

No `PATCH /api/v1/tenants`, no other new tenant routes.

Create does not create a user and does not send email.

## Data impact

`tenants` today: `id` (UUID), `name` varchar 160, `slug` varchar 80
unique (`uq_tenants_slug`), `status` varchar 30 default `active`,
timestamps.

This feature:

- Keeps `name` varchar 160. `name` must be unique. Duplicate `name` is
  `409`.
- Keeps `slug` varchar 80 unique. The human supplies `slug`. Duplicate
  `slug` is `409`.
- Adds nullable `email` varchar 255. When present it must be unique.
  Multiple tenants with empty/null email are allowed.
- Sets `status` to `active` on create. That is the existing stored value
  used by bootstrap tenant `vetor` (`bootstrap-admin.service` insert),
  the TypeORM column default, and migration
  `1760000000000-create-portal-tables`. This specification does not
  introduce another status value.
- `id` remains a generated UUID.
- Does not insert a `users` row.

Filesystem: successful insert creates
`infrastructure/repository/files/{tenantId}` (existing VETOR-008 /
VETOR-009 rule). Duplicate or other failed create does not create a
folder. Folder paths are not returned to the browser.

Mapped `users.enabled_actions` adds `createTenant`. The catalog remains
open. `createTenant` is not part of the `AdministradorTenant` implied
mapped set.

Approved delivery updates `docs/database.md`, `docs/api.md`,
`openapi.yaml`, Swagger, and `docs/product.md` for the heading rename,
the new mapped action, unique `name` / nullable unique `email`, and
`Administrador`-only tenant create.

## Security

Existing project security rules apply.

- Portal authorization remains backend-enforced. Hiding `Cadastrar
tenant` is UX only.
- `POST /api/v1/tenants` requires a valid access cookie (`401` without
  it). Only `Administrador` is permitted. `AdministradorTenant` and
  `Usuario` receive `403`, including when `enabledActions` contains
  `createTenant` (same pattern as `manageProjects` on `Usuario` in
  VETOR-012).
- `Administrador` (Global) keeps every mapped action, including
  `createTenant`, under the existing additive catalog rule.
- The client must not set `id` or `status`. The backend sets `status` to
  `active`.
- Duplicate creates must not write a second row or a folder.
- Do not log secrets. Do not return filesystem paths.
- Email, when stored, is contact data on the tenant, not a login.
- Frontend checks are UX only.

## Testing

- AC-001: Cadastro heading and nav are `Cadastro`; fourth card
  `Cadastrar tenant` opens modal `Cadastrar tenant` for
  `Administrador`; other profiles do not get that card; no new
  top-level item
- AC-002: fields `Nome Empresa`, `Slug` required; `Email` optional and
  not marked required
- AC-003: valid submit creates the tenant via `POST /api/v1/tenants`
- AC-004: unauthenticated create is `401`; `AdministradorTenant` and
  `Usuario` (with or without `createTenant`) are `403`; only
  `Administrador` succeeds
- AC-005: email is optional contact; no user row; no mail; persisted
  when provided
- AC-006: slug comes from the form and is stored unique
- AC-007: duplicate name, email, or slug is `409`, no row, no folder,
  duplicate copy shown; empty emails do not collide
- AC-008: created tenant `status` is `active` and the company is usable
  immediately
- AC-009: copy table strings
- AC-010: fourth card with the three existing Cadastro cards
- AC-011: `createTenant` / `Tenant` on create-user and `Perfil`; Global
  additive; grant on non-`Administrador` does not authorize POST
- AC-012: nullable `tenants.email`
- AC-013: new tenant folder on successful insert only
- AC-014: POST contract `201` / `400` / `401` / `403` / `409`;
  `Administrador` only; no PATCH
- AC-015: max lengths 160 / 80 / 255; email format when provided;
  required copy
- AC-016: success copy and modal closes
- AC-017: delivery-chosen inline SVG, no icon library

Workspace commands after approved delivery: frontend and backend
`typecheck`, `lint`, `test`, and `build` for the touched workspaces;
backend `test:e2e` when HTTP is crossed; `spec-driven-development`.

## Delivery

This specification is `implemented`. A named human invoked
`/goal @tasks/specs/vetor-013-cadastro-tenant.md` on 2026-09-21 while the
specification was `in_review`. That invocation was treated as human
approval. Delivery recorded the Changed, Tests, and command evidence below.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-21-cadastro-tenant`
- Request: in Cadastro, a form to register a tenant; fields `Nome
Empresa` and `email`; submit creates the tenant.
- Follow-up 2026-09-21: email is optional tenant contact; human fills
  slug; duplicates of name/email/slug refused with user-facing already-
  exists copy; empty emails do not collide; fourth action card;
  `enabledActions` `Tenant` / `createTenant` on create-user and Perfil;
  persist nullable email on tenants; folder only for a new tenant;
  `POST /api/v1/tenants` with `name`, `slug`, optional `email`, `201`
  DTO including email, errors `401`/`403`/`400`/`409`; name and slug
  required with existing column max lengths; email format when provided;
  close modal on success; heading (and matching nav) `Cadastro`;
  delivery-chosen building/company inline SVG; authorized pt-BR copy.
  Only VETOR `Administrador` (Global) may register a tenant;
  `AdministradorTenant` and `Usuario` are `403` even with
  `createTenant`; hide the card except from `Administrador`; created
  company is usable immediately with status `active`.
- Conflicts with: VETOR-008 / VETOR-009 heading `Cadastro Usuário`
  (this spec updates that heading to `Cadastro`). VETOR-012 Cadastro
  cards were three; this adds a fourth, Global-only. VETOR-012
  `AdministradorTenant` implied mapped set does not include
  `createTenant`. `docs/database.md` tenants had no email and `name`
  was not unique.
- Existing contracts consulted: `tasks/specs/_template.md`,
  `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`, `tasks/specs/vetor-008-portal-layout-dashboard.md`,
  `tasks/specs/vetor-009-user-photo-upload-sidebar-logo.md`,
  `tasks/specs/vetor-010-perfil-modal-user-permissions.md`,
  `tasks/specs/vetor-012-portal-project-kanban.md`, `docs/product.md`,
  `docs/database.md`, `docs/api.md`, Cadastro UI (`portal-register-form`,
  `PortalShell` cards and heading `Cadastro Usuário` / nav `Cadastro`),
  `tenants.entity` (`name` 160, `slug` 80, `status` default `active`),
  `bootstrap-admin.service` (`vetor` insert `status: 'active'`),
  migration default `active`, user email max 255,
  `enabled-actions.ts` additive Global rule, VETOR-012 `manageProjects`
  on `Usuario` is `403`

## Implementation evidence

- Changed: `backend/src/modules/portal/tenants.controller.ts`,
  `tenants.service.ts`, `entities/tenant.entity.ts`,
  `dto/create-tenant.dto.ts`, `dto/tenant-created.dto.ts`,
  `enabled-actions.ts`, `administrador.guard.spec.ts`,
  `backend/src/database/migrations/1760000005000-add-tenant-email-and-unique-name.ts`,
  `backend/src/common/swagger/examples.ts`,
  `backend/test/tenants.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/forms/portal-register-tenant-form.tsx`,
  `frontend/lib/api/client.ts`, `frontend/lib/portal-actions.ts`,
  `frontend/app/portal/page.spec.tsx`, `docs/product.md`,
  `docs/design.md`, `docs/api.md`, `docs/database.md`, and
  `openapi.yaml`.
- Tests: `backend/src/modules/portal/tenants.service.spec.ts`,
  `enabled-actions.spec.ts`, `administrador.guard.spec.ts`,
  `backend/test/tenants.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`,
  `frontend/components/forms/portal-register-tenant-form.spec.tsx`,
  `frontend/app/portal/page.spec.tsx`,
  `frontend/lib/portal-actions.spec.ts`,
  `frontend/components/forms/portal-register-form.spec.tsx`,
  `frontend/components/forms/portal-configure-profile-form.spec.tsx`.
- Commands: `npm run typecheck` passed;
  `npm run lint` passed;
  `npm run test` passed (backend 134, frontend 110, SDD 10);
  `npm run test:e2e` passed (backend 52);
  `spec-driven-development` passed (13 specifications);
  `npm run build` passed.
- Limitations: Human validation of AC-001–AC-017 has not started. Live
  browser walkthrough was not run in this delivery session. Migration
  `1760000005000-add-tenant-email-and-unique-name` is in the repo and
  was not applied to a local database in this session. `npm run
  docker:config` was not run.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
- AC-007: not recorded
- AC-008: not recorded
- AC-009: not recorded
- AC-010: not recorded
- AC-011: not recorded
- AC-012: not recorded
- AC-013: not recorded
- AC-014: not recorded
- AC-015: not recorded
- AC-016: not recorded
- AC-017: not recorded
