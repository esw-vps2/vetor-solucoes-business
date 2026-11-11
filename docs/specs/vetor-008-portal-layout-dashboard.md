---
id: VETOR-008
title: Portal layout with Dashboard button
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-19-portal-layout-dashboard
created_at: 2026-09-19
updated_at: 2026-09-19
---

# Portal layout with Dashboard button

## Context

The requester asked to create the portal and attached one image as the layout
direction. The known acceptance criterion is to create the portal layout only.
The only navigation control first requested was the Dashboard button. Later
decisions add `Cadastrar Usuário` for `Administrador`.

`docs/product.md` already records `/portal` as the authorized-user surface and
authenticated landing page. Portal login today is the `Portal Vector` modal on
`/`. `GET /api/v1/auth/session` currently returns `id`, `tenantId`, `email`,
and `profile`. The `users` table does not store first name, last name, age,
sex, or photo URL. Existing password recovery accepts a token in a modal, not
a URL. This specification adds a dynamically generated, expiring
password-change **link** in the email sent when an `Administrador` creates a
user.

Follow-up decisions:

- Match the attached image for structure, spacing, and icons. Color tokens
  are the VETOR tokens in `docs/design.md`. The portal typeface is Inter.
- The Dashboard button label is `Painel`.
- `/portal` is the main dashboard for `Administrador` and other profiles.
  `Administrador` uses the VETOR tenant. Other profiles use their associated
  tenant.
- The main area keeps `Bem-vindo ao Portal Vector.`
- This layout replaces the current authenticated `/portal` page.
- `Painel` uses a custom inline SVG icon matching the dashboard mark in the
  attached image. No icon library.
- Below `lg` (`1024px`), the sidebar is a hamburger overlay. From `lg`, the
  left sidebar stays visible.
- `/` and `/portal` are an installable PWA with
  `frontend/public/brand/logo_vetor.png`. After install, the app opens `/`
  and the existing Portal Vector email-and-password login.
- Tenant `name` and `slug` appear in the sidebar and the main area.
- The layout keeps the VETOR logo, `Sair`, first name, last name, and photo
  from the image URL. It does not show email or profile chips.
- The login token carries exactly the portal-journey fields listed below.
- User registration is `POST /api/v1/users`. The request includes required
  `tenantId` plus `Nome`, `Sobrenome`, `idade`, `sexo`, image URL, `email`,
  and password. Only `Administrador` may call it or use the form. `sexo`
  values are `M`, `F`, and `O`.
- A user is always associated with a tenant. The registration form tenant
  control is a list of every tenant row in the database, loaded through
  `GET /api/v1/tenants` for `Administrador`.
- After create, the backend sends an email with subject `Altere a senha`,
  using the existing VETOR transactional layout, containing a dynamically
  generated password-change link that expires according to
  `PASSWORD_RESET_TOKEN_EXPIRES_IN`. The chosen destination is
  `{CORS origin}/portal/change-password?token={token}`.
- `/portal` shows a `Cadastrar Usuário` button for `Administrador`. Selecting
  it presents the complete form on `/portal`.
- Chosen fictitious bootstrap `Administrador` (`admin@vetor.tech`): `Nome`
  `Admin`, `Sobrenome` `Vetor`, `idade` `40`, `sexo` `M`, photo URL
  `/brand/symbol-vetor.png`. Password stays `BOOTSTRAP_ADMIN_PASSWORD`.
- Tenant folders live in a Docker volume bound to
  `infrastructure/repository/files`. The folder id is the tenant id. Create
  on tenant insert, for `vetor`, and for every tenant already in the
  database.
- Do not store the attached image in the repository.

## Desired outcome

An authenticated user reaches `/portal` as the main dashboard: attached-image
layout, Inter, VETOR colors, `Painel`, `Bem-vindo ao Portal Vector.`, tenant
`name` and `slug` in sidebar and main area, VETOR logo, `Sair`, and the
person's first name, last name, and photo.

An `Administrador` can select `Cadastrar Usuário` on `/portal`, pick a tenant
from the full database list, register a user through `POST /api/v1/users`,
and the new user receives `Altere a senha` with an expiring dynamic link to
`/portal/change-password`.

The installed PWA opens `/` at the existing Portal Vector login.

Each tenant has a folder under `repository/files/{tenantId}`.

## In scope

- Replace the authenticated `/portal` page with the portal layout directed by
  the attached image, using Inter and VETOR color tokens.
- Create the `Painel` navigation button, with a custom inline SVG icon.
- Keep `Bem-vindo ao Portal Vector.` in the main area.
- Show tenant `name` and `slug` in the sidebar and in the main area.
- Keep the VETOR logo and `Sair`. Show first name, last name, and photo from
  the image URL. Do not show email or profile on this layout.
- Persist first name, last name, age, sex (`M`, `F`, `O`), photo URL, email,
  and password hash on the user. Include the portal-journey fields in the
  login token.
- Add `POST /api/v1/users` as the user registration endpoint, including
  required `tenantId`. Restrict it to `Administrador`.
- Add `GET /api/v1/tenants` so an `Administrador` can load every tenant in
  the database for the registration list.
- Add a `Cadastrar Usuário` button on `/portal` for `Administrador` and a
  complete form on `/portal` with `Nome`, `Sobrenome`, `idade`, `sexo`
  (`M`, `F`, `O`), image URL, `email`, password, and a required tenant list.
- After a successful create, send a transactional email with subject
  `Altere a senha` and a dynamically generated expiring password-change link
  to `/portal/change-password`.
- Add the `/portal/change-password` page that accepts `Nova senha` and
  `Repetir senha` when the link token is valid.
- Persist the chosen fictitious `Administrador` profile fields recorded here.
- Treat `/portal` as the main dashboard for `Administrador` and other
  profiles, with the VETOR tenant for `Administrador` and the associated
  tenant for other profiles.
- Responsive shell: hamburger overlay below `lg`; visible left sidebar from
  `lg`.
- Installable PWA for `/` and `/portal`, VETOR logo, start URL `/` with the
  existing Portal Vector login.
- Bind a Docker volume to `infrastructure/repository/files`. Create a folder
  named by tenant id on insert, for `vetor`, and for every existing tenant.
- Update `docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
  Swagger, `docs/database.md`, and infrastructure during approved delivery.

## Out of scope

- Any other sidebar or header control visible in the attached image,
  including Calendar, Inbox, Widget, Tasks, Profile, Write post, Pages,
  Chart, Social App, and Global Setting.
- Content widgets visible in the attached image, including income, chart,
  calendar, recent orders, recent comments, contacts, and search.
- The dummy avatar and dummy name from the attached image.
- The close control visible in the attached image.
- Showing email or profile on the new `/portal` layout.
- Storing the attached image in the repository.
- Adding an icon library or a second font family.
- An offline PWA shell.
- Uploading photo files. The photo is an image URL.
- Token claims beyond the list in API and integrations.
- Public user self-registration.
- User registration by any profile other than `Administrador`.
- A user with no tenant.
- Changing the existing modal password-recovery flow except by adding the
  create-user password-change email with a dynamic expiring link.

## Acceptance criteria

- AC-001: The authenticated `/portal` page presents the layout directed by
  the attached image (structure, spacing, and icons), uses Inter, and uses
  VETOR color tokens from `docs/design.md`.
- AC-002: The layout includes the navigation button labeled `Painel`, with a
  custom inline SVG icon in the existing project icon style. It does not
  include the other navigation buttons shown in the attached image.
- AC-003: `/portal` is the main dashboard route for `Administrador` and for
  other profiles, and this layout replaces the previous authenticated
  `/portal` page.
- AC-004: The main area shows `Bem-vindo ao Portal Vector.`
- AC-005: An `Administrador` session uses the VETOR tenant (`vetor`) as the
  dashboard tenant. Any other profile uses the tenant associated with that
  login.
- AC-006: Below `lg`, the sidebar is reachable from a hamburger overlay.
  From `lg`, the left sidebar stays visible.
- AC-007: `/` and `/portal` are installable as a PWA. The PWA icon is the
  VETOR logo at `frontend/public/brand/logo_vetor.png`. After install, the
  app opens `/` and the existing Portal Vector email-and-password login,
  which then grants access to the Portal.
- AC-008: The sidebar and the main area both show the current tenant `name`
  and `slug`.
- AC-009: Tenant folders live in the Docker volume bound to
  `infrastructure/repository/files`. A folder named by tenant id is created
  when a tenant row is inserted, for tenant `vetor`, and for every tenant
  already in the database. Saved files for a tenant stay in that tenant's
  folder.
- AC-010: The new `/portal` layout shows the VETOR logo, `Sair`, the
  authenticated person's first name and last name, and the photo from the
  image URL. It does not show email or profile.
- AC-011: Successful login issues a token that contains exactly the
  portal-journey fields recorded in this specification, and no extra claims.
- AC-012: `POST /api/v1/users` registers a user for a required `tenantId`.
  Only an authenticated `Administrador` can call it. The body includes
  `tenantId`, `Nome`, `Sobrenome`, `idade`, `sexo` (`M`, `F`, or `O`), image
  URL, `email`, and password. Missing tenant, unknown tenant, or `sexo`
  outside `M`/`F`/`O` receives `400`. Non-`Administrador` callers receive
  `403`. Unauthenticated callers receive `401`. The password is stored hashed
  and is not returned. Every created user is associated with a tenant.
- AC-013: After a successful create, the backend sends an email with subject
  `Altere a senha`, the existing VETOR transactional layout, and a
  dynamically generated link
  `{CORS origin}/portal/change-password?token={token}` that expires according
  to `PASSWORD_RESET_TOKEN_EXPIRES_IN`.
- AC-014: `/portal` shows a `Cadastrar Usuário` button only for
  `Administrador`. Selecting it presents the complete registration form on
  `/portal`. The tenant field is a required list of every tenant stored in
  the database. Other profiles do not see a working registration control.
- AC-015: The bootstrap `Administrador` `admin@vetor.tech` is stored with
  `Nome` `Admin`, `Sobrenome` `Vetor`, `idade` `40`, `sexo` `M`, and photo
  URL `/brand/symbol-vetor.png`. Password remains `BOOTSTRAP_ADMIN_PASSWORD`.
- AC-016: `GET /api/v1/tenants` returns every tenant in the database to an
  authenticated `Administrador` and returns `401` or `403` otherwise.
- AC-017: `/portal/change-password` accepts a valid unexpired token from the
  email link and exposes `Nova senha` and `Repetir senha`. An expired,
  missing, or used token does not change the password.

## User experience

1. Installing the PWA opens `/` at the existing Portal Vector
   email-and-password login. After successful authentication, the user
   reaches the Portal.
2. An authorized user on `/portal` sees the shell directed by the attached
   image: dark left sidebar and a lighter main area, Inter, and VETOR colors.
3. Chrome is the VETOR logo, photo from the image URL, first name and last
   name, tenant `name` and `slug` in the sidebar and the main area, `Painel`,
   and `Sair`. Email and profile are not shown.
4. `Painel` is the selected sidebar item. Selecting it stays on `/portal`.
   `Sair` calls the existing logout API.
5. The main area shows `Bem-vindo ao Portal Vector.` plus tenant `name` and
   `slug`.
6. `Administrador` uses the VETOR tenant dashboard. Other profiles use their
   associated tenant.
7. Below `lg`, a hamburger control opens the sidebar as an overlay. From
   `lg`, the left sidebar stays visible.
8. An `Administrador` sees `Cadastrar Usuário` on `/portal`. Selecting it
   presents the form on `/portal` with `Nome`, `Sobrenome`, `idade`, `sexo`
   (`M`, `F`, `O`), image URL, `email`, password, and a required tenant list
   of every tenant in the database. Other profiles do not get that button.
9. After the `Administrador` submits a valid form, the user is created and
   receives `Altere a senha` with a dynamic expiring link.
10. Opening a valid link loads `/portal/change-password` with `Nova senha`
    and `Repetir senha`. After a successful change, the token cannot be used
    again.

Unauthenticated visitors do not see the dashboard. They use the existing
login on `/`, or `/portal/change-password` when they have a valid create-user
password-change token.

## API and integrations

On login, the access token and the authenticated session payload must include
exactly:

- `id`
- `email`
- `profile`
- first name
- last name
- age
- sex
- photo URL
- `tenantId`
- tenant `name`
- tenant `slug`

Passwords, password hashes, refresh tokens, reset tokens, and tenant
filesystem paths must not appear in the token or in the session JSON.

Login, refresh, and session responses that already return the current safe
user must return these fields after this change.

### `GET /api/v1/tenants`

| Field   | Value                                                   |
| ------- | ------------------------------------------------------- |
| Method  | `GET`                                                   |
| Path    | `/api/v1/tenants`                                       |
| Auth    | Access cookie. `Administrador` only                     |
| Request | None                                                    |
| Success | `200` JSON array of every tenant (`id`, `name`, `slug`) |
| Errors  | `401` unauthenticated, `403` not `Administrador`        |

### `POST /api/v1/users`

| Field   | Value                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Method  | `POST`                                                                                                                                                    |
| Path    | `/api/v1/users`                                                                                                                                           |
| Auth    | Access cookie. `Administrador` only                                                                                                                       |
| Request | `tenantId`, `firstName`, `lastName`, `age`, `sex`, `photoUrl`, `email`, `password`                                                                        |
| Success | `204 No Content`                                                                                                                                          |
| Errors  | `400` invalid input (including missing tenant, unknown tenant, `sex` not `M`/`F`/`O`), `401` unauthenticated, `403` not `Administrador`, `429` rate limit |

JSON property names follow the existing English API convention and map to the
Portuguese form labels: `tenantId`, `firstName`, `lastName`, `age`, `sex`,
`photoUrl`, `email`, `password`. Unique `tenant_id + email` remains enforced.
The created user's profile is the existing default `Usuario` unless a later
decision adds profile to the form. `tenantId` is required. `sex` is `M`,
`F`, or `O`.

Side effects: hash the password with bcrypt cost of at least 10; persist the
user on the named tenant; create a single-use expiring password-change token;
send `Altere a senha` with a dynamically generated link
`{CORS origin}/portal/change-password?token={token}`. Do not return the
password. Do not log the password or the raw link token.

The password-change page submits the token from the query string with
`Nova senha` and `Repetir senha`. The backend resolves the user from the
hashed token so the form does not collect email. Delivery may extend
`POST /api/v1/auth/password-recovery/reset` for this token-only submit.
Expiry is `PASSWORD_RESET_TOKEN_EXPIRES_IN` (default `15m`). An expired,
missing, or used token returns a generic failure without revealing whether
the account exists.

No photo-upload HTTP endpoint was requested.

PWA packaging is not an HTTP API change. After install, the app starts at
`/`.

Approved delivery must update `docs/api.md`, `openapi.yaml`, and Swagger.

## Data impact

PostgreSQL already has `tenants.id`, `tenants.name`, `tenants.slug`, and
users unique by `tenant_id + email`. A user always has a tenant.

This specification persists on the user: first name, last name, age, sex
(`M`, `F`, `O`), photo URL, email (already present), and password hash
(already present).

Bootstrap `Administrador` `admin@vetor.tech` in tenant `vetor`:

| Field       | Value                      |
| ----------- | -------------------------- |
| `Nome`      | `Admin`                    |
| `Sobrenome` | `Vetor`                    |
| `idade`     | `40`                       |
| `sexo`      | `M`                        |
| photo URL   | `/brand/symbol-vetor.png`  |
| `email`     | `admin@vetor.tech`         |
| password    | `BOOTSTRAP_ADMIN_PASSWORD` |

Each tenant has a folder at `infrastructure/repository/files/{tenantId}`.
Create on insert, for `vetor`, and for every tenant already in the database.

Approved delivery must update `docs/database.md` and
`infrastructure/docker-compose.yml`.

## Security

Existing project security rules apply.

- Portal access remains authenticated and authorized on the backend.
- `POST /api/v1/users` and `GET /api/v1/tenants` are `Administrador` only.
  ABAC default remains deny. Hiding `Cadastrar Usuário` is UX only.
- `Administrador` keeps all-tenant ABAC scope except that the dashboard uses
  the VETOR tenant. Other profiles remain limited to their associated tenant.
- Token claims come from the backend at login. The frontend must not accept a
  client-supplied tenant id to switch dashboard context or folders.
- Tenant folders live under `infrastructure/repository/files`. A tenant must
  not read or write another tenant's folder. Folder paths are not returned to
  the browser.
- Photo values are URLs. They are not uploaded files in this specification.
- Passwords require the existing minimum of 12 characters and bcrypt cost of
  at least 10. Passwords and raw reset tokens are never logged, returned, or
  placed in `NEXT_PUBLIC_*`.
- The create-user email contains a dynamically generated password-change
  link. The token must be random, stored hashed, single-use, and expire
  according to `PASSWORD_RESET_TOKEN_EXPIRES_IN`. The link host is the
  configured `CORS` frontend origin, not an arbitrary user-supplied URL.
- `/portal/change-password` is usable with a valid token without a dashboard
  session. It must not expose the dashboard.
- `Sair` calls `POST /api/v1/auth/logout`.
- PWA assets must not expose secrets or authenticated API data to an
  unauthenticated installer. No offline shell is added.

## Testing

- AC-001: layout uses the directed shell, Inter, and VETOR color tokens
- AC-002: `Painel` with inline SVG icon is present; other reference
  navigation buttons are absent
- AC-003: authenticated `/portal` is the dashboard and replaces the previous
  authenticated page
- AC-004: main area shows `Bem-vindo ao Portal Vector.`
- AC-005: `Administrador` dashboard tenant is `vetor`; other profiles use
  their associated tenant
- AC-006: hamburger overlay sidebar below `lg`; visible left sidebar from
  `lg`
- AC-007: PWA installability for `/` and `/portal` with the VETOR logo;
  installed app starts at `/` with the existing Portal Vector login
- AC-008: sidebar and main area show tenant `name` and `slug`
- AC-009: tenant folders under `infrastructure/repository/files/{id}` for
  insert, for `vetor`, and for tenants already in the database
- AC-010: layout shows VETOR logo, `Sair`, first name, last name, and photo
  URL image; email and profile are absent
- AC-011: login token and session include exactly the recorded fields and
  exclude secrets and filesystem paths
- AC-012: `POST /api/v1/users` succeeds for `Administrador`, requires
  `tenantId`, rejects `sex` outside `M`/`F`/`O`, rejects other profiles with
  `403`, rejects unauthenticated with `401`, and does not return the password
- AC-013: successful create sends `Altere a senha` with a dynamic expiring
  `/portal/change-password?token=` link
- AC-014: `Cadastrar Usuário` is available only to `Administrador` on
  `/portal`; tenant list contains every database tenant and is required
- AC-015: bootstrap `Administrador` has the recorded fictitious fields
- AC-016: `GET /api/v1/tenants` is `Administrador` only and returns every
  tenant
- AC-017: `/portal/change-password` accepts a valid token and rejects
  expired, missing, or used tokens without changing the password

Workspace commands after approved delivery: frontend and backend
`typecheck`, `lint`, `test`, and `build` for the touched workspaces;
`npm run sdd:validate`.

## Delivery

This specification is `implemented`. Human validation of the recorded
acceptance criteria is still required before `validated`.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-19-portal-layout-dashboard`
- Request: create the portal; use the attached image as layout direction;
  create only the Dashboard button; create the portal layout only
- Follow-up: VETOR colors; `Painel`; Inter; `/portal` main dashboard;
  `Administrador` uses VETOR tenant; keep `Bem-vindo ao Portal Vector.`;
  replace current authenticated page; SVG icon; hamburger overlay below
  `lg`; PWA starting at `/`; tenant `name` and `slug` in sidebar and main
  area; keep logo, `Sair`, name, last name, photo URL; drop email and
  profile chips; journey fields in the token; `POST /api/v1/users` with
  required tenant, `Administrador` only; password on create; email
  `Altere a senha` with a dynamic expiring
  `/portal/change-password?token=` link; `sexo` `M`/`F`/`O`; `Cadastrar
Usuário` form on `/portal`; tenant list of every database tenant; user
  always associated with a tenant; fictitious `Administrador` `Admin` /
  `Vetor` / `40` / `M` / `/brand/symbol-vetor.png`; Docker volume
  `repository/files`
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, `docs/conventions.md`,
  `docs/architecture.md`

## Implementation evidence

- Changed: `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/forms/portal-register-form.tsx`,
  `frontend/app/portal/page.tsx`, `frontend/app/portal/change-password/`,
  `frontend/components/forms/change-password-form.tsx`,
  `frontend/app/manifest.ts`, `frontend/lib/pwa.ts`,
  `frontend/components/layout/header.tsx`, `frontend/app/layout.tsx`,
  `frontend/lib/api/client.ts`,
  `backend/src/modules/portal/entities/user.entity.ts`,
  `backend/src/database/migrations/1760000001000-add-user-profile-fields.ts`,
  `backend/src/modules/portal/auth.service.ts`,
  `backend/src/modules/portal/auth.types.ts`,
  `backend/src/modules/portal/bootstrap-admin.service.ts`,
  `backend/src/modules/portal/users.controller.ts`,
  `backend/src/modules/portal/users.service.ts`,
  `backend/src/modules/portal/tenants.controller.ts`,
  `backend/src/modules/portal/tenants.service.ts`,
  `backend/src/modules/portal/tenant-storage.service.ts`,
  `backend/src/modules/portal/guards/administrador.guard.ts`,
  `backend/src/modules/mail/mail.service.ts`,
  `backend/src/modules/mail/email-template.service.ts`,
  `infrastructure/docker-compose.yml`,
  `infrastructure/dockerfile.backend.yml`,
  `infrastructure/.env.backend.example`, `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, `docs/architecture.md`, and
  `openapi.yaml`.
- Tests: `frontend/app/portal/page.spec.tsx`,
  `frontend/components/forms/change-password-form.spec.tsx`,
  `frontend/app/manifest.spec.ts`, `frontend/lib/pwa.spec.ts`,
  `frontend/components/layout/header.spec.tsx`,
  `backend/src/modules/portal/auth.service.spec.ts`,
  `backend/src/modules/portal/bootstrap-admin.service.spec.ts`,
  `backend/src/modules/portal/users.service.spec.ts`,
  `backend/src/modules/portal/tenants.service.spec.ts`,
  `backend/src/modules/portal/tenant-storage.service.spec.ts`,
  `backend/src/modules/portal/administrador.guard.spec.ts`,
  `backend/src/modules/mail/mail.service.spec.ts`,
  `backend/test/users-tenants.e2e-spec.ts`.
- Commands: `npm run format:check` passed; `npm run typecheck` passed;
  `npm run lint` passed; `npm run test` passed (backend 44, frontend 52,
  SDD 10); `npm run test:e2e` passed (backend 12); `npm run build` passed
  (`/`, `/portal`, `/portal/change-password`, `/manifest.webmanifest`);
  `npm run docker:config` passed; `npm run sdd:validate` passed.
- Runtime: PostgreSQL bootstrap user is `Admin` / `Vetor` / `40` / `M` /
  `/brand/symbol-vetor.png` on tenant `vetor`. Tenant folder
  `infrastructure/repository/files/270fef84-bd39-4f89-b1f4-efcdd76af51f`
  exists on the host and in `/app/files`. Unauthenticated
  `GET /api/v1/tenants` and `POST /api/v1/users` return `401`. The live
  manifest is `standalone` with icon `/brand/logo_vetor.png` and
  `start_url` `/`. Unauthenticated `/portal` does not show the dashboard.
  `/portal/change-password` without a valid token does not show the
  dashboard and reports an invalid or expired link.
- Limitations: the access JWT still carries `sub`, `type`, and `sessionId`
  (plus standard `iat`/`exp`) required by the existing access-token guard.
  The login session JSON contains exactly the recorded journey fields.
  Authenticated `/portal` chrome was verified by component tests, not by a
  live logged-in browser session. Tenant folders are created on bootstrap
  insert and on backend startup for every existing tenant; there is no
  public tenant-create HTTP endpoint.

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
- AC-011: Human validation has not started.
- AC-012: Human validation has not started.
- AC-013: Human validation has not started.
- AC-014: Human validation has not started.
- AC-015: Human validation has not started.
- AC-016: Human validation has not started.
- AC-017: Human validation has not started.
