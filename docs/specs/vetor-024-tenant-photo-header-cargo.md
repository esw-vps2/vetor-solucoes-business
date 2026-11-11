---
id: VETOR-024
title: Tenant photo, header tenant name, and sidebar cargo
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-02-tenant-photo-header-cargo
created_at: 2026-10-02
updated_at: 2026-10-02
---

# Tenant photo, header tenant name, and sidebar cargo

## Context

VETOR-013 is `implemented`. `Cadastrar tenant` collects `Nome Empresa`,
`Slug`, and optional `Email`. `POST /api/v1/tenants` is JSON and
`Administrador` only. `tenants` has no photo. VETOR-009 stores an optional
user photo on the tenant filesystem and a pointer in PostgreSQL, and shows
that photo with the person's name in the portal header. VETOR-021 shows the
person's name in the sidebar footer and, under it, the profile, then the
optional `cargo` when present (`Administrador - Product Manager`, or only
`Administrador` when `cargo` is empty).

The requester asked, on the live portal chrome:

1. On tenant registration, add an option to upload a photo that represents
   the tenant.
2. Show that photo in the header circle that today renders the person's
   photo (`img.size-10`, currently `alt` of the person's name and, for the
   bootstrap administrator, `src="/brand/symbol-vetor.png"`).
3. Remove the header line that shows the person's name (`ADMIN VETOR` for
   the bootstrap administrator) and leave only the tenant name.
4. In the sidebar footer, replace the line that shows `Administrador` with
   the person's `cargo`.

Follow-up on 2026-10-02: an existing tenant, including the bootstrap
tenant, can receive a photo later, and a stored photo can be replaced.
Name, slug, email, and status stay unchanged. Removing a photo without a
replacement was not requested.

Original request (Portuguese, preserved):

> No cadastro da tenant, adicione a opção para fazer upload de uma foto que
> representará a tenant, essa foto deve aparecer no círculo do cabeçalho.
> No cabeçalho, remover o nome da pessoa e deixar apenas o nome da tenant.
> No rodapé da barra lateral, onde aparece Administrador, mostrar o cargo.

Follow-up (Portuguese, preserved):

> Permitir a troca da foto tambem

This specification changes the header rule in VETOR-009 (person name and
person photo on the right, tenant name underneath) and the footer subtitle
in VETOR-021 AC-007 and AC-015. It does not replace those specifications.
It adds one photo write for an existing tenant. It does not add a general
tenant edit.

## Desired outcome

An `Administrador` can attach an optional photo while registering a tenant
and can later set or replace the photo of any existing tenant. After a
session is on that tenant, the portal header shows the tenant photo and
only the tenant name. The sidebar footer keeps the person's photo and
name, and the line under the name shows the person's `cargo`.

## In scope

- Optional `Foto` file control on the existing `Cadastrar tenant` modal.
  The control is not required. Create without a file still succeeds.
- A fifth Cadastro action card, `Alterar foto da tenant`, shown only to
  `Administrador`. It opens a modal that lists existing tenants and
  requires a new `Foto`.
- Same photo rules already used for user photos: one file, at most 5 MB,
  content detected as a raster image, SVG rejected. The Portuguese label
  is `Foto`. The multipart field name is `photo`.
- Persist image bytes only under
  `infrastructure/repository/files/{tenantId}`. PostgreSQL stores a
  pointer, not bytes.
- `POST /api/v1/tenants` accepts multipart with the existing `name`,
  `slug`, and optional `email`, plus optional `photo`. Authorization stays
  `Administrador` only.
- `PUT /api/v1/tenants/{id}/photo` replaces the photo of an existing
  tenant. Authorization is `Administrador` only. Name, slug, email, and
  status do not change. A missing file is refused. The previous file is
  removed when the new pointer differs.
- Authenticated read of the stored mark at
  `GET /api/v1/tenants/{id}/photo`.
- Session user gains `tenantPhotoUrl` for the working tenant: the stable
  API path when a pointer exists, otherwise an empty string.
- When the replaced tenant is the working session tenant, the open portal
  reloads the session user so the header circle updates without a new
  login.
- Header circle uses the working tenant's photo. The person's photo stays
  in the sidebar footer.
- Header text is only the working tenant `name`. The person's name is
  removed from the header.
- Sidebar footer secondary line shows `cargo` only.
- Update `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`
  in the approved delivery.

## Out of scope

- A new page or a new top-level sidebar item
- Editing tenant `name`, `slug`, `email`, or `status`
- `DELETE` of a tenant
- Clearing a stored photo without uploading a replacement
- Letting `AdministradorTenant` or `Usuario` set or replace a tenant photo,
  including their own tenant
- Changing who may call `POST /api/v1/tenants`
- Replacing the person's photo, name, or logout control in the sidebar
  footer
- Changing user registration, user edit, or the `cargo` field itself
- Public or unauthenticated image hosting
- Storing image bytes in PostgreSQL
- A migration or bootstrap step that invents a photo for tenants that do
  not have one yet

## Acceptance criteria

- AC-001: `Cadastrar tenant` includes an optional file control labeled
  `Foto`. Submitting without a file still creates the tenant. A selected
  file that is not an accepted raster image, or that is larger than 5 MB,
  does not create the tenant and shows
  `A foto deve ser uma imagem e ter no máximo 5 MB.`
- AC-002: A valid photo on create is stored as a file under the new
  tenant folder. PostgreSQL stores only a pointer on `tenants`. The create
  response stays `{ id, name, slug, email }` and does not include a
  filesystem path or image bytes.
- AC-003: The portal header circle shows the working tenant photo. Its
  accessible name is the tenant name. The person's photo is not rendered
  in that circle. When the working tenant has no photo, the circle shows
  the tenant-name initials on the existing accent fallback, and does not
  fall back to the person's photo or to `/brand/symbol-vetor.png`.
- AC-004: The portal header shows only the working tenant name. The
  person's first and last name are not rendered in the header.
- AC-005: The sidebar footer still shows the person's photo, or the
  existing first-and-last-name initials when the person has no photo, and
  the person's name. The line under the name shows `cargo` and does not
  show the profile label (`Administrador`, `AdministradorTenant`, or
  `Usuario`). When `cargo` is empty, that line is omitted.
- AC-006: Only an authenticated `Administrador` may upload or replace the
  photo. Unauthenticated callers receive `401`. `AdministradorTenant` and
  `Usuario` receive `403`, including when `createTenant` is granted. An
  authenticated caller may read `GET /api/v1/tenants/{id}/photo` only when
  `{id}` is their working session tenant. Any other tenant id returns
  `403`. A tenant with no photo returns `404`. The route is not public.
- AC-007: A refused create, including a duplicate name, email, or slug and
  an invalid photo, does not insert a tenant, does not create a folder,
  and does not leave a file. Existing duplicate and required-field copy
  stays as in VETOR-013.
- AC-008: `tenantPhotoUrl` on the session follows the working tenant,
  including after an `Administrador` switches session tenant. It is either
  `/api/v1/tenants/{tenantId}/photo` or an empty string. It is not a
  filesystem path.
- AC-009: Cadastro shows `Alterar foto da tenant` only to `Administrador`.
  The modal lists existing tenants, including the bootstrap tenant, and
  requires `Foto`. A valid submit calls
  `PUT /api/v1/tenants/{id}/photo`, keeps `name`, `slug`, `email`, and
  `status`, stores the new pointer, and deletes the previous file when the
  pointer changes. An unknown id returns `404`. A missing file returns
  `400` and shows `Preencha todos os campos obrigatórios.` An invalid file
  returns `400`, leaves the previous photo in place, and shows
  `A foto deve ser uma imagem e ter no máximo 5 MB.` Success shows
  `Operação realizada com sucesso.` and closes the modal. Replacing the
  working tenant's photo updates the open header circle.

## User experience

1. `Administrador` opens `Cadastrar tenant`. The fields remain
   `Nome Empresa`, `Slug`, and optional `Email`. Below them, optional
   `Foto` uses the same file-input treatment as user registration.
2. Submit and cancel copy stay as in VETOR-013. Success still closes the
   modal.
3. An invalid photo shows
   `A foto deve ser uma imagem e ter no máximo 5 MB.` and leaves the
   other fields filled.
4. On Cadastro, `Administrador` also sees `Alterar foto da tenant` as
   another action card in the same grid. Other profiles do not see it.
5. That card opens a modal titled `Alterar foto da tenant`. A required
   `Tenant` select lists tenant names from `GET /api/v1/tenants`, ordered
   by name as that endpoint already returns them. A required `Foto`
   control accepts the replacement. The current image is not previewed.
   Submit is `Salvar` and, while the request is in flight, `Salvando...`.
   Cancel is `Cancelar`.
6. Success closes the modal. If the selected tenant is the working
   session tenant, the header circle updates immediately.
7. On every authenticated portal page, the header cluster on the right is
   one line plus a 40px circle. The line is the tenant name, in the
   existing primary header style (`text-sm`, semibold, navy / white in
   dark mode), truncated, not forced to uppercase. The circle is the
   tenant photo with `object-cover` and `rounded-full`. Without a photo,
   the circle is the existing accent fallback with up to two initials:
   the first letter of the first two words of the tenant name, or the
   first two letters when the name is a single word.
8. The sidebar footer is unchanged except the subtitle. The subtitle is
   the `cargo` string, truncated, in the existing secondary style. An
   empty `cargo` removes the subtitle. The profile word is not shown
   there.

### Copy table (pt-BR, exact)

| Surface | Exact copy |
| --- | --- |
| Photo field | `Foto` |
| Invalid photo | `A foto deve ser uma imagem e ter no máximo 5 MB.` |
| Replace action card | `Alterar foto da tenant` |
| Replace modal title | `Alterar foto da tenant` |
| Tenant select | `Tenant` |
| Replace submit | `Salvar` |
| Replace submit while loading | `Salvando...` |
| Replace cancel | `Cancelar` |
| Replace success | `Operação realizada com sucesso.` |
| Missing tenant or file | `Preencha todos os campos obrigatórios.` |

All other `Cadastrar tenant` copy remains the VETOR-013 table. The replace
card uses a custom inline SVG in the existing action-card style. No icon
library.

## API and integrations

`POST /api/v1/tenants` changes from a JSON body to `multipart/form-data`.
Text fields stay `name`, `slug`, and optional `email`. The optional file
field is `photo`. Success remains `201` `{ id, name, slug, email }`.
Errors remain `400`, `401`, `403`, and `409`. An invalid photo is `400`.

`GET /api/v1/tenants` stays `{ id, name, slug }`. It does not gain a photo
field.

| Method | Path | Auth | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/tenants` | Access cookie. `Administrador` only | Multipart: `name`, `slug`, optional `email`, optional `photo` | `201` `{ id, name, slug, email }` | `400`, `401`, `403`, `409` |
| PUT | `/api/v1/tenants/{id}/photo` | Access cookie. `Administrador` only | Multipart: required `photo` | `204` empty body | `400`, `401`, `403`, `404` |
| GET | `/api/v1/tenants/{id}/photo` | Access cookie. Working session tenant must equal `{id}` | None | `200` image bytes, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` | `401`, `403`, `404` |

`PUT` does not accept `name`, `slug`, `email`, or `status`. An unknown
tenant id is `404`. A missing or invalid `photo` is `400` and does not
change the stored pointer or the previous file.

The session user, from the existing session read, adds `tenantPhotoUrl`.
Passwords, hashes, tokens, and filesystem paths stay out of that payload.
`photoUrl` remains the person's photo.

Approved delivery updates `docs/api.md`, `openapi.yaml`, and Swagger.

## Data impact

Add `tenants.photo_url` `varchar(255) NOT NULL DEFAULT ''` through a new
migration. Empty string means no photo. A stored value is the photo
pointer `{tenantId}.{extension}` in the tenant folder, the same pointer
shape already used for user photos. Image bytes are not a column.

Replacement overwrites that pointer. When the new extension differs, the
previous file is deleted after the new file is stored. The bootstrap
tenant starts with an empty pointer and can receive a file through
`PUT /api/v1/tenants/{id}/photo`.

Approved delivery updates `docs/database.md`.

## Security

Existing portal and user-photo controls apply. This specification does not
add a public route, does not weaken `Administrador` on tenant create, and
does not change session cookie policy.

- Create and replace authorization stay on the backend. Hiding the Cadastro
  cards is UX only.
- The same role that may create a tenant may replace any tenant's photo.
  `AdministradorTenant` and `Usuario` may not.
- The upload uses the existing photo interceptor: size limit 5 MB, one
  file, SVG rejected, and server-side content detection. On create, reject
  a failed detection with `400` before inserting the tenant. On replace,
  reject it before changing the pointer or deleting the previous file.
- Read authorization is the working session tenant. A caller must not read
  another tenant's file by guessing the id. The replace form does not
  preview another tenant's current image.
- The browser receives an API path, never a filesystem path, and never the
  file bytes inside JSON. `PUT` returns an empty `204`.
- Do not log file contents, cookies, or tokens.
- Response headers on the image route match the user photo route:
  `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`,
  and `Cross-Origin-Resource-Policy: cross-origin`.

## Testing

- AC-001: the tenant form renders optional `Foto`; create without a file
  succeeds; an oversized or non-image file shows the invalid-photo copy
  and does not call a successful create
- AC-002: create with a valid image writes the file under the tenant
  folder and stores only the pointer; the `201` body has no path and no
  bytes
- AC-003: header circle uses `tenantPhotoUrl` and the tenant name as its
  accessible name; with an empty `tenantPhotoUrl` it renders tenant
  initials and not the person's photo
- AC-004: header text is the tenant name and does not include the person's
  name
- AC-005: footer subtitle is `cargo`; profile labels are absent; an empty
  `cargo` omits the subtitle; the person's name and photo remain
- AC-006: unauthenticated photo read and replace are `401`; a caller whose
  working tenant differs is `403` on read; the owning session tenant
  receives the bytes; a tenant without a photo is `404` on read;
  non-`Administrador` create and replace are `403`
- AC-007: duplicate and invalid-photo creates leave no tenant row, folder,
  or file
- AC-008: session mapping sets `tenantPhotoUrl` from the working tenant
  pointer, including a switched `Administrador` tenant, and leaves it
  empty when the pointer is empty
- AC-009: only `Administrador` sees `Alterar foto da tenant`; a valid
  replace stores the new pointer, preserves name, slug, email, and status,
  removes the previous file when the pointer changes, and refreshes the
  header when that tenant is the working tenant; unknown id is `404`;
  missing and invalid files leave the previous photo in place

## Delivery

The named human approver invoked `/goal` on this specification on
2026-10-02. That invocation set `status: approved`. Implementation on
2026-10-02 set `status: implemented`.

Delivery choices already recorded above: optional `Foto` on create,
required `Foto` on replace, the existing user-photo validation, multipart
field `photo`, pointer column `photo_url`, read route scoped to the
working tenant, `PUT /api/v1/tenants/{id}/photo` as the only tenant update,
Cadastro card and modal, header composition, initials fallback, and
cargo-only footer subtitle.

## Traceability

- VETOR-013 tenant registration, create authorization, and copy
- VETOR-009 user photo storage, replacement, header chrome, and image
  response headers
- VETOR-021 sidebar footer, profile line, and optional `cargo`
- Session working tenant already used for `tenantName`
- Human follow-up on 2026-10-02 allowing a later photo replacement

## Implementation evidence

- Changed: optional tenant photo on multipart `POST /api/v1/tenants`; `PUT` and `GET /api/v1/tenants/{id}/photo`; `tenants.photo_url`; session `tenantPhotoUrl`; Cadastro card `Alterar foto da tenant`; header tenant name and initials or tenant photo; sidebar footer subtitle is `cargo`. Updated `docs/api.md`, `openapi.yaml`, Swagger, `docs/database.md`, and `docs/design.md`. Migration `1760000014000-add-tenant-photo-url`.
- Tests: `npm run test --workspace backend` passed (39 files, 230 tests). `npm run test --workspace frontend` passed (68 files, 245 tests). `npm run test:e2e --workspace backend` failed one existing case in `test/projects.e2e-spec.ts` (`status: ['archive']` is a valid lane key and returns 200); `test/tenants.e2e-spec.ts` and `test/swagger.e2e-spec.ts` passed (18 tests). `npm run typecheck --workspace frontend` passed. `npm run lint` passed with existing frontend `img` warnings and no errors. `npm run typecheck --workspace backend` failed on existing errors in `rate-limit.guard.spec.ts` and `test/session-tenant.e2e-spec.ts`. `npm run build --workspace backend` passed. `npm run build --workspace frontend` passed. `npm run sdd:validate` passed. The local database has `tenants.photo_url`. In the open portal, Cadastro shows `Alterar foto da tenant`, the header shows `Mandala Eventos` with initials `ME`, the footer shows `Admin Vetor` and `Suporte`, and both photo fields behave as specified.

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
