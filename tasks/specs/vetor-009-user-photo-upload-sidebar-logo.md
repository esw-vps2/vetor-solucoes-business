---
id: VETOR-009
title: User photo upload and sidebar logo-only chrome
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-20-user-photo-upload-sidebar-logo
created_at: 2026-09-20
updated_at: 2026-09-20
---

# User photo upload and sidebar logo-only chrome

## Context

VETOR-008 is `implemented`. Authenticated `/portal` chrome currently shows
the person's photo and first-plus-last name at the top of the navy sidebar,
then the VETOR logo. User registration collects `URL da imagem` (`photoUrl`).
The image bytes are not stored by the backend. `users.photo_url` holds a URL
string. Photo file upload is out of scope in VETOR-008. There is no user
edit form. The sidebar control label is `Cadastrar Usuário` and is shown
only to `Administrador`. The create form is inline on `/portal`.

The requester selected two live `/portal` sidebar nodes:

1. The VETOR logo image in the sidebar, and asked to adjust so a photo can
   be uploaded, linked to the user registration, and saved on the filesystem,
   not in the database.
2. The sidebar block that currently shows the authenticated person's photo
   and `Admin Vetor`, and asked to leave only the Vector logo as in
   `Vector Software Engineers`.

Follow-up decisions:

- The sidebar lockup is composed in the layout, not as a new image file
  that bakes the caption: the VETOR symbol (`/brand/symbol-vetor.png`) in a
  centered white tile and, below it, HTML text `Vector Software Engineer`.
  Delivery must not bake the caption into a new PNG.
- This lockup replaces the photo-and-name block and is the sidebar brand
  chrome. Do not stack the wordmark logo under it.
- First name, last name, and photo sit in the main header on the right.
  Tenant `name` sits under the person's name in that header.
- The registration photo is optional. The Portuguese file label is `Foto`.
- Allowed type is JPEG (`image/jpeg`, `.jpg` / `.jpeg`). Maximum size is
  5 MB.
- PostgreSQL may store a filename or relative path pointer. It must not
  store image bytes.
- Rename the sidebar control from `Cadastrar Usuário` to `Cadastro Usuário`.
  It is a navigation item. Selecting it shows a main-area section titled
  `Cadastro Usuário` with create and edit action buttons that open modals.
  Icons are custom inline SVG matching the action. No icon library.
- A non-`Administrador` also sees `Cadastro Usuário`, but the section
  shows only the edit action, which opens their own registration.
- `Administrador` sees both actions. The edit modal includes a user
  selection list and a search field. After three typed characters, the
  selection list filters.
- Edit uses first name, last name, age, sex, email, and photo.
  `Administrador` and the user themselves may edit.
- HTTP: `POST /api/v1/users` and `PATCH /api/v1/users/{id}` as multipart.
  `GET /api/v1/users` lists users for `Administrador`. The edit-modal filter
  runs in the client after three typed characters and matches `email`.
- Bootstrap `Administrador` photo stays `/brand/symbol-vetor.png`.
- The login session keeps a photo field whose value is an API-served URL
  for an uploaded file, or the static brand URL for the bootstrap
  administrator until that user uploads a JPEG.
- Add a sidebar pill above `Sair` that toggles portal light and dark mode.
  The label is the destination mode: `Modo escuro` in light mode and
  `Modo claro` in dark mode. Persist the choice in `localStorage`. Do not
  add Tutorial or font-size controls. The public leadpage stays unchanged.

This request changes approved VETOR-008 behavior: AC-010, AC-014, photo
upload out of scope, and the inline create form on `/portal`.

## Desired outcome

An `Administrador` creates a user from a modal, with an optional JPEG photo
stored on the tenant filesystem and a pointer in PostgreSQL. `Cadastro
Usuário` in the sidebar opens a main-area section with create and edit
buttons. A non-administrator only edits their own record. The sidebar top
chrome shows a centered VETOR symbol with `Vector Software Engineer` as
text below the image. The main header shows first name, last name, photo,
and tenant name. A sidebar pill above `Sair` switches the portal between
light and dark mode.

## In scope

- Replace `URL da imagem` with an optional `Foto` JPEG upload, maximum 5 MB.
- Save uploaded photos under `infrastructure/repository/files/{tenantId}`.
- Persist only a filename or relative path pointer in PostgreSQL.
- Rename `Cadastrar Usuário` to `Cadastro Usuário`. Selecting that sidebar
  item shows a main-area section with create and edit action buttons. Each
  opens a modal. Custom inline SVG icons. No icon library.
- Show `Cadastro Usuário` to every authenticated profile. Non-administrators
  see only the edit action, bound to their own user.
- Let `Administrador` pick a user from a list plus search in the edit modal.
  Filtering starts after three typed characters and matches `email`.
- `POST /api/v1/users` and `PATCH /api/v1/users/{id}` as multipart.
- `GET /api/v1/users` for `Administrador`, with client-side email filter
  after three typed characters.
- Replace the sidebar photo-and-name block with a centered VETOR symbol
  (`/brand/symbol-vetor.png`) and the caption `Vector Software Engineer`
  below the image, as HTML text, not inside the PNG. Do not stack the
  wordmark logo under that lockup.
- Show first name, last name, and photo in the `/portal` header, with tenant
  `name` under the person's name.
- Keep a photo field on the login session, using an API-served URL for
  uploaded files.
- Keep bootstrap `Administrador` photo as `/brand/symbol-vetor.png`.
- Add a sidebar pill above `Sair` that toggles portal light and dark mode
  (`Modo escuro` / `Modo claro`), persisted in `localStorage`.
- Update `docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
  Swagger, and `docs/database.md` during approved delivery when those
  contracts change.

## Out of scope

- Storing image bytes in PostgreSQL
- Public unauthenticated photo hosting
- Changing `Painel`, tenant `name`/`slug`, or `Sair`
- Tutorial, font-size, or other accessibility plugins in the sidebar
- A second font family or an icon library
- An offline PWA shell
- A new image file that bakes `Vector Software Engineer` into the logo
- Password, tenant, or profile changes on this edit, unless a later
  decision adds them

## Acceptance criteria

- AC-001: The create modal has an optional `Foto` file control instead of
  `URL da imagem`. Create succeeds without a photo. A selected file must be
  JPEG and at most 5 MB.
- AC-002: When a photo is supplied on create or edit, the backend stores
  the file on the tenant filesystem and stores only a pointer in
  PostgreSQL. Image bytes are not stored in the database.
- AC-003: The authenticated `/portal` sidebar top chrome that currently
  shows the person's photo and first-plus-last name shows a centered
  `/brand/symbol-vetor.png` with the text `Vector Software Engineer` below
  the image, outside the PNG. That block does not show the person's photo,
  name, or tenant identity. The wordmark logo is not stacked under the
  lockup.
- AC-004: The `/portal` header shows the authenticated person's first name,
  last name, and photo on the right, with the tenant `name` under the
  person's name.
- AC-005: Unauthenticated callers cannot create or edit a user or write
  another tenant's files. A non-`Administrador` cannot edit another user's
  registration.
- AC-006: `Administrador` and the user themselves can edit first name, last
  name, age, sex, email, and photo. Edit can add a photo when none exists
  or replace an existing photo.
- AC-007: The sidebar control is labeled `Cadastro Usuário`. Selecting it
  shows a main-area section titled `Cadastro Usuário` with a create action
  and an edit action. Each opens a modal. A non-administrator sees only the
  edit action.
- AC-008: The `Administrador` edit modal presents a selectable user list
  loaded from `GET /api/v1/users` and a search field. After three typed
  characters, the list filters by `email` in the client.
- AC-009: Create uses `POST /api/v1/users` multipart. Edit uses
  `PATCH /api/v1/users/{id}` multipart.
- AC-010: The sidebar shows a pill above `Sair`. In light mode it is labeled
  `Modo escuro`. In dark mode it is labeled `Modo claro`. Activating it
  switches the authenticated portal between light and dark surfaces and
  persists the choice. The public leadpage is unchanged.

## User experience

1. An authenticated user on `/portal` sees `Cadastro Usuário` in the
   sidebar.
2. Selecting `Cadastro Usuário` shows that section in the main area.
   `Administrador` sees create and edit action buttons. Other profiles see
   only edit.
3. Create opens a modal with the registration fields and optional `Foto`.
4. Edit opens a modal. For `Administrador`, a user list and search appear.
   Typing three or more characters filters the selection by `email`.
   Choosing a user loads first name, last name, age, sex, email, and photo.
   For other profiles, the modal loads their own record.
5. After a valid create or edit, files stay on the tenant filesystem and
   PostgreSQL holds only a pointer when a JPEG was stored.
6. Sidebar top chrome is a centered VETOR symbol with
   `Vector Software Engineer` as text below the image.
7. The main header shows first name, last name, and photo on the right, with
   tenant `name` under the person's name. The Painel main area keeps the
   welcome copy.
8. A pill above `Sair` switches the portal to dark or light mode. The label
   names the destination mode. The choice is remembered on the next visit.

## API and integrations

| Method | Path                 | Auth                                   | Request                                                            | Success         | Errors                     |
| ------ | -------------------- | -------------------------------------- | ------------------------------------------------------------------ | --------------- | -------------------------- |
| GET    | `/api/v1/users`      | Access cookie. `Administrador` only    | None                                                               | `200` user list | `401`, `403`               |
| POST   | `/api/v1/users`      | Access cookie. `Administrador` only    | Multipart: existing create fields plus `Foto`                      | `204`           | `400`, `401`, `403`, `429` |
| PATCH  | `/api/v1/users/{id}` | Access cookie. `Administrador` or self | Multipart: first name, last name, age, sex, email, optional `Foto` | `204`           | `400`, `401`, `403`, `404` |

`GET /api/v1/users` returns every user the `Administrador` may pick, with
`id`, first name, last name, `email`, `tenantId`, tenant `name`, and tenant
`slug`. The three-character email filter is applied in the client.

`photoUrl` is no longer a create body field. JSON property names stay
English. The Portuguese file label is `Foto`. JPEG only, maximum 5 MB.

The login session keeps a photo field. Uploaded photos use an API-served
URL, not a filesystem path. Bootstrap `Administrador` may keep
`/brand/symbol-vetor.png` until that user uploads a JPEG.

A user list for the `Administrador` picker is `GET /api/v1/users`. The
three-character filter is client-side on `email`.

Approved delivery must update `docs/api.md`, `openapi.yaml`, and Swagger.

Passwords, password hashes, refresh tokens, reset tokens, and tenant
filesystem paths must not appear in the login token or session JSON.

## Data impact

PostgreSQL stores a filename or relative path pointer for an uploaded
photo. Image bytes are not stored in PostgreSQL. Files live under
`infrastructure/repository/files/{tenantId}`.

Bootstrap `Administrador` photo remains `/brand/symbol-vetor.png`.

Approved delivery must update `docs/database.md`.

## Security

Existing project security rules apply.

- Create remains `Administrador` only.
- Edit is allowed for `Administrador` and for the authenticated user acting
  on their own record. Default deny otherwise.
- JPEG only, maximum 5 MB. Reject other types and oversized files with
  `400`.
- Uploaded files stay under the tenant folder. A tenant must not read or
  write another tenant's folder.
- Folder paths are not returned to the browser as raw filesystem paths.
  The session photo field is an API-served URL, not a filesystem path.
- The frontend must never access the filesystem or the database directly.
- Hiding the create button is UX only. Authorization is enforced on the
  backend.
- Do not log file contents or secrets.

## Testing

- AC-001: create modal has optional `Foto`; create without a photo
  succeeds; non-JPEG and files over 5 MB are rejected
- AC-002: create or edit with a photo persists the file on the tenant
  filesystem and persists only a pointer in PostgreSQL
- AC-003: `/portal` sidebar top chrome shows a centered
  `/brand/symbol-vetor.png` with `Vector Software Engineer` as text below
  the image, not inside the PNG, and does not show the person's photo, name,
  tenant identity, or the wordmark logo in that block
- AC-004: `/portal` header shows first name, last name, and photo on the
  right, with tenant `name` under the person's name
- AC-005: unauthenticated create or edit is rejected; a non-administrator
  cannot edit another user; files are not written outside the tenant folder
- AC-006: `Administrador` and the user themselves can edit the recorded
  fields and can add or replace the photo
- AC-007: sidebar label is `Cadastro Usuário`; selecting it shows a
  main-area section with create and edit actions that open modals;
  non-administrators see only edit
- AC-008: `Administrador` edit modal loads `GET /api/v1/users`, shows a
  selectable list and search, and filters by `email` after three typed
  characters
- AC-009: create is `POST /api/v1/users` multipart; edit is
  `PATCH /api/v1/users/{id}` multipart
- AC-010: sidebar pill above `Sair` is `Modo escuro` in light mode and
  `Modo claro` in dark mode; toggling switches portal surfaces and
  persists; the public leadpage is unchanged

## Delivery

Delivery is complete for the approved scope. Human validation has not started.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-20-user-photo-upload-sidebar-logo`
- Request: upload a user photo at registration, save it on the filesystem
  not in the database, and show only the Vector logo in the sidebar block
  that currently shows photo and `Admin Vetor`, as in
  `Vector Software Engineers`
- Follow-up: lockup is existing `/brand/symbol-vetor.png` in a centered
  white tile plus HTML text `Vector Software Engineer` below the image, not
  a new PNG; name, last name, and photo in the header with tenant `name`;
  photo optional; label `Foto`; JPEG up
  to 5 MB; pointer in PostgreSQL; `Cadastro Usuário` sidebar item opens a
  main-area section with create and edit action buttons opening modals;
  non-administrator sees only self-edit;
  `Administrador` picker is list plus search, filter after three characters
  on `email`; `GET /api/v1/users` for the picker; `POST /api/v1/users` and
  `PATCH /api/v1/users/{id}` multipart; bootstrap photo stays
  `/brand/symbol-vetor.png`; session keeps an API-served photo field;
  sidebar pill above `Sair` toggles portal light and dark mode
  (`Modo escuro` / `Modo claro`), persisted in `localStorage`; no Tutorial
  or font-size controls
- Conflicts with: VETOR-008 AC-010, AC-014, photo-upload out of scope,
  inline create form, `docs/design.md` portal chrome, `docs/api.md`
  `photoUrl`
- Existing contracts consulted: `tasks/specs/vetor-008-portal-layout-dashboard.md`,
  `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`,
  `docs/architecture.md`

## Implementation evidence

- Changed: `backend/src/modules/portal/users.controller.ts`,
  `backend/src/modules/portal/users.service.ts`,
  `backend/src/modules/portal/auth.service.ts`,
  `backend/src/modules/portal/tenant-storage.service.ts`,
  `backend/src/modules/portal/photo-url.ts`,
  `backend/src/modules/portal/photo-upload.ts`,
  `backend/src/modules/portal/multer-exception.filter.ts`,
  `backend/src/modules/portal/dto/create-user.dto.ts`,
  `backend/src/modules/portal/dto/update-user.dto.ts`,
  `backend/src/modules/portal/dto/user-list-item.dto.ts`,
  `backend/src/modules/portal/guards/self-or-administrador.guard.ts`,
  `backend/src/modules/portal/portal.module.ts`,
  `backend/src/common/swagger/examples.ts`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/forms/portal-register-form.tsx`,
  `frontend/components/forms/portal-edit-user-form.tsx`,
  `frontend/lib/api/client.ts`, `frontend/next.config.ts`,
  `frontend/app/portal/page.tsx`, `frontend/lib/portal-theme.ts`,
  `frontend/app/globals.css`, `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, `docs/architecture.md`, and
  `openapi.yaml`.
- Tests: `backend/src/modules/portal/users.service.spec.ts`,
  `backend/src/modules/portal/photo-url.spec.ts`,
  `backend/src/modules/portal/tenant-storage.service.spec.ts`,
  `backend/src/modules/portal/guards/self-or-administrador.guard.spec.ts`,
  `backend/src/modules/portal/auth.service.spec.ts`,
  `backend/test/users-tenants.e2e-spec.ts`,
  `frontend/app/portal/page.spec.tsx`,
  `frontend/components/forms/portal-register-form.spec.tsx`,
  `frontend/components/forms/portal-edit-user-form.spec.tsx`,
  `frontend/lib/portal-theme.spec.ts`.
- Commands: `npm run typecheck` passed; `npm run lint` passed;
  `npm run test --workspace backend` passed (59); `npm run test --workspace
frontend` passed (60); `npm run test:e2e --workspace backend` passed (18);
  `npm run build` passed (`/`, `/portal`, `/portal/change-password`,
  `/manifest.webmanifest`); `npm run format:check` passed;
  `npm run sdd:validate` passed.
- Runtime: authenticated `/portal` shows a centered sidebar lockup
  `/brand/symbol-vetor.png` plus HTML text `Vector Software Engineer`.
  Tenant identity is not in the sidebar. The header shows the section title
  on the left and first name, last name, photo, and tenant `name` on the
  right. `Cadastro Usuário` is a sidebar navigation item. Selecting it
  shows a main-area section with create and edit action cards. Create modal
  uses optional `Foto` (not `URL da imagem`). Edit modal loads
  `GET /api/v1/users` and `Buscar e-mail`. Unauthenticated create and edit
  return `401`. A pill above `Sair` is labeled `Modo escuro` in light mode
  and `Modo claro` in dark mode.
- Limitations: `GET /api/v1/users/{id}` and `GET /api/v1/users/{id}/photo`
  are published so edit can load fields and the session can use an
  API-served photo URL. Image bytes stay on the tenant filesystem; PostgreSQL
  stores `{userId}.jpg` or `/brand/symbol-vetor.png`. Human validation of
  AC-001–AC-010 has not started.

## Validation evidence

- AC-001: Human validation has not started.
- AC-002: Human validation has not started.
- AC-003: Human validation has not started.
- AC-004: Human validation has not started.
- AC-005: Human validation has not started.
- AC-006: Human validation has not started.
- AC-007: Human validation has not started.
- AC-008: Human validation has not started.
- AC-009: Human validation has not started.
- AC-010: Human validation has not started.
