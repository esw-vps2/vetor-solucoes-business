---
id: VETOR-011
title: Portal Power BI Embedded
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-20-portal-powerbi-embedded
created_at: 2026-09-20
updated_at: 2026-09-20
---

# Portal Power BI Embedded

## Context

The requester asked to migrate Power BI Embedded product behavior from Medical
Bills into the VETOR portal. The source of behavior is `tmp/medical-monorepo`
(Power BI only). The Python integration service already lives in this
repository at `ms-powerbi-embedded`. This specification does not rewrite that
service, duplicate it, or expose it to the browser.

Authenticated `/portal` already has `Painel` and `Cadastro Usuário`. Portal
sessions use HttpOnly cookies. `Administrador` is enforced by
`AdministradorGuard`. Tenants are UUID rows listed by `GET /api/v1/tenants`.
The access token already includes `tenantId`. The bootstrap `Administrador`
session tenant is `vetor`.

Medical used SuperAdmin (`admin` profile plus numeric `unidade === 0`),
integer unidade/entidade codes, a `relatorios_personalizados` module flag,
and a Vite + Radix + Lucide UI with JWT in `localStorage`. Those are mapped
as recorded below. They are not migrated as-is.

Architecture for this feature:

```text
Browser → Next.js /portal → NestJS /api/v1/powerbi → ms-powerbi-embedded → Power BI REST
```

PostgreSQL stores the imported catalog and per-tenant distributions. Python
caches Microsoft embed tokens in Redis. The browser never calls Python or the
Microsoft Power BI API.

Existing contracts consulted: `docs/product.md`, `docs/design.md`,
`docs/api.md`, `docs/database.md`, `docs/architecture.md`,
`docs/conventions.md`, `tasks/specs/vetor-008-portal-layout-dashboard.md`,
`tasks/specs/vetor-009-user-photo-upload-sidebar-logo.md`.

A separate draft exists at
`tasks/specs/vetor-010-perfil-modal-user-permissions.md` with
`id: VETOR-010`. A human resolved the duplicate-id conflict: this Power BI
feature is `VETOR-011`; the profile specification remains `VETOR-010`.

## Desired outcome

An `Administrador` imports Power BI reports, distributes them to VETOR
tenants, and activates or deactivates them.

An authenticated user sees only reports distributed to their own session
tenant, opens the embed, and the embed token renews in memory.

## In scope

- Portal routes `/portal/relatorios` and `/portal/powerbi`, with sidebar
  items `Relatórios` (every authenticated user) and `Power BI`
  (`Administrador` only). Keep existing `Painel` and `Cadastro Usuário`.
- NestJS `/api/v1/powerbi` catalog, distribution, my-reports, and embed-token
  operations, authenticated with existing portal session cookies.
- Nest → Python proxy that mirrors Medical `powerbi-proxy.service.ts` and
  calls only the listed Python routes with `X-API-Key`.
- PostgreSQL tables `powerbi_reports` and `powerbi_report_distributions`,
  TypeORM entities, and a migration.
- Docker Compose `powerbi` and `redis` services plus backend
  `POWERBI_EMBEDDED_*` env examples.
- Frontend embed using `powerbi-client` and `powerbi-client-react` in the
  `frontend` workspace only.
- VETOR visual system: Next.js App Router, VETOR tokens, Inter, existing
  portal shell, custom inline SVG in the `portal-shell.tsx` style. No Lucide,
  Radix, or shadcn copied from Medical.
- After human approval, update `docs/product.md`, `docs/api.md`,
  `openapi.yaml`, Swagger, `docs/database.md`, `docs/architecture.md`, and
  `docs/design.md` in the same delivery.

### Mapping Medical → VETOR

| Medical | VETOR |
| ------- | ----- |
| SuperAdmin (`admin` + `unidade === 0`) | `Administrador` via existing `AdministradorGuard` |
| Unidade/entidade integer | Tenant UUID from existing `GET /api/v1/tenants` |
| Module flag `relatorios_personalizados` | Do not migrate. Distributing to a tenant grants access |
| RLS column / identities on GenerateToken | Out of scope. Tokens use `dataset_ids` and `report_ids` only |
| `/backoffice/powerbi` | `/portal/powerbi` |
| `/relatorios-personalizados` | `/portal/relatorios` |
| localStorage JWT | Existing portal HttpOnly cookies |
| Vite + Radix + Lucide | Next.js App Router, VETOR tokens, inline SVG like `portal-shell.tsx` |
| Numeric report/distribution ids | UUID primary keys |
| `allowEdit` in Python GenerateToken | Unchanged (`false`). Do not rewrite Python |

## Out of scope

- Any other Medical feature (billing, purchases, entities, HIS, modules, and
  similar)
- Rewriting or changing `ms-powerbi-embedded` behavior except Docker and env
  wiring in this monorepo
- RLS / identities / username / roles on GenerateToken
- `EntidadeModulo` / `relatorios_personalizados` module system
- Numeric unit codes (`unidade`)
- SuperAdmin with `unidade === 0`
- Copying Lucide, Radix, or shadcn from Medical
- Storing embed tokens in `localStorage` or `sessionStorage`
- The browser calling Python or the Microsoft Power BI API
- Editable embeds (`allowEdit` stays `false` in Python)
- Leadpage, PWA, a new auth scheme, billing
- Portuguese comments or JSDoc in `backend/` or `frontend/`
- Exposing Python `GET /token_application` (or cache-status) to the portal
- Creating an RLS column or a modules table
- Approving this specification
- Implementation while this specification is `draft`

## Acceptance criteria

- AC-001: `Administrador` lists workspaces, reports, and pages via Nest,
  which calls Python with the API key.
- AC-002: `Administrador` imports a report; Nest fetches `datasetId` and
  `embedUrl` from Python; `409` if already registered.
- AC-003: `Administrador` edits name and description and activates or
  deactivates; the UI confirms deactivation.
- AC-004: `Administrador` distributes to an existing tenant; `409` if already
  distributed; `400` if the report is inactive; the picker uses
  `GET /api/v1/tenants`.
- AC-005: `Administrador` edits and activates or deactivates a distribution;
  the UI confirms deactivation.
- AC-006: Authenticated `GET /powerbi/meus-relatorios` returns only active
  distributions for the token `tenantId`; another tenant gets an empty list
  or `403` on embed, never another tenant's report.
- AC-007: `POST` embed-token returns `embedUrl`, token, `expiration`, and
  `paginaPadrao`; the token is not stored; renew 2 minutes before expiry.
- AC-008: The viewer uses `powerbi-client-react`, hides filters, shows page
  navigation, supports native SDK fullscreen, and opens `pageName` when
  `paginaPadrao` is set.
- AC-009: A non-`Administrador` cannot access admin routes (`403`) and does
  not see the Power BI nav item.
- AC-010: Python down or missing env returns `503` that is friendly and
  contains no stack or secrets.
- AC-011: Compose starts `powerbi` and `redis`; the backend uses
  `POWERBI_EMBEDDED_*`; env examples are updated.
- AC-012: Approved delivery updates `docs/product.md`, `docs/api.md`,
  `openapi.yaml`, Swagger, `docs/database.md`, `docs/architecture.md`, and
  `docs/design.md`.

## User experience

UI language is Portuguese (Brazil), as in `docs/product.md`. Visual treatment
follows `docs/design.md` (navy sidebar, off-white or dark main area, Inter,
VETOR tokens, existing modal accessibility). Icons are custom inline SVG in
the same stroke style as `portal-shell.tsx`. Do not add an icon library.

### Sidebar

Keep `Painel` and `Cadastro Usuário`. Add:

| Label | Route | Visibility |
| ----- | ----- | ---------- |
| `Relatórios` | `/portal/relatorios` | Every authenticated user |
| `Power BI` | `/portal/powerbi` | `Administrador` only. Hide in the UI. Enforce on the backend. |

Hiding `Power BI` is UX only. Authorization is backend-enforced.

### Roles

- Catalog, import, distribution, and status: `Administrador` only.
- Viewing: any authenticated user.
- Meus relatórios uses `tenantId` from the access token. An `Administrador`
  also sees only reports distributed to the session tenant (bootstrap VETOR
  tenant). There is no all-tenant picker on the embed screen.
- An `Administrador` distributes to any tenant from `GET /api/v1/tenants`.

This viewing rule is narrower than `docs/product.md` FR-007 (`Administrador`
has all-tenant scope). Catalog and distribution remain all-tenant.
Viewing and embed stay session-tenant. Promote that distinction into
`docs/product.md` during approved delivery. Do not silently drop FR-007.

### `/portal/powerbi` (Administrador)

Tabs: `Catálogo` and `Distribuição`.

**Catálogo**

- Heading: `Relatórios Importados`
- Action: `Importar Relatório` opens the import modal
- List of imported reports with `Ativo` / `Inativo` badge, edit name and
  description, and a status switch
- Deactivate requires confirmation. Activate is immediate
- Empty: `Nenhum relatório importado` and
  `Clique em "Importar Relatório" para começar`

**Import modal** (`Importar Relatório`)

Cascade: workspace → report → page chips → name (prefilled from Power BI) →
optional description.

| Control | Copy |
| ------- | ---- |
| Workspace select | `Workspace` / placeholder `Selecione um workspace` |
| Report select | `Relatório` / placeholder `Selecione um relatório` |
| Page chips | `{n} página(s) encontrada(s)` or `Carregando páginas...` using each page `displayName` |
| Name | `Nome do relatório` / placeholder `Nome para exibição` |
| Description | `Descrição (opcional)` / placeholder `Descrição do relatório` |
| Submit | `Importar Relatório` |

Changing workspace resets report, name, and description.

**Distribuição**

- Heading: `Distribuições`
- Action: `Distribuir Relatório` opens the distribute modal
- Filter label: `Filtrar por relatório` with placeholder
  `Selecione um relatório`
- Rows list tenant `name` and `slug` (not a numeric code), plus
  `nomeExibicao` or `Nome padrão`, `Ordem {n}`, and `Ativa` / `Inativa`
- Edit display name, icon (optional text), order, and default page
- Status switch; confirm on deactivate
- Empty for a selected report: `Nenhuma distribuição para este relatório`

**Distribute modal** (`Distribuir Relatório`)

Active reports only. Tenant picker from `GET /api/v1/tenants`. Default page
from report pages.

| Control | Copy |
| ------- | ---- |
| Report | `Relatório` / `Selecione um relatório` |
| Tenant | `Tenant`, options `{name} ({slug})` matching Cadastro Usuário |
| Display name | `Nome de exibição (opcional)` / `Nome personalizado para o cliente` |
| Icon | `Ícone (opcional)` as optional text, not an icon-library lookup |
| Order | `Ordem de exibição` |
| Default page | `Página padrão (opcional)` / `Nenhuma (primeira página)` |
| Submit | `Distribuir Relatório` |

**Edit modals**

- `Editar Relatório`: `Nome`, `Descrição`, `Salvar` (disabled when name is
  blank)
- `Editar Distribuição`: `Nome de exibição`, `Ícone`, `Ordem`,
  `Página padrão`, `Salvar`

**Confirm deactivation** (`Confirmar desativação`)

- Report: `Desativar este relatório o tornará indisponível para todos os clientes.`
- Distribution: `Desativar esta distribuição removerá o acesso do cliente a este relatório.`
- Actions: `Cancelar` and `Desativar`

**Feedback** (existing portal status pattern; do not add a toast library)

- `Relatório importado com sucesso`
- `Este relatório já está cadastrado` on `409`
- `Erro ao importar relatório`
- `Status atualizado`
- `Erro ao atualizar status`
- `Relatório atualizado`
- `Erro ao atualizar relatório`
- `Relatório distribuído com sucesso`
- `Este relatório já está distribuído para este tenant` on `409`
- `Erro ao distribuir relatório`
- `Status da distribuição atualizado`
- `Distribuição atualizada`
- `Erro ao atualizar distribuição`

A non-`Administrador` who opens `/portal/powerbi` directly must not see
catalog or distribution data and must not call admin endpoints. The backend
returns `403` on admin APIs.

### `/portal/relatorios` (authenticated)

Card grid. Title: `nomeExibicao` if present, otherwise catalog `nome`.
Subtitle: description when present. Cards use a custom inline SVG, not the
stored `icone` string as a Lucide/Radix icon.

- Empty: `Nenhum relatório disponível` and
  `Entre em contato com o administrador para ter relatórios configurados.`
- Load error: `Erro ao carregar relatórios`

Click opens a full-content viewer:

- `Voltar` returns to the card grid
- Report name from the embed payload
- Native Power BI SDK fullscreen
- Filters hidden, page navigation visible, status bar hidden
- `pageName` set when `paginaPadrao` exists
- Embed token in memory only. Renew 2 minutes before expiration, minimum
  30 seconds. First load may show a loading state; silent renewals do not
  replace the viewer with a spinner
- `403` → `Acesso negado a este relatório`
- Other errors → `Erro ao carregar relatório. Tente novamente.` with
  `Tentar novamente`

Frontend packages `powerbi-client` and `powerbi-client-react` are installed
in the `frontend` workspace only (`workspaces.mdc`). They are an embed-SDK
exception to `docs/design.md` “do not add another UI or icon library”. They
are not a general component or icon kit.

## API and integrations

Global prefix `/api/v1`. Session cookies. DTOs at the HTTP boundary. Never
return TypeORM entities. Swagger examples use non-production placeholders.
Approved delivery must update Swagger, `openapi.yaml`, and `docs/api.md`.

Admin endpoints use `AdministradorGuard`. Authenticated user endpoints use
the existing access-cookie guard and filter by token `tenantId`.

### `Administrador`

| Method | Path | Request | Success |
| ------ | ---- | ------- | ------- |
| GET | `/api/v1/powerbi/workspaces` | None | Workspace list from Python (`id`, `name`, optional flags) |
| GET | `/api/v1/powerbi/workspaces/{workspaceId}/reports` | None | Report list from Python (`id`, `name`, `datasetId`, `embedUrl`, optional fields) |
| GET | `/api/v1/powerbi/workspaces/{workspaceId}/reports/{reportId}/pages` | None | Page list (`name`, `displayName`, optional `order`) |
| GET | `/api/v1/powerbi/relatorios` | None | Imported catalog DTOs |
| POST | `/api/v1/powerbi/relatorios` | `{ workspaceId, reportId, nome, descricao? }` | Created catalog DTO |
| PATCH | `/api/v1/powerbi/relatorios/{id}` | `{ nome?, descricao? }` | Updated catalog DTO |
| PATCH | `/api/v1/powerbi/relatorios/{id}/status` | `{ ativo }` | Updated catalog DTO |
| GET | `/api/v1/powerbi/relatorios/{id}/distribuicoes` | None | Distribution DTOs for that report |
| POST | `/api/v1/powerbi/relatorios/{id}/distribuicoes` | `{ tenantId, nomeExibicao?, icone?, ordem?, paginaPadrao? }` | Created distribution DTO |
| PATCH | `/api/v1/powerbi/distribuicoes/{id}` | `{ nomeExibicao?, icone?, ordem?, paginaPadrao? }` | Updated distribution DTO |
| PATCH | `/api/v1/powerbi/distribuicoes/{id}/status` | `{ ativo }` | Updated distribution DTO |

Admin responses need not return embed tokens. Catalog DTOs may include
`datasetId` and `embedUrl` stored from Python. They must not include
`embedToken` or `X-API-Key`.

Distribution list DTOs include `tenantId` plus tenant `name` and `slug` so
the UI can list `{name} ({slug})` without a numeric code. The tenant picker
on distribute uses existing `GET /api/v1/tenants` (`id`, `name`, `slug`).
That endpoint remains `Administrador` only. Approved delivery extends its
documented purpose from registration-only to also include Power BI
distribution.

### Authenticated (session tenant)

| Method | Path | Request | Success |
| ------ | ---- | ------- | ------- |
| GET | `/api/v1/powerbi/meus-relatorios` | None | Active distributions for token `tenantId` |
| POST | `/api/v1/powerbi/meus-relatorios/{distribuicaoId}/embed-token` | None | `{ id, nome, embedUrl, embedToken, expiration, paginaPadrao }` |

`GET /meus-relatorios` returns DTOs for cards: distribution `id`,
`nomeExibicao`, `icone`, `ordem`, `paginaPadrao`, `tenantId`, and nested
`relatorio` `{ id, nome, descricao }`. Do not return `embedToken`,
`datasetId`, or `embedUrl` on this list. The embed POST resolves
`datasetId`, `reportId`, and `embedUrl` from PostgreSQL, never from the
client.

`nome` on the embed response is `nomeExibicao` when set, otherwise catalog
`nome`. `paginaPadrao` is the distribution default page or `null`.

Never persist or log `embedToken` or `X-API-Key`.

### Errors

| Status | When |
| ------ | ---- |
| `401` | Unauthenticated |
| `403` | Wrong role on admin routes, or embed for another tenant's distribution |
| `404` | Missing report or distribution |
| `409` | Duplicate `(workspaceId, reportId)` or duplicate `(relatorioId, tenantId)` |
| `400` | Inactive report on distribute; inactive distribution or report on embed; unknown tenant; invalid DTO |
| `503` | Python is down, or `POWERBI_EMBEDDED_URL` / `POWERBI_EMBEDDED_API_KEY` is missing or invalid |
| `429` | Embed-token 30 / 15 minutes; Nest → Python proxy 60 / 15 minutes; keyed by client IP |

HTTP error bodies follow the existing English API style. The portal maps
status codes to the Portuguese UI strings above. `503` bodies and logs must
not include stack traces, API keys, embed tokens, or Microsoft secrets.
Friendly API messages aligned with Medical (without secrets): report service
not configured; report service temporarily unavailable; failed to communicate
with the report service.

### Domain rules

- Import: Nest calls Python `getReport` and stores the real `datasetId` and
  `embedUrl`. Do not trust the frontend for those fields.
- Unique `(workspaceId, reportId)`. Unique `(relatorioId, tenantId)`.
- Cannot distribute an inactive report.
- Target tenant must exist.
- My reports: active distribution + active report + token `tenantId` only.
  No module-flag check.
- Embed: distribution exists, belongs to token `tenantId`, both active;
  `datasetId` / `reportId` / `embedUrl` from the database.
- Python GenerateToken: `dataset_ids` and `report_ids` only. No `username`
  or `roles`.

Path ids are UUIDs.

### Nest → Python proxy

Mirror Medical `powerbi-proxy.service.ts`. Backend env only (never
`NEXT_PUBLIC_*`):

| Variable | Rule |
| -------- | ---- |
| `POWERBI_EMBEDDED_URL` | `http` or `https` only. Strip trailing slash. Invalid or empty → not configured → `503` |
| `POWERBI_EMBEDDED_API_KEY` | Required for calls. Missing → not configured → `503` |
| `POWERBI_EMBEDDED_TIMEOUT` | Finite number `> 0` only. Otherwise default `15000` |

Send `X-API-Key`. Unwrap OData `{ value: [] }` for collection GETs.

Python routes this portal may use:

- `GET /groups`
- `GET /groups/{id}/reports`
- `GET /groups/{id}/reports/{id}`
- `GET /groups/{id}/reports/{id}/pages`
- `POST /reports/GenerateToken`

Do not expose `token_application` to the portal. Do not change Python
`allowEdit: false`. Do not send identities.

Connection refused, abort, or timeout → `503` without leaking host details
to the browser.

### Frontend API client

Calls live in `frontend/lib/api/client.ts` (conventions). Credentials are
existing portal cookies. The client never receives Python's base URL or API
key.

## Data impact

TypeORM + a new migration. Tables `snake_case` plural. `id` UUID.
`created_at` / `updated_at` `timestamptz`. Follow `postgres.mdc` and
`typeorm.mdc`. No `deleted_at` unless a later specification requires soft
delete. No RLS column. No modules table.

### `powerbi_reports`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `workspace_id` | uuid | Power BI workspace (group) id |
| `report_id` | uuid | Power BI report id |
| `dataset_id` | uuid | From Python, not from the client |
| `embed_url` | varchar(1000) | From Python, not from the client |
| `name` | varchar(255) | Catalog name |
| `description` | varchar(500) nullable | |
| `active` | boolean default true | |
| unique | `(workspace_id, report_id)` | |

### `powerbi_report_distributions`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `report_id` | uuid FK → `powerbi_reports` `ON DELETE RESTRICT` | |
| `tenant_id` | uuid FK → `tenants` `ON DELETE RESTRICT` | |
| `display_name` | varchar(255) nullable | |
| `icon` | varchar(100) nullable | Optional text |
| `sort_order` | int default 0 | |
| `default_page` | varchar(255) nullable | Power BI page `name` |
| `active` | boolean default true | |
| unique | `(report_id, tenant_id)` | |

Index foreign keys. Constraint names follow `postgres.mdc`
(`pk_`, `uq_`, `fk_`, `idx_`).

### API JSON mapping

Persistence uses English `snake_case`. HTTP JSON uses the product camelCase
from Medical, mapped in the service. Controllers never return entities.

| Database | JSON |
| -------- | ---- |
| `workspace_id` | `workspaceId` |
| `report_id` (catalog) | `reportId` |
| `dataset_id` | `datasetId` |
| `embed_url` | `embedUrl` |
| `name` | `nome` |
| `description` | `descricao` |
| `active` | `ativo` |
| `report_id` (distribution FK) | `relatorioId` |
| `tenant_id` | `tenantId` |
| `display_name` | `nomeExibicao` |
| `icon` | `icone` |
| `sort_order` | `ordem` |
| `default_page` | `paginaPadrao` |

Approved delivery must update `docs/database.md`.

## Security

Existing project security rules apply. Auth and authorization exist only in
Nest. Python is an internal integration behind the API key. The frontend
never talks to Python or Microsoft.

- Admin operations: authenticated + `AdministradorGuard` (profile loaded
  from the database, not from a client-supplied role).
- Ownership: `meus-relatorios` and embed-token filtered by token `tenantId`.
  The client must not supply a tenant id to switch viewing context.
- Mass assignment: DTO whitelist (`forbidNonWhitelisted`). `datasetId` and
  `embedUrl` only from Python. Status, ids, and tenant on updates are not
  client-writable except the documented fields.
- Admin responses need not return embed tokens.
- Logs without secrets, API keys, cookies, Authorization headers, or embed
  tokens. Do not log Python request bodies that include tokens.
- Rate limits, keyed by client IP like other portal throttles: embed-token
  30 requests / 15 minutes (`POWERBI_EMBED_TOKEN_RATE_LIMIT_*`); Nest →
  Python proxy 60 requests / 15 minutes (`POWERBI_PROXY_RATE_LIMIT_*`).
- `POWERBI_EMBEDDED_API_KEY` and Microsoft client secrets never appear in
  `NEXT_PUBLIC_*`, specs, or committed env files.
- SSRF: Python URL is env-configured, `http`/`https` only, not taken from
  the client.
- Embed token stays in component memory. Not `localStorage`,
  `sessionStorage`, URL, or query string.
- Hiding the Power BI nav item is UX only.

## Testing

Do not write tests in this intake task. When implementing later, add tests
in the same change as the behavior. Do not hit Microsoft or a real Python
process in tests. Mock the proxy.

Backend unit tests (service): import, conflict, distribution, tenant
isolation, embed, `503`. Proxy unit tests: URL/timeout parsing, OData
unwrap, API key header, unavailable Python. HTTP e2e: `401` / `403` and
response contracts.

Frontend: empty, error, and cards on `/portal/relatorios`; viewer loading,
error, retry, in-memory token, and 403 copy; admin nav hidden from
non-`Administrador`.

- AC-001: admin workspace/report/page lists go Nest → mocked Python with
  `X-API-Key`
- AC-002: import stores Python `datasetId`/`embedUrl`; duplicate
  workspace+report is `409`; client-supplied dataset/embed fields are ignored
- AC-003: name/description patch; activate immediate; deactivate requires UI
  confirm
- AC-004: distribute to an existing tenant; duplicate report+tenant `409`;
  inactive report `400`; picker uses `GET /api/v1/tenants`
- AC-005: distribution edit and status; UI confirm on deactivate
- AC-006: my-reports only token tenant; other tenant empty or embed `403`
- AC-007: embed-token payload; token not in storage; renew 2 minutes before
  expiry (minimum 30s)
- AC-008: `powerbi-client-react` config hides filters, shows page nav, hides
  status bar, fullscreen, `pageName` when set
- AC-009: non-admin admin APIs `403`; Power BI nav absent
- AC-010: missing env or mocked Python down → `503` without secrets
- AC-011: Compose and env examples include `powerbi`, `redis`, and
  `POWERBI_EMBEDDED_*`
- AC-012: listed global contracts updated in the approved delivery

Quality gate when implemented later, from the repo root, for touched
workspaces: `typecheck`, `lint`, `test`, `test:e2e`, `sdd:validate`,
`build`.

## Delivery

This specification is `implemented`. Evidence is recorded below. A named
human still has to confirm every `AC-###` before `validated`.

Branch name: `feature/portal-powerbi-embedded`

Suggested placement (conventions):

- Backend module `backend/src/modules/powerbi/` (controller, service, proxy,
  DTOs, entities) using existing portal auth guards
- Frontend routes `frontend/app/portal/relatorios/` and
  `frontend/app/portal/powerbi/`
- Sidebar updates in `frontend/components/layout/portal-shell.tsx`
- API client in `frontend/lib/api/client.ts`
- Migration under `backend/src/database/migrations/`
- Compose and env examples under `infrastructure/`

### Infrastructure

Add to `infrastructure/docker-compose.yml` on network `app`:

- `powerbi`: build `../ms-powerbi-embedded`, health check `GET /health`,
  Python `API_KEY` from the powerbi env file. Backend may `depends_on`
  `powerbi` healthy when operationally sensible.
- `redis`: token cache for Python (`REDIS_HOST` / `REDIS_PORT` as in
  `ms-powerbi-embedded`). Do not commit real secrets.

Env examples (placeholders only):

- `infrastructure/.env.backend.example` → `POWERBI_EMBEDDED_URL`,
  `POWERBI_EMBEDDED_API_KEY`, `POWERBI_EMBEDDED_TIMEOUT`
- `infrastructure/.env.powerbi.example` for Python (Azure app registration
  placeholders, Redis host, `API_KEY`). English comments. No real secrets.

Never commit real `.env` files. Never put client secrets in this
specification.

Do not rewrite Python except that Compose/env wiring. `allowEdit` remains
`false`. Redis remains Python's token cache.

### Durable decisions promoted in this delivery

- `docs/product.md`: portal routes `/portal/relatorios` and
  `/portal/powerbi`; Power BI integration via Nest and
  `ms-powerbi-embedded`; viewing is session-tenant even for
  `Administrador`; distribution is all-tenant
- `docs/design.md`: Relatórios and Power BI screens and nav; embed SDK
  packages as a documented exception; still no Lucide/Radix/shadcn
- `docs/api.md`, `openapi.yaml`, Swagger: `/api/v1/powerbi/*`; extend
  `GET /api/v1/tenants` purpose
- `docs/database.md`: the two tables
- `docs/architecture.md`: Nest → `ms-powerbi-embedded` → Power BI REST, plus
  Redis for Python token cache
- `docs/conventions.md`: `POWERBI_EMBEDDED_*` and `.env.powerbi`

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-20-portal-powerbi-embedded`
- Request: migrate Power BI Embedded product behavior from Medical Bills
  into the VETOR portal; source `tmp/medical-monorepo` (Power BI only);
  destination Python service `ms-powerbi-embedded`; do not rewrite, duplicate,
  or expose it to the browser
- Behavior sources read (not copied into this file): Medical
  `backend/src/powerbi/` (controller, service, proxy, DTOs, entities,
  SuperAdmin guard), `frontend/src/pages/PowerBiAdmin.tsx`,
  `RelatoriosPersonalizados.tsx`, `frontend/src/components/powerbi/`,
  `usePowerBiAdmin.ts`, `useMeusRelatorios.ts`, `usePowerBiEmbed.ts`,
  `frontend/src/test/powerbi.test.tsx`; destination `ms-powerbi-embedded/`
  routes, GenerateToken schema, Redis cache, `allowEdit: false`, API key
  middleware, Compose health `/health`
- Existing contracts consulted: listed in Context
- Id assignment: human resolved the duplicate with the profile draft; this
  specification is `VETOR-011` and the profile specification remains
  `VETOR-010`
- This specification does not approve itself

## Implementation evidence

- Changed: `backend/src/modules/powerbi/` (controller, service, proxy,
  DTOs, entities, unit tests),
  `backend/src/database/migrations/1760000002000-create-powerbi-tables.ts`,
  `backend/src/app.module.ts`, `backend/src/common/swagger/examples.ts`,
  `backend/test/powerbi.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`,
  `backend/test/openapi-contract.spec.ts`,
  `frontend/app/portal/relatorios/page.tsx`,
  `frontend/app/portal/powerbi/page.tsx`,
  `frontend/app/portal/powerbi/page.spec.tsx`,
  `frontend/components/layout/authenticated-portal.tsx`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/components/powerbi/powerbi-admin.tsx`,
  `frontend/components/powerbi/powerbi-embed-viewer.tsx`,
  `frontend/components/powerbi/relatorios-view.tsx`,
  `frontend/lib/api/client.ts`, `frontend/lib/powerbi-embed.ts`,
  `frontend/package.json`, `infrastructure/docker-compose.yml`,
  `infrastructure/.env.backend.example`,
  `infrastructure/.env.powerbi.example`, `docs/product.md`,
  `docs/design.md`, `docs/api.md`, `docs/database.md`,
  `docs/architecture.md`, `docs/conventions.md`, and `openapi.yaml`.
- Tests: `backend/src/modules/powerbi/powerbi.service.spec.ts`,
  `backend/src/modules/powerbi/powerbi-proxy.service.spec.ts`,
  `backend/test/powerbi.e2e-spec.ts`,
  `frontend/components/powerbi/relatorios-view.spec.tsx`,
  `frontend/components/powerbi/powerbi-embed-viewer.spec.tsx`,
  `frontend/components/powerbi/powerbi-admin.spec.tsx`,
  `frontend/app/portal/powerbi/page.spec.tsx`,
  `frontend/lib/powerbi-embed.spec.ts`.
- Commands: `npm run typecheck --workspace backend` passed;
  `npm run typecheck --workspace frontend` passed;
  `npm run lint --workspace backend` passed;
  `npm run lint --workspace frontend` passed;
  `npm run test --workspace backend` passed (83);
  `npm run test --workspace frontend` passed (76);
  `npm run test:e2e --workspace backend` passed (27);
  `npm run sdd:validate` passed (11 specifications);
  `npm run build` passed (`/`, `/portal`, `/portal/change-password`,
  `/portal/powerbi`, `/portal/relatorios`, `/manifest.webmanifest`);
  `npm run docker:config` passed.
- Limitations: `GET /api/v1` health still reports API, PostgreSQL, and SMTP
  only (Python is not a check). A non-`Administrador` who opens
  `/portal/powerbi` sees the portal shell with empty main content, hidden
  Power BI nav, and no admin API calls; the page does not redirect. Distribute
  requires tenant existence only; `GET /api/v1/tenants` is unfiltered by
  `status`, so an inactive tenant can still receive a distribution. Compose
  `backend` does not `depends_on` `powerbi` healthy so the portal can start
  without Azure secrets. Human validation of AC-001–AC-012 has not started.

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
