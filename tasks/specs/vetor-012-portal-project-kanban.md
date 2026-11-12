---
id: VETOR-012
title: Portal project Kanban
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-20-portal-kanban-projetos
created_at: 2026-09-20
updated_at: 2026-09-21
---

# Portal project Kanban

## Context

The named human approver invoked `/goal` on this specification on
2026-09-21 and thereby approved it for delivery.

The requester asked for a Trello-style board on the authenticated portal so a
tenant client can move cards and interact with the VETOR development team.

The portal already has tenants, JWT session `tenantId`, ABAC
`Administrador` (all-tenant) and `Usuario` (session tenant),
`enabledActions`, and tenant filesystem folders from VETOR-009. VETOR-010
maps `painel`, `createUser`, and `editUser` and restricts Cadastro Usuário /
Configurar Perfil writes to `Administrador` (plus `createUser` on
`Usuario`). This specification **updates that VETOR-010 delta** for the new
`AdministradorTenant` profile on tenant-scoped operations. VETOR-011 Power
BI Embedded is `implemented` and must not be reopened. Power BI “workspace”
is a Microsoft catalog concept. This specification adds a **distinct**
portal entity: project workspace.

Today `users.profile` has two values: `Administrador` and `Usuario`. This
feature promotes a third profile, `AdministradorTenant`. Bootstrap
`admin@vetor.tech` remains `Administrador` (Global). The VETOR team operates
as Administrador Global.

UI language is Portuguese (Brazil) per `docs/product.md`. Identifiers, API
fields, stored keys, and this specification are English. Exact pt-BR copy is
recorded below.

Follow-up decisions (2026-09-21) resolve the earlier open items: move and
reorder require `moveCards`; Projetos is hidden without `viewProjects`;
Global tenant selection updates session `tenantId`; project has only
`name`; assignee, title, and description are required; due date is optional
in `America/Sao_Paulo`; comments may be created, edited, and deleted;
conservative field limits are recorded; deletes are hard CASCADE;
attachment download matches VETOR-009 photo GET; the board route is
`/portal/projetos/{id}`; AdministradorTenant may operate their whole tenant
except Global-only surfaces and profile assignment of
`Administrador` / `AdministradorTenant`; Global may demote
`AdministradorTenant` to `Usuario`; checkbox labels are recorded; deleted
card numbers are not reused.

## Desired outcome

An authorized portal user opens `/portal/projetos`, works inside the session
tenant, and uses project workspaces, projects, and one Kanban board per
project at `/portal/projetos/{id}`. The client and the VETOR team share
cards, comments, and attachments. Administrador Global can switch tenant on
Projetos; that switch updates session `tenantId`, so other session-tenant
surfaces (including Relatórios / embed from VETOR-011) follow the new
tenant. Administrador Tenant and Usuario cannot switch tenant.
Administrador Tenant may perform every tenant-scoped portal operation on
their own tenant, including Cadastro Usuário and Configurar Perfil for
users of that tenant. Usuario never creates, edits, or deletes workspaces
or projects. A Usuario with `viewProjects` works cards except move/reorder,
which require `moveCards`. Persistence is PostgreSQL behind NestJS. The
frontend does not access the database.

## In scope

- Authenticated portal routes `/portal/projetos` and
  `/portal/projetos/{id}` (project id). Shell item `Projetos` with a custom
  inline SVG icon (no icon library). Delivery chooses the pictogram most
  adherent to a board/columns, in the existing `portal-shell.tsx` stroke
  style. Hide `Projetos` when the actor lacks `viewProjects` (UX only).
- Persist tenant → 1..n project workspaces → 1..n projects → 1 Kanban board
  per project. A project workspace is not a Power BI workspace.
- Workspace persisted field: `name` only (plus identity and timestamps).
- Project persisted field: `name` only (plus identity, `next_card_number`,
  and timestamps).
- Clicking the project name navigates to `/portal/projetos/{id}`.
- Six lanes in fixed order, pt-BR labels with stable English stored keys.
- Third profile `AdministradorTenant`. Only Administrador Global assigns,
  changes, or demotes that profile (`Usuario` ↔ `AdministradorTenant`) from
  Cadastro Usuário / Configurar Perfil. Administrador Tenant and Usuario do
  not assign profile. Creating additional `Administrador` (Global) users
  stays unchanged from VETOR-008 / VETOR-010 (create default remains
  `Usuario` unless Global sets `AdministradorTenant`).
- Tenant picker on Projetos for Administrador Global only (`Tenant` /
  `Selecione um tenant`). Selecting a tenant **changes session
  `tenantId`**. Administrador Tenant and Usuario do not see the picker.
- Workspace and project create, rename, and delete: Administrador Global
  (session tenant after switch) and Administrador Tenant (own tenant).
  Usuario receives `403` even with `manageProjects`.
- Card create, edit (title, description, required assignee, optional due
  date, priority, tags), comment (create, edit, delete), attach, and delete
  for actors with card access. Move and reorder additionally require
  `moveCards`.
- Card number is one sequence per project (`#1`, `#2`, `#3`…); each new
  card consumes the next number; deleted numbers are not reused.
- Attachments: JPEG, PNG, and PDF; maximum 5 MB per file; maximum 10 per
  card; stored in the existing VETOR-009 tenant folder
  `infrastructure/repository/files/{tenantId}`. Authenticated GET in the
  same style as `GET /api/v1/users/{id}/photo`.
- Movement without drag-and-drop: `Mover` lists the other five lanes;
  `Subir` / `Descer` reorder within the lane; lane and order persist.
- Hard delete (not archive) with CASCADE: workspace → projects → cards,
  comments, attachments, and attachment files. No movement history.
- Map `viewProjects` (`Projetos`), `manageProjects` (`Gerenciar
  projetos`), and `moveCards` (`Mover cards`) into create-user and the
  `Perfil` modal. Catalog stays open (VETOR-010).
- Additive grants: Administrador Global has every mapped action even when
  `enabledActions` omits them. Administrador Tenant has `painel`,
  `createUser`, `editUser`, `viewProjects`, `manageProjects`, and
  `moveCards` by profile even when `enabledActions` is empty, on their own
  tenant only. Usuario receives only values stored in `enabledActions`.
- AdministradorTenant tenant-scoped Cadastro Usuário: create users of that
  tenant; edit other users of that tenant; Configurar Perfil
  (`enabledActions`) for users of that tenant. They cannot switch tenant,
  access Power BI catalog/admin, assign `Administrador`, or assign /
  demote `AdministradorTenant`.
- Backend authorization is the authority. Frontend hiding is UX only.
- PostgreSQL + NestJS persistence. Approved delivery updates
  `docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
  Swagger, and `docs/database.md`.
- Exact UI copy in User experience.
- Optional jsonb `metadata` on cards, comments, and projects for future
  agents, with no UI.

## Out of scope

- Trello, Jira, Linear, or any external Kanban product
- Power BI catalog, import, distribution, or admin UI (VETOR-011 stays
  `Administrador` only). Relatórios / embed continue to use session
  `tenantId`; this specification does not change those endpoints.
- Leadpage, native apps, offline PWA shell, billing
- Drag-and-drop
- Archive and movement history
- Icon library and a second font family
- Chat outside the card
- Workspace or project fields other than `name`
- Copy other than the recorded table, unless the human corrects it
- Screens, routes, buttons, or required fields for optional/extensible
  `metadata`
- Assigning profile `Administrador` (Global) from Cadastro / Perfil
- Implementation until this specification is `approved`
- Approving this specification

## Acceptance criteria

- AC-001: `/portal/projetos` is present in the authenticated shell with
  label `Projetos` and a custom inline SVG icon (no icon library). The item
  is hidden when the actor lacks `viewProjects`. Direct API calls without
  that access still receive `401` or `403`.
- AC-002: A tenant may have several project workspaces; a workspace may have
  several projects; workspace and project each have only the `name` field.
- AC-003: Clicking the project name navigates to `/portal/projetos/{id}`
  and opens that project's Kanban (`{id}` is the project id).
- AC-004: Lanes are `Backlog`, `Pronto`, `Trabalhando`, `Revisão`, `Deploy`,
  `Finalizado` in that fixed order.
- AC-005: A card has required title, required description, persisted
  creator, required assignee, optional due date, priority `Baixa` /
  `Média` / `Alta`, tags, a per-project sequential number, comments, and
  attachments, within the recorded limits.
- AC-006: `Mover` lists the other lanes; `Subir` / `Descer` reorder within
  the lane; lane and order persist. Those controls and endpoints require
  `moveCards`. There is no drag-and-drop.
- AC-007: Administrador Global selects a tenant on Projetos and that
  selection changes session `tenantId`. Other session-tenant surfaces
  follow the new tenant. Administrador Tenant and Usuario remain on their
  home tenant and cannot switch.
- AC-008: Workspace and project create, rename, and delete are allowed only
  for Administrador Global and Administrador Tenant (Tenant Admin only on
  their tenant). Usuario receives `403`.
- AC-009: Hard delete removes the row (not archive) with CASCADE.
  Deleting a workspace removes its projects, cards, comments, attachments,
  and attachment files. Deleting a project removes its cards and dependents.
- AC-010: Comments are persisted with author. Actors with card access may
  create, edit, and delete comments on that card.
- AC-011: An attachment must be JPEG, PNG, or PDF and at most 5 MB, stored
  in the tenant folder from VETOR-009, at most 10 per card. Another type or
  a larger file is rejected. Download is an authenticated GET in the
  VETOR-009 photo style.
- AC-012: `enabledActions` includes `viewProjects`, `manageProjects`, and
  `moveCards`. Administrador Global has every mapped action.
  Administrador Tenant has `painel`, `createUser`, `editUser`,
  `viewProjects`, `manageProjects`, and `moveCards` by profile on their own
  tenant even when `enabledActions` is empty.
- AC-013: Only Administrador Global assigns, changes, or demotes profile
  `AdministradorTenant` (`Usuario` ↔ `AdministradorTenant`) from Cadastro
  Usuário / Configurar Perfil. Administrador Tenant and Usuario receive
  `403` when writing `profile`. Profile `Administrador` is not assigned
  through this flow.
- AC-014: A `Usuario` with `viewProjects` performs all card functions
  except move and reorder (create, edit listed fields, comment, attach,
  delete). Move and reorder require `moveCards`. Without `moveCards`, those
  endpoints are `403` and `Mover` / `Subir` / `Descer` are hidden.
- AC-015: Profiles are `Administrador`, `AdministradorTenant`, and
  `Usuario`. Bootstrap `admin@vetor.tech` remains `Administrador`.
  AdministradorTenant may perform tenant-scoped Painel, Cadastro Usuário
  (create; edit other users of that tenant; Configurar Perfil for users of
  that tenant), and Projetos. They cannot switch tenant, use Power BI
  catalog/admin, or assign Global / Tenant Admin profiles.
- AC-016: Operations are authenticated and authorized on the backend.
  Unauthenticated callers receive `401`. Unauthorized callers receive
  `403`. Frontend checks are UX only.
- AC-017: Card number sequence is one per project; each new card consumes
  the next number; deleted numbers are not reused.

## User experience

UI language is Portuguese (Brazil). Visual treatment follows
`docs/design.md`: navy sidebar, off-white or dark main area, Inter, VETOR
tokens, existing modal accessibility, custom inline SVG. Do not add an icon
library. Displayed dates and times, including due dates, use timezone
`America/Sao_Paulo`.

### Shell

Keep existing items (`Painel`, `Relatórios`, `Power BI` for
`Administrador` only, `Cadastro`). Add:

| Label | Route | Visibility |
| ----- | ----- | ---------- |
| `Projetos` | `/portal/projetos` | Show when the actor has `viewProjects` (Administrador and AdministradorTenant by profile; Usuario only when granted). Otherwise hide. |

Hiding a control is UX only. Authorization is backend-enforced.

The `Projetos` icon is a custom inline SVG. Delivery chooses the pictogram
most adherent to a board/columns, matching the existing shell stroke style.

Main heading on `/portal/projetos`: `Projetos`.

Clicking a project name navigates to `/portal/projetos/{id}` (project id)
and shows that project's Kanban. Heading on the board remains `Projetos`
(recorded title copy).

### Profiles (promote in `docs/product.md` on approved delivery)

| UI | API `users.profile` | Scope |
| -- | ------------------- | ----- |
| `Administrador Global` | `Administrador` | All tenants (existing). May switch session tenant from Projetos. |
| `Administrador Tenant` | `AdministradorTenant` | Account tenant only. All tenant-scoped portal operations on that tenant. |
| `User` | `Usuario` | Account tenant only. Mapped extras only via `enabledActions`. |

Bootstrap `admin@vetor.tech` stays `Administrador`.

AdministradorTenant on their own tenant may use:

- Painel
- Cadastrar usuário (users of that tenant; `tenantId` is the session
  tenant, not a Global picker)
- Editar usuário, including other users of that tenant
- Configurar Perfil (`enabledActions`) for users of that tenant
- Projetos (`viewProjects`, `manageProjects`, `moveCards` by profile)

AdministradorTenant cannot:

- Switch tenant
- Access Power BI catalog/admin (VETOR-011 remains `Administrador`)
- Assign or hold all-tenant Global-only surfaces
- Create or assign profile `Administrador`
- Assign or demote `AdministradorTenant` (Global only)

Relatórios remain session-tenant. For AdministradorTenant that is always
their home tenant. For Global, Relatórios follow the tenant selected on
Projetos.

Usuario with `editUser` still edits only their own registration (VETOR-010
unchanged for `Usuario`).

Cadastro Usuário action cards:

- `Cadastrar usuário`: Administrador; AdministradorTenant (own tenant);
  Usuario with `createUser`
- `Editar usuário`: every authenticated profile (self); Administrador any
  user; AdministradorTenant other users of their tenant
- `Configurar Perfil`: Administrador (any tenant); AdministradorTenant
  (users of their tenant, no tenant switcher). Hide from Usuario.

### Tenant picker

On `/portal/projetos`, Administrador Global sees selector label `Tenant` and
placeholder `Selecione um tenant`, loaded from `GET /api/v1/tenants`.
Choosing a tenant updates the session `tenantId` (new access token and
session payload). Header tenant `name` and other session-tenant surfaces
follow immediately. Login always starts from `users.tenant_id` (vetor for
bootstrap). A rotated refresh keeps the working `tenantId` until logout.
`users.tenant_id` is not rewritten by the picker.

Administrador Tenant and Usuario do not see the picker and cannot switch
tenant (`403` on the session-tenant write).

Until Global selects another tenant, the session tenant remains the home
tenant. Empty-state copy applies for the current session tenant.

### Workspaces and projects

After a tenant context exists:

- Empty workspaces: `Nenhuma workspace neste tenant.`
- Control `Nova workspace` for Global and Tenant Admin only.
- A workspace shows its name. Global and Tenant Admin can edit the name and
  delete the workspace. Usuario does not get working create/rename/delete
  controls.
- Empty projects in a workspace: `Nenhum projeto nesta workspace.`
- Control `Novo projeto` for Global and Tenant Admin only.
- Clicking the project name goes to `/portal/projetos/{id}`.
- Project shows `name` only.
- Delete confirmations:
  - Workspace: `Excluir esta workspace e todos os projetos e cards?`
  - Project: `Excluir este projeto e todos os cards?`
- Confirm uses `Excluir`. Dismiss uses `Cancelar`. Persist uses `Salvar`
  where a name is edited. Do not add unrecorded dialog titles; those
  buttons and confirmations are the copy.

### Kanban

Fixed lanes, left to right:

| Order | Stored key | pt-BR label |
| ----- | ---------- | ----------- |
| 1 | `backlog` | `Backlog` |
| 2 | `ready` | `Pronto` |
| 3 | `working` | `Trabalhando` |
| 4 | `review` | `Revisão` |
| 5 | `deploy` | `Deploy` |
| 6 | `done` | `Finalizado` |

Lane keys are identifier design, not extra product lanes.

Empty lane: `Nenhum card.`

Control `Novo card` when the actor has `viewProjects` (or implying
profile).

No drag-and-drop. Each card exposes:

- `Mover` — lists the **other five** lanes (not the current lane). Shown
  only with `moveCards`.
- `Subir` — move one position up in the same lane. Shown only with
  `moveCards`.
- `Descer` — move one position down in the same lane. Shown only with
  `moveCards`.
- `Excluir` — confirm with `Excluir este card?`

Lane membership and order in the lane are free and persisted.

### Card fields and comments

Displayed and editable as recorded (creator and card number are assigned by
the backend):

- Title — required, 1–120 characters
- Description — required, 1–10000 characters
- Creator (who created the card; persisted; not editable)
- Assignee — required. Picker lists only users of that tenant who have
  Projetos access: `viewProjects` on `Usuario`, or `Administrador` /
  `AdministradorTenant` (those profiles have it by grant). No empty
  assignee.
- Due date — optional. Interpret and display in `America/Sao_Paulo`. API
  values remain ISO 8601 timestamptz per `docs/api.md`.
- Priority UI: `Baixa`, `Média`, `Alta`
- Tags — maximum 20; each 1–40 characters after trim; empty-after-trim
  values are rejected
- Card number: `#` plus the per-project sequence (not reused)
- Comments: control `Comentar`; empty `Nenhum comentário.`; author
  persisted; create, edit (`Salvar`), and delete (`Excluir`) by anyone
  with card access on that tenant (no author-only restriction)
- Attachments: JPEG, PNG, PDF; maximum 5 MB each; maximum 10 per card;
  invalid file copy `Envie JPEG, PNG ou PDF de até 5 MB.`

Limits that exceed the recorded maxima, or blank required fields, use
`Não foi possível concluir a operação.` (no extra marketing strings). File
type/size failures use the recorded file copy.

Comment body: 1–4000 characters. Maximum 500 comments per card.

### `enabledActions` in Cadastro Usuário and Perfil

The three actions enter create-user and the `Perfil` modal together with the
existing VETOR-010 options.

| UI label | API value |
| -------- | --------- |
| `Painel` | `painel` |
| `Cadastrar usuário` | `createUser` |
| `Editar usuário` | `editUser` |
| `Projetos` | `viewProjects` |
| `Gerenciar projetos` | `manageProjects` |
| `Mover cards` | `moveCards` |

`manageProjects` on a Usuario does not authorize workspace/project CRUD
(`403`).

### Feedback copy (exact)

| Use | Copy |
| --- | ---- |
| Success | `Operação realizada com sucesso.` |
| Forbidden | `Você não tem permissão para esta ação.` |
| Generic failure | `Não foi possível concluir a operação.` |
| Not found | `Este registro não existe.` |

Do not add a toast library. Follow the existing portal status pattern.

### Recorded button and empty copy

| Use | Copy |
| --- | ---- |
| Menu | `Projetos` |
| Title | `Projetos` |
| Selector (Global only) | `Tenant` |
| Selector placeholder | `Selecione um tenant` |
| Button | `Nova workspace` |
| Button | `Novo projeto` |
| Button | `Novo card` |
| Button | `Mover` |
| Button | `Subir` |
| Button | `Descer` |
| Button | `Excluir` |
| Button | `Comentar` |
| Button | `Salvar` |
| Button | `Cancelar` |
| Empty workspaces | `Nenhuma workspace neste tenant.` |
| Empty projects | `Nenhum projeto nesta workspace.` |
| Empty lane | `Nenhum card.` |
| Empty comments | `Nenhum comentário.` |
| Invalid file | `Envie JPEG, PNG ou PDF de até 5 MB.` |
| Confirm delete workspace | `Excluir esta workspace e todos os projetos e cards?` |
| Confirm delete project | `Excluir este projeto e todos os cards?` |
| Confirm delete card | `Excluir este card?` |

## API and integrations

If this feature adds or changes an HTTP endpoint, record the method, path,
payload, response, errors, and authentication. Approved delivery must update
Swagger, `openapi.yaml`, and `docs/api.md` in the same change.

The human did not name HTTP paths. The table below is the **intended REST
contract** under `/api/v1`, consistent with `users`, `tenants`, and
`powerbi`. Do not add extra endpoints (webhooks, search, analytics). JSON
property names are English.

Existing cookies, JWT session `tenantId`, and `GET /api/v1/tenants` are
reused. After Global switches tenant, project endpoints use the session
`tenantId` (no extra query tenant filter). ABAC: `Administrador` all-tenant
and may set the working session tenant; `AdministradorTenant` and `Usuario`
are limited to `users.tenant_id`.

Portuguese UI maps to English stored values:

| UI | API / stored value |
| -- | ------------------ |
| `Administrador Global` | `Administrador` |
| `Administrador Tenant` | `AdministradorTenant` |
| `User` | `Usuario` |
| `Backlog` | `backlog` |
| `Pronto` | `ready` |
| `Trabalhando` | `working` |
| `Revisão` | `review` |
| `Deploy` | `deploy` |
| `Finalizado` | `done` |
| `Baixa` | `low` |
| `Média` | `medium` |
| `Alta` | `high` |
| `Painel` | `painel` |
| `Cadastrar usuário` | `createUser` |
| `Editar usuário` | `editUser` |
| `Projetos` | `viewProjects` |
| `Gerenciar projetos` | `manageProjects` |
| `Mover cards` | `moveCards` |

Mapped `enabledActions` after this feature: `painel`, `createUser`,
`editUser`, `viewProjects`, `manageProjects`, `moveCards`. Unknown values
remain `400`. Empty array remains allowed.

### Planned endpoints

| Method | Path | Auth (backend) | Request | Success | Errors |
| ------ | ---- | -------------- | ------- | ------- | ------ |
| PATCH | `/api/v1/auth/session` | Access cookie. `Administrador` only | `{ tenantId }` UUID of an existing tenant | Updated session JSON (new `tenantId`, rotated access cookie as required) | `400`, `401`, `403` |
| GET | `/api/v1/tenants` | `Administrador` (every tenant); `AdministradorTenant` (own tenant only); `Usuario` with `createUser` (existing) | None | `{ id, name, slug }[]`. Tenant Admin never receives another tenant and still cannot switch session tenant. | `401`, `403` |
| GET | `/api/v1/users` | `Administrador`: all users. `AdministradorTenant`: users of the account tenant. `Usuario` with `viewProjects`: users of the account tenant who are valid assignees (Projetos access). | None | User picker DTOs (no password/hash/paths). Assignee pickers on the client keep only users with Projetos access. | `401`, `403` |
| POST | `/api/v1/users` | `Administrador`; `AdministradorTenant` (own tenant only); `Usuario` with `createUser` | Existing multipart plus extended `enabledActions`. Optional `profile` `AdministradorTenant` **Administrador only**; omit → `Usuario`. Tenant Admin body `tenantId` must be their tenant (`400` otherwise). | `204` | `400`, `401`, `403`, `429` |
| PATCH | `/api/v1/users/{id}` | Registration: `Administrador`; `AdministradorTenant` for users of their tenant except `profile` `Administrador` targets (`403`); self as today. `enabledActions`: `Administrador`, or `AdministradorTenant` for non-`Administrador` users of their tenant. `profile` (`Usuario` / `AdministradorTenant` only): `Administrador` only. | Existing fields; optional `profile` `Usuario` or `AdministradorTenant` | `204` | `400`, `401`, `403`, `404` |
| GET | `/api/v1/project-workspaces` | `viewProjects` (or implying profile), session tenant | None | `{ id, tenantId, name }[]` | `401`, `403` |
| POST | `/api/v1/project-workspaces` | `Administrador` or `AdministradorTenant`. Usuario `403` even with `manageProjects`. | `{ name }` (1–120 chars, session tenant) | Created workspace DTO | `400`, `401`, `403` |
| PATCH | `/api/v1/project-workspaces/{id}` | Same as create; tenant scope | `{ name }` | Updated DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/project-workspaces/{id}` | Same as create; tenant scope | None | `204` | `401`, `403`, `404` |
| GET | `/api/v1/project-workspaces/{workspaceId}/projects` | `viewProjects` (or implying profile), tenant scope | None | `{ id, workspaceId, name }[]` | `401`, `403`, `404` |
| POST | `/api/v1/project-workspaces/{workspaceId}/projects` | Workspace/project managers only | `{ name }` (1–120 chars) | Created project DTO | `400`, `401`, `403`, `404` |
| GET | `/api/v1/projects/{id}` | `viewProjects` (or implying profile), tenant scope | None | Project plus board: lanes and cards in persisted order, comments, attachment metadata | `401`, `403`, `404` |
| PATCH | `/api/v1/projects/{id}` | Workspace/project managers only | `{ name }` | Updated DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/projects/{id}` | Workspace/project managers only | None | `204` | `401`, `403`, `404` |
| POST | `/api/v1/projects/{id}/cards` | Card access (`viewProjects` or implying profile) | `title`, `description`, `assigneeUserId` required; optional `dueAt`, `priority`, `tags`; creator and number assigned by server | Created card DTO | `400`, `401`, `403`, `404` |
| PATCH | `/api/v1/cards/{id}` | Card access | Same writable fields; not lane/order (use move/reorder) | Updated card DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/cards/{id}` | Card access | None | `204` | `401`, `403`, `404` |
| POST | `/api/v1/cards/{id}/move` | `moveCards` (or implying profile) | `{ lane }` one of the other five keys | Updated card DTO | `400`, `401`, `403`, `404` |
| POST | `/api/v1/cards/{id}/reorder` | `moveCards` (or implying profile) | `{ direction: up \| down }` | Updated order | `400`, `401`, `403`, `404` |
| POST | `/api/v1/cards/{id}/comments` | Card access | `{ body }` 1–4000 chars; reject when the card already has 500 comments | Created comment DTO with author | `400`, `401`, `403`, `404` |
| PATCH | `/api/v1/cards/{id}/comments/{commentId}` | Card access on that card | `{ body }` 1–4000 chars | Updated comment DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/cards/{id}/comments/{commentId}` | Card access on that card | None | `204` | `401`, `403`, `404` |
| POST | `/api/v1/cards/{id}/attachments` | Card access | `multipart/form-data` JPEG/PNG/PDF, max 5 MB; reject when the card already has 10 attachments | Attachment DTO (pointer + API URL, no filesystem path) | `400`, `401`, `403`, `404` |
| GET | `/api/v1/cards/{id}/attachments/{attachmentId}` | Same card-access cookie as VETOR-009 photo bytes | None | File bytes | `401`, `403`, `404` |

Identifiers: UUID primary keys, consistent with tenants and users.

Workspace and project `name` use 1–120 characters, matching card title
rather than the 160-character person-name DTOs, because they are board
labels.

Errors shown in the UI use the recorded copy. HTTP mapping:

- `401` unauthenticated
- `403` → `Você não tem permissão para esta ação.`
- `404` → `Este registro não existe.`
- `400` invalid input, including wrong attachment type/size →
  `Envie JPEG, PNG ou PDF de até 5 MB.` when the file is the problem;
  otherwise `Não foi possível concluir a operação.`
- Other failures → `Não foi possível concluir a operação.`

Success → `Operação realizada com sucesso.`

Passwords, hashes, reset tokens, and tenant filesystem paths must not appear
in tokens, session JSON, or card DTOs. Photo-style API URLs are allowed.

Session / login payload continues to include `profile`, `tenantId`, and
`enabledActions`. `profile` may be `AdministradorTenant`. `enabledActions`
may include the three new values. After a Global tenant switch, `tenantId`
is the working tenant.

Do not proxy these resources through `ms-powerbi-embedded`.

## Data impact

PostgreSQL + TypeORM. The frontend never accesses the database. Approved
delivery updates `docs/database.md`.

### Hierarchy

```text
tenants (existing)
  └── 1..n project_workspaces   (new; not powerbi workspace ids)
        └── 1..n projects       (new; each has exactly one Kanban)
              └── 1..n cards    (new; each card belongs to one lane)
                    ├── 0..500 card_comments
                    └── 0..10 card_attachments
```

Kanban is 1:1 with project. A separate `boards` table is not required;
the board is the project plus its cards.

### Intended tables

| Entity | Purpose | Main fields |
| ------ | ------- | ----------- |
| `project_workspaces` | Tenant project workspace | `id` UUID, `tenant_id` FK tenants, `name` varchar(120), optional `metadata` jsonb, timestamps |
| `projects` | Project under a workspace | `id` UUID, `workspace_id` FK, `name` varchar(120), `next_card_number` integer not null default 1, optional `metadata` jsonb, timestamps |
| `cards` | Kanban card | `id` UUID, `project_id` FK, `number` integer unique per project, `title` varchar(120) not null, `description` text not null, `created_by_user_id` FK users not null, `assignee_user_id` FK users not null, `due_at` timestamptz null, `priority` `low`/`medium`/`high`, `lane` `backlog`/`ready`/`working`/`review`/`deploy`/`done`, `position` integer (order in lane), `tags` jsonb string array (max 20), optional `metadata` jsonb, timestamps |
| `card_comments` | Comment on a card | `id` UUID, `card_id` FK, `author_user_id` FK users not null, `body` varchar(4000) not null, optional `metadata` jsonb, timestamps |
| `card_attachments` | File pointer | `id` UUID, `card_id` FK, `filename` pointer, `content_type`, `byte_size`, `original_name` (original upload name for download, not a filesystem path), timestamps. Bytes on tenant filesystem, not in PostgreSQL |

`users.profile` allowed values become `Administrador`,
`AdministradorTenant`, `Usuario`. `users.enabled_actions` mapped set adds
`viewProjects`, `manageProjects`, `moveCards`.

User FKs on cards and comments use `ON DELETE RESTRICT`. This specification
does not delete users; assignee is required so the FK cannot be null.

Parent/owned FKs: `project_workspaces` → `projects` → `cards` →
`card_comments` / `card_attachments` use `ON DELETE CASCADE`.

### Sequence

Each project stores `next_card_number` (starts at 1). Creating a card
assigns that number and increments. Deleted numbers are not reused.

### Delete

Hard delete (rows removed). No `deleted_at`. CASCADE from workspace to
projects to cards to comments and attachments. Remove attachment files from
the tenant folder with the row.

### Tenant files

Reuse `infrastructure/repository/files/{tenantId}` from VETOR-009. Do not
return folder paths to the browser. Attachment bytes are authorized through
`GET /api/v1/cards/{id}/attachments/{attachmentId}`.

### Optional / extensible (no UI in this version)

Do not promote these to required fields or screens without a human decision.

| Location | Field | Notes |
| -------- | ----- | ----- |
| `cards` | `metadata` jsonb | Opaque extension for future agents |
| `card_comments` | `metadata` jsonb | Opaque extension for future agents |
| `projects` | `metadata` jsonb | Opaque extension for future agents |
| `project_workspaces` | `metadata` jsonb | Opaque extension for future agents |

### Recorded limits

| Field | Limit |
| ----- | ----- |
| Workspace `name` | 1–120 characters (aligned with card title, not the 160-character person-name DTOs) |
| Project `name` | 1–120 characters |
| Card `title` | 1–120 characters, required |
| Card `description` | 1–10000 characters, required |
| Tags per card | maximum 20; each 1–40 characters after trim |
| Attachments per card | maximum 10; 5 MB each; JPEG, PNG, or PDF |
| Comment `body` | 1–4000 characters |
| Comments per card | maximum 500 |
| Due date | optional; `America/Sao_Paulo` for display and due-date interpretation |

## Security

Existing project security rules apply.

- Every listed operation requires an authenticated portal session (`401`
  otherwise).
- Authorization is backend-enforced (`403` when the profile, tenant, or
  `enabledActions` do not allow the operation). Frontend hiding is UX only.
- Default deny. Do not trust `profile`, `enabledActions`, `tenantId`, or
  ids from the client body as authority.
- Administrador Global: all-tenant ABAC. The Projetos picker writes session
  `tenantId`. Resource checks for non-Global still use `users.tenant_id`.
  Global project queries after a switch use the working session tenant.
- Administrador Tenant: own tenant only, including Cadastro Usuário,
  Configurar Perfil (`enabledActions` only), and cards. Cannot write
  `profile`. Cannot PATCH an `Administrador` user. Cannot call Power BI
  admin routes (`403`, unchanged VETOR-011).
- Usuario: own tenant only. Workspace/project writes always `403`.
- `manageProjects` on Usuario does not grant workspace/project CRUD.
- `viewProjects` on Usuario grants card operations except move/reorder.
- `moveCards` is required to move or reorder. Administrador and
  AdministradorTenant have it by profile.
- Anyone with card access on that tenant may edit or delete any comment on
  that card (no author-only rule).
- Administrador Global has every mapped action even when `enabledActions`
  is empty.
- Administrador Tenant has `painel`, `createUser`, `editUser`,
  `viewProjects`, `manageProjects`, and `moveCards` by profile even when
  `enabledActions` is empty.
- Only Administrador Global assigns or demotes `AdministradorTenant`.
- Validate uploads: MIME type, size (5 MB), count (10), and reject other
  types. Never execute uploaded files. Never store bytes in PostgreSQL.
- Serve attachments only after the same tenant and card-access checks, in
  the VETOR-009 photo GET style.
- DTOs omit secrets, hashes, tokens, and filesystem paths.
- IDOR: every `{id}` must be authorized against the actor's tenant (or
  Global working session tenant) and parent project/workspace.
- Comments are a client ↔ team channel on the card, not a separate product
  chat. Do not expose comments of another tenant.
- Assignee must be a user of the card tenant with Projetos access.
  Cross-tenant assignee is `400`.

## Testing

Planned coverage until approved delivery records evidence:

- AC-001: shell contains `Projetos` linking to `/portal/projetos` with
  inline SVG; hidden without `viewProjects`; API still `401`/`403`
- AC-002: multiple workspaces per tenant and projects per workspace;
  workspace and project write accept only `name`
- AC-003: activating the project name navigates to `/portal/projetos/{id}`
- AC-004: six lanes in the recorded order and labels
- AC-005: card persists required title/description/assignee, optional due
  date, sequence number, comments, attachments, and limits
- AC-006: `Mover` offers the other five lanes; `Subir` / `Descer` persist
  order; no drag-and-drop; without `moveCards` those actions are `403`
- AC-007: Global tenant picker changes session `tenantId`; Relatórios
  follow; Tenant Admin and Usuario cannot switch tenant
- AC-008: Usuario workspace/project write is `403`; Global and Tenant Admin
  succeed in scope
- AC-009: hard deletes cascade including files; no archive
- AC-010: comment stores author; create, edit, and delete succeed for card
  access
- AC-011: JPEG/PNG/PDF ≤ 5 MB accepted; other type, larger file, or 11th
  attachment rejected; GET download requires the same auth as photo
- AC-012: three new `enabledActions` plus Tenant Admin implied mapped
  actions on own tenant; Global has every mapped action
- AC-013: only Global sets or demotes `AdministradorTenant`; others `403`;
  `Administrador` is not assigned here
- AC-014: Usuario with `viewProjects` without `moveCards` can create/edit/
  comment/attach/delete and cannot move/reorder
- AC-015: three profiles; bootstrap remains `Administrador`; Tenant Admin
  tenant-scoped Cadastro / Perfil / Projetos; Power BI admin stays Global
- AC-016: unauthenticated `401`; unauthorized `403`
- AC-017: sequence is per project; next number consumed on create; deleted
  numbers are not reused

Workspace commands after approved delivery: frontend and backend
`typecheck`, `lint`, `test`, and `build` for touched workspaces; backend
`test:e2e` when HTTP is crossed; `npm run sdd:validate`.

## Delivery

This specification is `implemented`. A named human approved it via `/goal`
on 2026-09-21. Delivery promoted the durable decisions into
`docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
Swagger, and `docs/database.md`.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-20-portal-kanban-projetos`
- Request: Trello-style board on the authenticated portal for the tenant
  client to move cards and interact with the VETOR development team;
  hierarchy tenant → project workspaces → projects → one Kanban; profiles
  Administrador / AdministradorTenant / Usuario; copy and AC-001–AC-017 as
  recorded.
- Follow-up 2026-09-21: human answers closed the open items listed in
  Context. `moveCards` is required to move/reorder. Projetos is hidden
  without `viewProjects`. Global tenant picker updates session `tenantId`.
  Project is name-only. Assignee/title/description required; due date
  optional in `America/Sao_Paulo`. Comments create/edit/delete by card
  access. Limits recorded. Hard CASCADE delete. Photo-style attachment GET.
  Board route `/portal/projetos/{id}`. AdministradorTenant is full
  tenant-scoped admin except Global-only surfaces and Tenant Admin profile
  assignment. Global may demote Tenant Admin. Checkbox labels recorded.
  Card numbers are not reused.
- Conflicts with: VETOR-010 Cadastro / Perfil as `Administrador` only —
  this specification extends those operations to `AdministradorTenant` on
  their tenant. VETOR-008 Administrador dashboard tenant `vetor` — Global
  session `tenantId` may leave `vetor` after the Projetos picker until
  logout. VETOR-011 viewing stays session-tenant (Relatórios follow the
  switch); catalog/admin stay `Administrador`.
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, `docs/conventions.md`,
  `tasks/specs/vetor-008-portal-layout-dashboard.md`,
  `tasks/specs/vetor-009-user-photo-upload-sidebar-logo.md`,
  `tasks/specs/vetor-010-perfil-modal-user-permissions.md`,
  `tasks/specs/vetor-011-portal-powerbi-embedded.md` (not reopened)

## Implementation evidence

- Changed: `backend/src/modules/projects/` (entities, DTOs, guards,
  controllers, `ProjectsService`, unit tests),
  `backend/src/database/migrations/1760000004000-add-project-kanban.ts`,
  `backend/src/app.module.ts`, `backend/src/common/swagger/examples.ts`,
  portal session switch (`auth.controller.ts`, `auth.service.ts`,
  `update-session-tenant.dto.ts`), profile/actions (`enabled-actions.ts`,
  user DTOs, `users.service.ts`, `tenants.service.ts`,
  `UsersListGuard`, `SelfOrAdministradorGuard`,
  `AdministradorOrCreateUserGuard`, `tenant-storage.service.ts`),
  `backend/test/projects.e2e-spec.ts`, `backend/test/users-tenants.e2e-spec.ts`,
  `backend/test/swagger.e2e-spec.ts`, `backend/test/openapi-contract.spec.ts`,
  `frontend/app/portal/projetos/page.tsx`,
  `frontend/app/portal/projetos/[id]/page.tsx`,
  `frontend/components/projects/projects-home.tsx`,
  `frontend/components/projects/project-board.tsx`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/forms/portal-register-form.tsx`,
  `frontend/components/forms/portal-configure-profile-form.tsx`,
  `frontend/components/forms/portal-edit-user-form.tsx`,
  `frontend/lib/api/client.ts`, `frontend/lib/portal-actions.ts`,
  `frontend/lib/project-kanban.ts`, `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, and `openapi.yaml`.
- Tests: `backend/src/modules/projects/projects.service.spec.ts`,
  `view-projects.guard.spec.ts`, `workspace-manager.guard.spec.ts`,
  `move-cards.guard.spec.ts`, `enabled-actions.spec.ts`,
  `users.service.spec.ts`, `tenants.service.spec.ts`,
  `auth.service.spec.ts`, `users-list.guard.spec.ts`,
  `self-or-administrador.guard.spec.ts`,
  `administrador-or-create-user.guard.spec.ts`,
  `administrador.guard.spec.ts`,
  `tenant-storage.service.spec.ts`, `backend/test/projects.e2e-spec.ts`,
  `backend/test/session-tenant.e2e-spec.ts`,
  `backend/test/powerbi.e2e-spec.ts`,
  `backend/test/users-tenants.e2e-spec.ts`,
  `backend/test/swagger.e2e-spec.ts`,
  `backend/test/openapi-contract.spec.ts`,
  `frontend/components/projects/projects-home.spec.tsx`,
  `frontend/components/projects/project-board.spec.tsx`,
  `frontend/lib/portal-actions.spec.ts`,
  `frontend/app/portal/page.spec.tsx`,
  `frontend/components/forms/portal-configure-profile-form.spec.tsx`,
  `frontend/components/forms/portal-edit-user-form.spec.tsx`.
- Commands: `npm run typecheck` passed;
  `npm run lint` passed;
  `npm run test` passed (backend 124, frontend 99, SDD 10);
  `npm run test:e2e` passed (backend 41);
  `npm run sdd:validate` passed (12 specifications);
  `npm run build` passed (`/portal/projetos`, `/portal/projetos/[id]`).
- Limitations: Human validation of AC-001–AC-017 has not started. Power BI
  catalog/admin was not changed. `npm run docker:config` was not run.

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
