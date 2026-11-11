# API contract

This document records the durable HTTP contract exposed by the project.

Feature-specific endpoint changes start in an approved specification under
`docs/specs/`. Update this document in the same delivery when the specification
adds or changes a published endpoint, payload, response, error, or
authentication decision.

A published HTTP change is incomplete unless the same delivery also updates:

- this document
- the backend Swagger UI at `/api/docs`
- the versioned OpenAPI document at [`openapi.yaml`](../openapi.yaml)

## Relationship to specifications

- Read the approved feature specification before adding or changing an endpoint
  or API client.
- Record the feature's API delta in its specification before implementation.
- Keep this document as the consolidated contract after the change is approved.
- Keep Swagger and `openapi.yaml` aligned with this contract.

## Base URL

| Environment            | URL or decision         |
| ---------------------- | ----------------------- |
| Docker Compose backend | `http://localhost:3001` |
| Production API URL     | Deployment-specific     |
| Global API prefix      | `/api/v1`               |
| Swagger UI             | `/api/docs`             |
| OpenAPI document       | `/openapi.yaml`         |

When the configured public API host is loopback, the browser calls `/api/v1` on
the page origin and the Next.js server proxies those requests to the backend.
Docker Compose proxies them to `http://backend:3001`. A non-loopback public API
URL is called directly by the browser.

The backend enables the `/api/v1` prefix for product endpoints. Swagger UI is
served at `/api/docs` in development and production. Opening Swagger and the
backend-served OpenAPI document requires the existing portal access cookie.
Unauthenticated requests receive `401`. Try it out executes the real backend
operations.

## Conventions

- Format: JSON for documented API endpoints except `POST /api/v1/users`,
  `PATCH /api/v1/users/{id}`, `POST /api/v1/tenants`,
  `PUT /api/v1/tenants/{id}/photo`, `POST /api/v1/cards/{id}/attachments`,
  and `POST /api/v1/tickets/{id}/attachments`,
  which use `multipart/form-data`
- Dates: ISO 8601 when dates are exposed
- Identifiers: document the format for each resource
- Errors: document status codes, response shape, and client behavior per
  endpoint or shared error contract
- Swagger examples use non-production `example.com` placeholders, not live
  credentials or mailboxes

## Authentication

| Field                       | Decision                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Required routes             | `/auth/*` protected portal operations and `/api/docs`                                                      |
| Authentication scheme       | Short-lived JWT access token with rotated refresh token                                                    |
| Refresh or session behavior | HttpOnly, Secure production cookies with SameSite protection                                               |
| Rate limiting               | Backend throttling on contact, login, refresh, recovery, user create, embed-token, and Nest → Python proxy |
| Swagger                     | Existing access cookie; no Basic Auth or API key                                                           |

## Endpoints

| Method | Route                                                                  | Auth                                                                                     | Request                                                                                                                                 | Response                                                                                                                                                            | Errors                                   |
| ------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1`                                                              | Public                                                                                   | None                                                                                                                                    | Health statistics JSON                                                                                                                                              | `500`                                    |
| POST   | `/api/v1/contact`                                                      | Public                                                                                   | `customerName`, `customerEmail`, `projectDescription`                                                                                   | `204 No Content`                                                                                                                                                    | `400`, `429`, `503`                      |
| POST   | `/api/v1/auth/login`                                                | Public                                                                                   | `email`, `password`                                                                                                                     | Home tenant MFA on: `{ mfaRequired: true, challengeId, expiresAt }`, no cookies. Home tenant MFA off: safe user JSON plus `mfaRequired: false` and session cookies. | `400`, `401`, `429`, `503`               |
| POST   | `/api/v1/auth/mfa/verify`                                           | Public                                                                                   | `challengeId`, `token`                                                                                                                  | Safe user JSON and session cookies                                                                                                                                  | `400`, `401`, `403`, `429`               |
| POST   | `/api/v1/auth/mfa/resend`                                           | Public                                                                                   | `challengeId`                                                                                                                           | Replacement MFA challenge                                                                                                                                           | `400`, `401`, `429`, `503`               |
| POST   | `/api/v1/auth/mfa/cancel`                                           | Public                                                                                   | `challengeId`                                                                                                                           | `204 No Content`. Deletes that `mfa_email_challenges` row.                                                                                                          | `400`, `429`                             |
| POST   | `/api/v1/auth/refresh`                                              | Refresh cookie                                                                           | Refresh cookie                                                                                                                          | Rotated authenticated session                                                                                                                                       | `401`, `429`                             |
| POST   | `/api/v1/auth/logout`                                               | Authenticated                                                                            | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`                                    |
| GET    | `/api/v1/auth/session`                                                 | Access cookie                                                                            | None                                                                                                                                    | Safe authenticated user                                                                                                                                             | `401`                                    |
| PATCH  | `/api/v1/auth/session`                                                 | Administrador                                                                            | `{ tenantId }` UUID                                                                                                                     | Updated session JSON                                                                                                                                                | `400`, `401`, `403`                      |
| POST   | `/api/v1/auth/password-recovery/request`                            | Public                                                                                   | `email`                                                                                                                                 | Generic `202 Accepted`                                                                                                                                              | `400`, `429`                             |
| POST   | `/api/v1/auth/password-recovery/verify`                             | Public                                                                                   | `token`, optional `email`                                                                                                               | Reset challenge                                                                                                                                                     | `400`, `401`, `429`                      |
| POST   | `/api/v1/auth/password-recovery/reset`                              | Reset challenge                                                                          | `token`, `password`, `passwordConfirmation`, optional `email`                                                                           | `204 No Content`                                                                                                                                                    | `400`, `401`, `429`                      |
| GET    | `/api/v1/tenants`                                                      | Administrador; AdministradorTenant (own tenant); Usuario with `createUser`               | None                                                                                                                                    | Tenant `id`, `name`, `slug`                                                                                                                                         | `401`, `403`                             |
| POST   | `/api/v1/tenants`                                                      | Administrador only                                                                       | Multipart `{ name, slug, email?, photo? }`                                                                                              | `201` `{ id, name, slug, email }`                                                                                                                                   | `400`, `401`, `403`, `409`               |
| PUT    | `/api/v1/tenants/{id}/photo`                                           | Administrador only                                                                       | Multipart required `photo`                                                                                                              | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/tenants/{id}/photo`                                           | Access cookie; working session tenant equals `{id}`                                      | None                                                                                                                                    | Image bytes                                                                                                                                                         | `401`, `403`, `404`                      |
| GET    | `/api/v1/admin/tenant-settings`                                     | Administrador                                                                            | None                                                                                                                                    | `{ id, name, slug, mfaEnabled }[]` ordered by `name`                                                                                                                | `401`, `403`                             |
| PATCH  | `/api/v1/admin/tenant-settings/{tenantId}`                          | Administrador                                                                            | `{ mfaEnabled: boolean }`                                                                                                               | That tenant's `{ id, name, slug, mfaEnabled }`                                                                                                                      | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/admin/ai-pricing`                                             | Administrador                                                                            | None                                                                                                                                    | `{ aiTokenCostPerMillion }` in BRL, one value for every tenant                                                                                                      | `401`, `403`                             |
| PATCH  | `/api/v1/admin/ai-pricing`                                             | Administrador                                                                            | `{ aiTokenCostPerMillion: number }` from 0 to 999999, at most 4 decimal places                                                          | The same `{ aiTokenCostPerMillion }`, written onto every tenant                                                                                                     | `400`, `401`, `403`                      |
| GET    | `/api/v1/powerbi/workspaces`                                        | Administrador                                                                            | None                                                                                                                                    | Workspace list                                                                                                                                                      | `401`, `403`, `429`, `503`               |
| GET    | `/api/v1/powerbi/workspaces/{workspaceId}/reports`                  | Administrador                                                                            | None                                                                                                                                    | Report list                                                                                                                                                         | `401`, `403`, `429`, `503`               |
| GET    | `/api/v1/powerbi/workspaces/{workspaceId}/reports/{reportId}/pages` | Administrador                                                                            | None                                                                                                                                    | Page list                                                                                                                                                           | `401`, `403`, `429`, `503`               |
| GET    | `/api/v1/powerbi/relatorios`                                           | Administrador                                                                            | None                                                                                                                                    | Imported catalog                                                                                                                                                    | `401`, `403`                             |
| POST   | `/api/v1/powerbi/relatorios`                                        | Administrador                                                                            | `workspaceId`, `reportId`, `nome`, `descricao?`                                                                                         | Created catalog DTO                                                                                                                                                 | `400`, `401`, `403`, `409`, `429`, `503` |
| PATCH  | `/api/v1/powerbi/relatorios/{id}`                                   | Administrador                                                                            | `nome?`, `descricao?`                                                                                                                   | Updated catalog DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/powerbi/relatorios/{id}/status`                            | Administrador                                                                            | `ativo`                                                                                                                                 | Updated catalog DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/powerbi/relatorios/{id}/distribuicoes`                        | Administrador                                                                            | None                                                                                                                                    | Distribution DTOs                                                                                                                                                   | `401`, `403`, `404`                      |
| POST   | `/api/v1/powerbi/relatorios/{id}/distribuicoes`                     | Administrador                                                                            | `tenantId`, `nomeExibicao?`, `icone?`, `ordem?`, `paginaPadrao?`                                                                        | Created distribution DTO                                                                                                                                            | `400`, `401`, `403`, `404`, `409`        |
| PATCH  | `/api/v1/powerbi/distribuicoes/{id}`                                | Administrador                                                                            | `nomeExibicao?`, `icone?`, `ordem?`, `paginaPadrao?`                                                                                    | Updated distribution DTO                                                                                                                                            | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/powerbi/distribuicoes/{id}/status`                         | Administrador                                                                            | `ativo`                                                                                                                                 | Updated distribution DTO                                                                                                                                            | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/powerbi/meus-relatorios`                                   | Access cookie                                                                            | None                                                                                                                                    | Session-tenant report cards                                                                                                                                         | `401`                                    |
| POST   | `/api/v1/powerbi/meus-relatorios/{distribuicaoId}/embed-token`      | Access cookie                                                                            | None                                                                                                                                    | Embed URL, token, expiration                                                                                                                                        | `400`, `401`, `403`, `404`, `429`, `503` |
| GET    | `/api/v1/users`                                                        | Administrador; AdministradorTenant (own tenant); Usuario with `viewProjects` (assignees) | None                                                                                                                                    | User picker list                                                                                                                                                    | `401`, `403`                             |
| GET    | `/api/v1/users/{id}`                                                   | Administrador, AdministradorTenant (same tenant), or self                                | None                                                                                                                                    | Safe user profile plus `status`                                                                                                                                     | `401`, `403`, `404`                      |
| POST   | `/api/v1/users/{id}/reactivate`                                        | Administrador; AdministradorTenant (same tenant)                                         | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/users/{id}/password-reset-link`                               | Administrador; AdministradorTenant (home tenant, including self)                         | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`, `429`, `503` |
| GET    | `/api/v1/users/{id}/photo`                                             | Administrador, AdministradorTenant (same tenant), or self                                | None                                                                                                                                    | Image bytes                                                                                                                                                         | `401`, `403`, `404`                      |
| POST   | `/api/v1/users`                                                        | Administrador; AdministradorTenant (own tenant); Usuario with `createUser`               | Multipart create fields, optional `profile` `Administrador` or `AdministradorTenant`, optional `photo`                                  | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `429`               |
| PATCH  | `/api/v1/users/{id}`                                                   | Administrador; AdministradorTenant (tenant users); or self                               | Multipart registration, optional `enabledActions`, optional `profile` `Usuario`/`AdministradorTenant`/`Administrador`                   | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/users/{id}`                                                   | Administrador only                                                                       | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/project-workspaces`                                           | `viewProjects`                                                                           | None                                                                                                                                    | Workspace DTOs                                                                                                                                                      | `401`, `403`                             |
| POST   | `/api/v1/project-workspaces`                                        | Administrador or AdministradorTenant                                                     | `{ name }`                                                                                                                              | Created workspace DTO                                                                                                                                               | `400`, `401`, `403`                      |
| PATCH  | `/api/v1/project-workspaces/{id}`                                      | Administrador or AdministradorTenant                                                     | `{ name }`                                                                                                                              | Updated workspace DTO                                                                                                                                               | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/project-workspaces/{id}`                                   | Administrador or AdministradorTenant                                                     | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| GET    | `/api/v1/project-workspaces/{workspaceId}/projects`                    | `viewProjects`                                                                           | None                                                                                                                                    | Project summaries                                                                                                                                                   | `401`, `403`, `404`                      |
| POST   | `/api/v1/project-workspaces/{workspaceId}/projects`                 | Administrador or AdministradorTenant                                                     | `{ name }`                                                                                                                              | Created project DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/projects/{id}`                                                | `viewProjects`                                                                           | None                                                                                                                                    | Board plus `backgroundUrl`, `kanbanFilters`, document tree, cards with `createdAt`, tag objects, cover, checklist, assignee photo                                   | `401`, `403`, `404`                      |
| PATCH  | `/api/v1/projects/{id}`                                                | Administrador or AdministradorTenant                                                     | `{ name?, kanbanFilters?, kanbanLanes? }` with at least one                                                                             | Updated project DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/projects/{id}`                                             | Administrador or AdministradorTenant                                                     | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| GET    | `/api/v1/finance/projects`                                          | Administrador                                                                            | None                                                                                                                                    | Every tenant's projects with contract, amounts, and totals. `paidAmountCents` sums installments with `dueOn` on or before the America/Sao_Paulo date. `openAmountCents` is the contract total minus that sum. `resultAmountCents` is that sum minus cost. `project_payments` is excluded | `401`, `403`                             |
| GET    | `/api/v1/finance/projects/{projectId}/documents`                       | Administrador                                                                            | None                                                                                                                                    | Private finance document DTOs for the project                                                                                                                       | `401`, `403`, `404`                      |
| POST   | `/api/v1/finance/projects/{projectId}/documents`                    | Administrador                                                                            | Multipart `file`, one allowlisted business document, max 25 MiB                                                                         | `201` private finance document DTO                                                                                                                                  | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/finance/projects/{projectId}/documents/{documentId}`       | Administrador                                                                            | None                                                                                                                                    | Authenticated document bytes with attachment disposition                                                                                                            | `401`, `403`, `404`                      |
| DELETE | `/api/v1/finance/projects/{projectId}`                              | Administrador                                                                            | None                                                                                                                                    | `204 No Content`. Deletes that project in any tenant, including its cards and finance                                                                               | `401`, `403`, `404`                      |
| GET    | `/api/v1/finance/tenants/{tenantId}/notes`                             | Administrador                                                                            | None                                                                                                                                    | Decrypted tenant notes (`id`, `title`, `body`, `updatedAt`), newest first. Max 50 notes per tenant                                                                  | `401`, `403`, `404`, `503`               |
| POST   | `/api/v1/finance/tenants/{tenantId}/notes`                          | Administrador                                                                            | `{ title, body }`                                                                                                                       | `201` note DTO. Title 1–120, body 1–4000. Stored AES-256-GCM. Rejects a 51st note with `400`                                                                        | `400`, `401`, `403`, `404`, `503`        |
| PATCH  | `/api/v1/finance/tenants/{tenantId}/notes/{noteId}`                    | Administrador                                                                            | `{ title, body }`                                                                                                                       | Updated note DTO. Note must belong to that tenant                                                                                                                   | `400`, `401`, `403`, `404`, `503`        |
| DELETE | `/api/v1/finance/tenants/{tenantId}/notes/{noteId}`                 | Administrador                                                                            | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`, `503`               |
| GET    | `/api/v1/projects/{id}/finance`                                     | Administrador                                                                            | None                                                                                                                                    | Project finance plus payments, ordered cost lines, and installments `{ position, amountCents, dueOn }`. Paid, open, and result use the same due-date sum as the list | `401`, `403`, `404`                      |
| PUT    | `/api/v1/projects/{id}/contract`                                    | Administrador                                                                            | Contract JSON, including `installmentCount` 1 through 120 and `installments` of the same length. Each installment is `{ amountCents, dueOn }`. `dueOn` is `YYYY-MM-DD` or null | Contract DTO plus installments with `position`, `amountCents`, and `dueOn`                                                                                         | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/projects/{id}/contract/file`                                  | Administrador                                                                            | multipart PDF, max 10 MB. A successful upload also stores that PDF as a finance project document                                        | `{ hasFile, originalName }`                                                                                                                                         | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/projects/{id}/contract/file`                                  | Administrador                                                                            | None                                                                                                                                    | PDF bytes                                                                                                                                                           | `401`, `403`, `404`                      |
| DELETE | `/api/v1/projects/{id}/contract/file`                               | Administrador                                                                            | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/projects/{id}/payments`                                    | Administrador                                                                            | `{ paidOn, amountCents, note? }`                                                                                                        | `201` payment DTO                                                                                                                                                   | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/projects/{id}/payments/{paymentId}`                           | Administrador                                                                            | `{ paidOn, amountCents, note? }`                                                                                                        | Payment DTO                                                                                                                                                         | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/projects/{id}/payments/{paymentId}`                        | Administrador                                                                            | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/projects/{id}/costs`                                       | Administrador                                                                            | `{ incurredOn, amountCents, category, label?, note? }`                                                                                  | `201` cost DTO. Omitted `label` stores the category name                                                                                                            | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/projects/{id}/costs/{costId}`                                 | Administrador                                                                            | `{ incurredOn, amountCents, category, label?, note? }`                                                                                  | Cost DTO                                                                                                                                                            | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/projects/{id}/costs/{costId}`                              | Administrador                                                                            | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| PUT    | `/api/v1/projects/{id}/cost-lines`                                  | Administrador                                                                            | `{ lines: [{ label, amountCents }] }`, 0 through 500 lines                                                                              | Cost DTO array in form order. Empty `lines` clears the project cost                                                                                                 | `400`, `401`, `403`, `404`               |
| PUT    | `/api/v1/projects/{id}/background`                                     | AdministradorTenant only                                                                 | multipart JPEG/PNG/WEBP, max 8 MB                                                                                                       | `{ backgroundUrl }`                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/projects/{id}/background`                                     | AdministradorTenant only                                                                 | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| GET    | `/api/v1/projects/{id}/background`                                  | `viewProjects`                                                                           | None                                                                                                                                    | Image bytes                                                                                                                                                         | `401`, `403`, `404`                      |
| POST   | `/api/v1/projects/{id}/documents`                                   | `viewProjects`                                                                           | JSON folder `{ kind, name, parentId? }` or multipart files with `relativePaths`                                                         | Created node DTO or array                                                                                                                                           | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/projects/{id}/documents/{documentId}`                         | `viewProjects`                                                                           | None                                                                                                                                    | File bytes                                                                                                                                                          | `401`, `403`, `404`                      |
| GET    | `/api/v1/projects/{id}/documents/{documentId}/archive`              | `viewProjects`                                                                           | None                                                                                                                                    | Zip stream of a folder                                                                                                                                              | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/projects/{id}/documents/{documentId}`                         | `viewProjects`                                                                           | `{ name?, parentId? }`                                                                                                                  | Updated node DTO                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/projects/{id}/documents/{documentId}`                      | `viewProjects`                                                                           | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/projects/{id}/cards`                                       | `viewProjects`                                                                           | title, description; optional assigneeUserId, startsAt, dueAt, priority, tags as `{ name, color }[]`                                     | Created card DTO                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/cards/{id}`                                                   | `viewProjects`                                                                           | Writable card fields, tag objects, optional `coverAttachmentId`                                                                         | Updated card DTO                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/cards/{id}`                                                | `viewProjects`                                                                           | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/cards/{id}/move`                                           | `moveCards`                                                                              | `{ lane }`                                                                                                                              | Updated card DTO                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/cards/{id}/place`                                          | `moveCards`                                                                              | `{ lane, position }`                                                                                                                    | Updated card DTO                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/cards/{id}/reorder`                                        | `moveCards`                                                                              | `{ direction: up \| down }`                                                                                                             | Updated order                                                                                                                                                       | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/cards/{id}/comments`                                       | `viewProjects`                                                                           | `{ body }`                                                                                                                              | Created comment DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/cards/{id}/comments/{commentId}`                              | `viewProjects`                                                                           | `{ body }`                                                                                                                              | Updated comment DTO                                                                                                                                                 | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/cards/{id}/comments/{commentId}`                           | `viewProjects`                                                                           | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/cards/{id}/checklist-items`                                | `viewProjects`                                                                           | `{ body }` 1–200 characters, max 50 items                                                                                               | Item DTO                                                                                                                                                            | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/cards/{id}/checklist-items/{itemId}`                          | `viewProjects`                                                                           | `{ body?, done? }`                                                                                                                      | Item DTO                                                                                                                                                            | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/cards/{id}/checklist-items/{itemId}`                       | `viewProjects`                                                                           | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/cards/{id}/attachments`                                    | `viewProjects`                                                                           | multipart allowlisted file, max 5 MB, max 10 per card                                                                                   | Attachment DTO with `createdBy*`                                                                                                                                    | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/cards/{id}/attachments/{attachmentId}`                        | `viewProjects`                                                                           | None                                                                                                                                    | File bytes                                                                                                                                                          | `401`, `403`, `404`                      |
| DELETE | `/api/v1/cards/{id}/attachments/{attachmentId}`                     | `viewProjects`                                                                           | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/tickets`                                                      | `Usuario` or `AdministradorTenant`                                                       | `{ title, category, description, priority? }`                                                                                           | `201` `{ message, ticket }`                                                                                                                                         | `400`, `401`, `403`                      |
| GET    | `/api/v1/tickets`                                                   | Cliente or Empresa in the effective tenant                                               | Query `status?`, `category?`, `tenantId?`, `page?`, `limit?`                                                                            | `{ items, page, limit, total }`                                                                                                                                     | `400`, `401`, `403`                      |
| GET    | `/api/v1/tickets/{id}`                                                 | Cliente or Empresa with access to the ticket tenant                                      | None                                                                                                                                    | Ticket detail DTO                                                                                                                                                   | `401`, `403`, `404`                      |
| PATCH  | `/api/v1/tickets/{id}`                                              | `Administrador` in the active session tenant                                             | `{ status }`                                                                                                                            | `{ message, ticket }`                                                                                                                                               | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/tickets/{id}/comments`                                     | Cliente or Empresa with access to the ticket tenant                                      | `{ body }`                                                                                                                              | `201` `{ message, comment }`                                                                                                                                        | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/tickets/{id}/read`                                         | Cliente or Empresa with access to the ticket tenant                                      | Empty JSON object                                                                                                                       | `204 No Content`                                                                                                                                                    | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/tickets/{id}/attachments`                                  | Cliente or Empresa with access to the ticket tenant                                      | multipart allowlisted file, max 5 MB, max 10 per ticket                                                                                 | Attachment DTO. URL is `/api/v1/tickets/{id}/attachments/{attachmentId}`                                                                                            | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/tickets/{id}/attachments/{attachmentId}`                   | Cliente or Empresa with access to the ticket tenant                                      | None                                                                                                                                    | File bytes                                                                                                                                                          | `401`, `403`, `404`                      |
| GET    | `/api/v1/expenses`                                                     | `Administrador`                                                                          | Query `competence`, `categoryId`, `subcategoryId`, `status`, `supplier`, `type`, `projectId`, `q`, `page`, `limit`, `sort`, `direction` | `{ items, page, limit, total, summary }`                                                                                                                            | `400`, `401`, `403`                      |
| POST   | `/api/v1/expenses`                                                  | `Administrador`                                                                          | One-off body or `{ recurrence: { interval, count, startsOn } }`                                                                         | `201` detail, or `{ seriesId, generatedCount, firstExpenseId }`                                                                                                     | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/expenses/associations`                                     | `Administrador`                                                                          | None                                                                                                                                    | `{ tenants, projects }`                                                                                                                                             | `401`, `403`                             |
| POST   | `/api/v1/expenses/cancel`                                           | `Administrador`                                                                          | `{ ids }` 1 through 100                                                                                                                 | `{ cancelledIds, alreadyCancelledIds }`                                                                                                                             | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/expenses/{id}`                                                | `Administrador`                                                                          | None                                                                                                                                    | Expense detail with notes and documents                                                                                                                             | `401`, `403`, `404`                      |
| PATCH  | `/api/v1/expenses/{id}`                                             | `Administrador`                                                                          | Partial body. A followed series requires `scope` `occurrence` or `series`                                                               | Expense detail                                                                                                                                                      | `400`, `401`, `403`, `404`               |
| POST   | `/api/v1/expenses/{id}/cancel`                                      | `Administrador`                                                                          | None                                                                                                                                    | Expense detail                                                                                                                                                      | `401`, `403`, `404`                      |
| POST   | `/api/v1/expenses/{id}/documents`                                   | `Administrador`                                                                          | multipart finance-document file, max 25 MB, max 20 files and 100 MB per expense                                                         | Document metadata without a storage path                                                                                                                            | `400`, `401`, `403`, `404`               |
| GET    | `/api/v1/expenses/{id}/documents/{documentId}`                         | `Administrador`                                                                          | None                                                                                                                                    | File bytes                                                                                                                                                          | `401`, `403`, `404`                      |
| DELETE | `/api/v1/expenses/{id}/documents/{documentId}`                      | `Administrador`                                                                          | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`                      |
| GET    | `/api/v1/expense-categories`                                           | `Administrador`                                                                          | None                                                                                                                                    | Category tree                                                                                                                                                       | `401`, `403`                             |
| POST   | `/api/v1/expense-categories`                                        | `Administrador`                                                                          | `{ name }`                                                                                                                              | `201` category                                                                                                                                                      | `400`, `401`, `403`                      |
| PATCH  | `/api/v1/expense-categories/{id}`                                      | `Administrador`                                                                          | `{ name?, active? }`                                                                                                                    | Category                                                                                                                                                            | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/expense-categories/{id}`                                   | `Administrador`                                                                          | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`, `409`               |
| POST   | `/api/v1/expense-categories/{id}/subcategories`                     | `Administrador`                                                                          | `{ name }`                                                                                                                              | `201` subcategory                                                                                                                                                   | `400`, `401`, `403`, `404`               |
| PATCH  | `/api/v1/expense-subcategories/{id}`                                   | `Administrador`                                                                          | `{ name?, active? }`                                                                                                                    | Subcategory                                                                                                                                                         | `400`, `401`, `403`, `404`               |
| DELETE | `/api/v1/expense-subcategories/{id}`                                | `Administrador`                                                                          | None                                                                                                                                    | `204 No Content`                                                                                                                                                    | `401`, `403`, `404`, `409`               |
| POST   | `/api/v1/expense-series/{id}/cancel`                                | `Administrador`                                                                          | None                                                                                                                                    | `{ cancelledCount }`                                                                                                                                                | `401`, `403`, `404`                      |
| GET    | `/api/v1/ai/pricing`                                                   | `vetorAgent`                                                                             | None                                                                                                                                    | `{ tokenCostPerMillion, usageCost }` in BRL. `usageCost` sums the caller's succeeded prompts.                                                                       | `401`, `403`                             |
| POST   | `/api/v1/ai/conversations`                                             | `vetorAgent`                                                                             | Empty JSON object                                                                                                                       | `201` `{ id, createdAt, updatedAt }`                                                                                                                                | `400`, `401`, `403`, `429`               |
| GET    | `/api/v1/ai/conversations`                                          | `vetorAgent`                                                                             | Query `page`, `limit`                                                                                                                   | Owner conversations with a preview                                                                                                                                  | `400`, `401`, `403`                      |
| GET    | `/api/v1/ai/conversations/{conversationId}/messages`                   | `vetorAgent`                                                                             | None                                                                                                                                    | Owner messages in sequence order. Each item includes `attachments` of `{ id, originalName, mimeType }` bound to that message. Paths are omitted.                    | `401`, `403`, `404`                      |
| POST   | `/api/v1/ai/conversations/{conversationId}/messages`                | `vetorAgent`                                                                             | `{ content }`, optional `Idempotency-Key`                                                                                               | `202` `{ runId, conversationId, messageId, status }`                                                                                                                | `400`, `401`, `403`, `404`, `409`, `429` |
| GET    | `/api/v1/ai/conversations/{conversationId}/attachments/{attachmentId}` | `vetorAgent`                                                                             | None                                                                                                                                    | Owned attachment bytes after the file is bound to a message. Missing, expired, or unbound files are `404`.                                                          | `401`, `403`, `404`                      |
| GET    | `/api/v1/ai/runs/{runId}`                                           | `vetorAgent`                                                                             | None                                                                                                                                    | Owned run status. Assistant content only after success                                                                                                              | `401`, `403`, `404`                      |
| GET    | `/api/v1/ai/runs/{runId}/events`                                    | `vetorAgent`                                                                             | Optional `Last-Event-ID`. Replay is disabled                                                                                            | `text/event-stream` for the owned run                                                                                                                               | `401`, `403`, `404`, `429`               |

## Endpoint details

### `GET /api/v1`

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Method         | `GET`                                                |
| Route          | `/api/v1`                                            |
| Authentication | Public                                               |
| Purpose        | Report solution health for API, PostgreSQL, and SMTP |

**Response:** JSON object with `status` (`healthy` or `unhealthy`) and
`checks.api`, `checks.database`, and `checks.smtp` each with `status`
(`up` or `down`). `200` when every check is `up`. `500` when any check is
`down`. The `500` body uses the same JSON shape. The response omits secrets,
hostnames, stack traces, and connection strings. SMTP is verified without
sending mail.

### `POST /api/v1/contact`

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Method         | `POST`                                        |
| Route          | `/api/v1/contact`                             |
| Authentication | Public                                        |
| Purpose        | Send a non-persisted project inquiry by email |

**Request:** JSON object with `customerName`, `customerEmail`, and
`projectDescription`.

**Response:** `204 No Content`.

**Errors and side effects:** `400` for invalid DTO input, `429` for rate
limiting, `503` for an email-delivery failure. The backend sends one email to
the `FORM_CONTACT` environment value and does not persist the inquiry.

### Authentication endpoints

`/auth/login`, `/auth/mfa/verify`, `/auth/mfa/resend`, `/auth/mfa/cancel`,
`/auth/refresh`, and
`/auth/logout` use secure backend-managed cookies. Login accepts `email` and
`password`. A correct password for exactly one active account reads
`tenants.mfa_enabled` for `users.tenant_id`. When that flag is true, or the
home tenant row is missing, login returns
`{ mfaRequired: true, challengeId, expiresAt }`, emails a digit code, and
does not set cookies. When the flag is false, login returns the safe user
JSON plus `mfaRequired: false`, sets the session cookies, and does not email
a code or create a challenge. `mfa_enabled` is not added to
`GET /api/v1/tenants`, the session JSON, or the access token. A password that matches more than one active
account is the same generic `401` and sends no email. If the digit count is not configured, or the email
cannot be sent, login returns `503`, sends no email, and returns no
`challengeId`. `POST /api/v1/auth/mfa/verify` accepts that code and
only then sets `access_token` and `refresh_token`. Surrounding whitespace
is removed before the digit check. The portal field keeps only digits. The access token and the
JSON session payload include `id`, `email`, `profile`, first name, last
name, age, sex, photo URL, `tenantId`, tenant `name`, tenant `slug`, and
`enabledActions` (`painel`, `viewReports`, `createUser`, `editUser`, `viewProjects`,
`manageProjects`, `moveCards`, `createLane`, `renameLane`, `deleteLane`, `createTenant`, `vetorAgent`). The session JSON also includes
`tenantPhotoUrl` for the working tenant. The access token does not. `profile` is `Administrador`,
`AdministradorTenant`, or `Usuario`. The login session JSON does not include
`status`. After an `Administrador` tenant
switch, `tenantId` is the working session tenant.
The photo URL is an API-served path for an uploaded image, or
`/brand/symbol-vetor.png` for the bootstrap administrator until that user
uploads an image. `tenantPhotoUrl` is `/api/v1/tenants/{tenantId}/photo` when
that working tenant has a stored photo pointer, and an empty string otherwise. Passwords, hashes, reset tokens, MFA codes, and tenant filesystem paths
are omitted. The
access token expires after 15 minutes. The refresh token expires after seven
days, rotates on use, and is revoked on logout, password reset, or an MFA
block. A completed MFA login revokes the refresh session presented with
that request when the cookie belongs to the same user, then writes the new
cookies. Opening the login page does not revoke a session. A refresh cookie
for another user is left in place. Cookies stay HttpOnly, `Secure` in production, `SameSite=Lax`,
`Path=/`, and without a `Domain`. `MFA_EMAIL_TOKEN_EXPIRES_IN` defaults to
`30m`. The digit count is read from `MFA_EMAIL_TOKEN_DIGITS` and is not a
public frontend value. Login is rate-limited per IP and e-mail. MFA verify,
resend, and cancel use the same limit and are counted per IP and
`challengeId`.
CORS is an explicit list and includes `http://localhost:3000`,
`http://vps2.com.br:3000`, `http://app.vps2.com.br:3000`,
`https://portal.vps2.com.br`, `https://vps2.com.br`, and
`https://app.vps2.com.br`. A `*` entry is dropped.

`POST /api/v1/auth/mfa/cancel` deletes that `mfa_email_challenges` row and
returns `204` with an empty body. An unknown, used, or already deleted
`challengeId` is also `204`. Cancel sends no e-mail, writes no cookies, and
does not change `users.status`. Other challenges for that user stay.

`POST /api/v1/auth/mfa/resend` emails a new code only after `expiresAt`. A
challenge still inside its lifetime is `400`. An unknown challenge, a used
challenge, or a user who is not `active` is `401`. If the replacement email
fails, or the digit count is not configured, the response is `503`, no new
`challengeId` is returned, and the expired challenge is released so it stays
unused. The third wrong code
inside the lifetime is `403`, sets `users.status` to `blocked`, and creates
no session. `POST /api/v1/users/{id}/reactivate` sets `blocked` back to
`active` with `204`. `Administrador` may reactivate any user.
`AdministradorTenant` may reactivate only a user of their tenant. `Usuario`
is `403`. A target that is not `blocked` is `400`. A missing user is `404`.

### Password recovery endpoints

Password recovery always returns generic account-independent messages. The
single-use reset token is hashed at rest and expires according to
`PASSWORD_RESET_TOKEN_EXPIRES_IN`, defaulting to 15 minutes. The recovery
e-mail tells the reader to enter that token on the login page through
`Esqueci minha senha`. Successful reset
revokes active refresh sessions and sends a confirmation email. Create-user
password-change links and `Editar usuário` reset links submit `token`,
`password`, and `passwordConfirmation` without email. The reset link from
`POST /api/v1/users/{id}/password-reset-link` expires after 30 minutes
(`ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN`). Public recovery stays on
`PASSWORD_RESET_TOKEN_EXPIRES_IN`. New passwords require at least 6
characters, including a letter, a number, and a special character.

### `GET /api/v1/tenants`

| Field          | Value                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Method         | `GET`                                                                                                                             |
| Route          | `/api/v1/tenants`                                                                        |
| Authentication | Access cookie. `Administrador`, `AdministradorTenant` (own tenant only), or `Usuario` with `createUser`, loaded from the database |
| Purpose        | List tenants for user registration, the `Perfil` picker, Projetos tenant selection, and Power BI distribution                     |

**Response:** `200` JSON array of `{ id, name, slug }`. `AdministradorTenant`
receives only their home tenant.

**Errors:** `401` unauthenticated, `403` unless `Administrador`,
`AdministradorTenant`, or `Usuario` with `createUser`.

### `POST /api/v1/tenants`

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                   |
| Route          | `/api/v1/tenants`                                                                        |
| Authentication | Access cookie. `Administrador` only, loaded from the database                            |
| Purpose        | Register a tenant with unique `name`, unique `slug`, and optional unique contact `email` |

**Request:** `multipart/form-data` with `name`, `slug`, optional `email`, and
optional `photo`. `name` is required, max 160. `slug` is required, max 80,
filled by the caller. `email` is optional tenant contact (not a user login);
when present it must be a valid email, max 255. Omit or empty when unused.
`photo` is one raster image, maximum 5 MB. SVG is rejected. The client must
not send `id` or `status`. Extra properties are `400`. The backend sets
`status` to `active`.

**Response:** `201` JSON `{ id, name, slug, email }`. `email` is `null` when
omitted. The body has no filesystem path and no image bytes. A successful
insert creates `infrastructure/repository/files/{tenantId}`. When `photo` is
present, the file is stored in that folder and `tenants.photo_url` stores
only `{tenantId}.{extension}`. Create does not insert a user and does not
send mail.

**Errors:** `400` missing/blank `name` or `slug`, `name` longer than 160,
`slug` longer than 80, `email` present but invalid or longer than 255, or
`photo` present but not a raster image of at most 5 MB. An invalid photo is
rejected before the tenant row is inserted. `401` unauthenticated. `403`
unless `Administrador` (`AdministradorTenant` and `Usuario` are `403` even
with `createTenant` in `enabledActions`). `409` when another tenant already
has that `name`, `slug`, or non-empty `email`. Empty optional emails do not
collide. A refused create does not create a folder or a photo file. There
is no general tenant `PATCH` / `DELETE` route.

`GET /api/v1/tenants` does not include `email` or a photo field.

### `PUT /api/v1/tenants/{id}/photo`

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Method         | `PUT`                                                                   |
| Route          | `/api/v1/tenants/{id}/photo`                                                                                                   |
| Authentication | Access cookie. `Administrador` only, loaded from the database           |
| Purpose        | Replace the photo of an existing tenant, including the bootstrap tenant |

**Request:** `multipart/form-data` with required `photo`. The file follows
the same raster rules as create: one file, maximum 5 MB, SVG rejected.
`name`, `slug`, `email`, and `status` are not accepted.

**Response:** `204 No Content`. The previous file is deleted only after the
new file is stored and the pointer is saved, and only when the new pointer
differs.

**Errors:** `400` when `photo` is missing or invalid; the previous pointer
and file stay. `401` unauthenticated. `403` unless `Administrador`. `404`
when the tenant id does not exist.

### `DELETE /api/v1/tenants/{id}/photo`

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Method         | `DELETE`                                                      |
| Route          | `/api/v1/tenants/{id}/photo`                                                                                                   |
| Authentication | Access cookie. `Administrador` only, loaded from the database |
| Purpose        | Remove the stored photo for an existing tenant                |

**Response:** `204 No Content`. Clears `photo_url` and deletes the stored
file when a pointer exists.

**Errors:** `401` unauthenticated. `403` unless `Administrador`. `404`
when the tenant id does not exist.

### `GET /api/v1/tenants/{id}/photo`

| Field          | Value                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Method         | `GET`                                                                                                                          |
| Route          | `/api/v1/tenants/{id}/photo`                                                                                                   |
| Authentication | Access cookie. `Administrador` may read any tenant. Other profiles may read only when `{id}` equals the working session tenant |
| Purpose        | Serve a tenant photo. Folder paths are not returned. The route is not public.                                                  |

**Response:** `200` image bytes. Headers are `Cache-Control: private, no-store`,
`X-Content-Type-Options: nosniff`, and `Cross-Origin-Resource-Policy: cross-origin`.

**Errors:** `401` unauthenticated. `403` when the caller is not
`Administrador` and `{id}` is not the working session tenant. `404` when
that tenant has no stored photo.

### Power BI Embedded

Browser clients call only Nest `/api/v1/powerbi/*` with the existing portal
access cookie. Nest proxies selected routes to `ms-powerbi-embedded` with
`X-API-Key`. The browser never receives `POWERBI_EMBEDDED_URL` or the API
key. GenerateToken sends `dataset_ids` and `report_ids` only.

`GET /api/v1/powerbi/meus-relatorios` returns active distributions for the
access-token `tenantId`. The list DTO includes distribution `id`,
`nomeExibicao`, `icone`, `ordem`, `paginaPadrao`, `tenantId`, and nested
`relatorio` `{ id, nome, descricao }`. It omits `embedToken`, `datasetId`,
and `embedUrl`.

`POST /api/v1/powerbi/meus-relatorios/{distribuicaoId}/embed-token` returns
`{ id, nome, embedUrl, embedToken, expiration, paginaPadrao }`. A
distribution that belongs to another tenant is `403`. Missing rows are
`404`. Inactive report or distribution is `400`. Python down or missing
`POWERBI_EMBEDDED_URL` / `POWERBI_EMBEDDED_API_KEY` is `503` with one of:
report service is not configured; report service is temporarily
unavailable; failed to communicate with the report service. Bodies and logs
omit stack traces, API keys, embed tokens, and Microsoft secrets.

Duplicate `(workspaceId, reportId)` on import and duplicate
`(relatorioId, tenantId)` on distribute are `409`. Distributing an inactive
report or an unknown tenant is `400`.

Embed-token is limited to 30 requests / 15 minutes
(`POWERBI_EMBED_TOKEN_RATE_LIMIT_*`). Nest → Python proxy routes
(workspaces, reports, pages, and import) are limited to 60 requests / 15
minutes (`POWERBI_PROXY_RATE_LIMIT_*`). Limits are keyed by client IP, matching
other authenticated portal throttles.

### `POST /api/v1/users`

| Field          | Value                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                                                       |
| Route          | `/api/v1/users`                                                                                                                                  |
| Authentication | Access cookie. `Administrador`, `AdministradorTenant` (own tenant), or `Usuario` with `createUser`, loaded from the database |
| Purpose        | Register a portal user on a required tenant                                                                                  |

**Request:** `multipart/form-data` with `tenantId`, `firstName`, `lastName`,
optional `cargo` (maximum 160 characters),
`age`, `sex` (`M`, `F`, or `O`), `email`, `password` (minimum 6
characters, including a letter, a number, and a special character), optional `enabledActions`, optional `profile`
(`AdministradorTenant`, `Administrador` only), and optional `photo`.
`enabledActions` is a JSON array of `painel`, `viewReports`, `createUser`, `editUser`,
`viewProjects`, `manageProjects`, `moveCards`, `createLane`, `renameLane`, `deleteLane`, `createTenant`, and/or `vetorAgent`. An empty array is
allowed. `photo` must be a raster image and at most 5 MB. Create
succeeds without a photo. `AdministradorTenant` body `tenantId` must be
their home tenant.

**Response:** `204 No Content`. The password is hashed with bcrypt cost 12
and is not returned.

**Errors and side effects:** `400` for invalid input, including a missing or
unknown tenant, `sex` outside `M`/`F`/`O`, unknown `enabledActions` values, a
non-image photo, or a photo larger than 5 MB. `401` unauthenticated. `403`
unless `Administrador`, `AdministradorTenant`, or `Usuario` with
`createUser`. `429` rate limit. After a successful create, the backend
stores a hashed single-use reset token and sends `Altere a senha` with
`{CORS origin}/portal/change-password?token={token}`. The created profile
is `Usuario` unless `Administrador` sends `profile` `AdministradorTenant` or `Administrador`.
Grants in `enabledActions` add to that profile. When an image is stored, the
file is written under `infrastructure/repository/files/{tenantId}` and
PostgreSQL keeps only a filename pointer.

### `GET /api/v1/users`

| Field          | Value                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Method         | `GET`                                                                                                                                            |
| Route          | `/api/v1/users`                                                                                                                                  |
| Authentication | Access cookie. `Administrador` (all users), `AdministradorTenant` (home tenant), or `Usuario` with `viewProjects` (assignees of the home tenant) |
| Purpose        | List users for the edit-modal, `Perfil` pickers, and card assignees                                                                              |

**Response:** `200` JSON array of `{ id, firstName, lastName, cargo, email,
tenantId, tenantName, tenantSlug, profile, status, enabledActions }`. Email
filtering after three typed characters runs in the client. Passwords,
hashes, and filesystem paths are omitted.

**Errors:** `401` unauthenticated, `403` when the actor cannot list users.

### `GET /api/v1/users/{id}`

| Field          | Value                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Method         | `GET`                                                                                                           |
| Route          | `/api/v1/users/{id}`                                                                                                                                                                                                                                                                                  |
| Authentication | Access cookie. `Administrador`, `AdministradorTenant` for the same tenant, or the authenticated user themselves |
| Purpose        | Load the safe user including `enabledActions` and `status` for edit and `Perfil`                                |

**Response:** `200` JSON safe user plus `status`. Login session JSON does not
include `status`.

**Errors:** `401` unauthenticated, `403` another user's record without
authority, `404` unknown id.

### `GET /api/v1/users/{id}/photo`

| Field          | Value                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Method         | `GET`                                                                                                           |
| Route          | `/api/v1/users/{id}/photo`                                                                                      |
| Authentication | Access cookie. `Administrador`, `AdministradorTenant` for the same tenant, or the authenticated user themselves |
| Purpose        | Serve an uploaded image. Folder paths are not returned.                                                         |

**Errors:** `401`, `403`, `404` when the user has no uploaded photo.

### `POST /api/v1/users/{id}/reactivate`

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                  |
| Route          | `/api/v1/users/{id}/reactivate`                                                         |
| Authentication | Access cookie. `Administrador`, or `AdministradorTenant` for a user of their own tenant |
| Purpose        | Set `status` from `blocked` to `active` without changing profile, password, or tenant   |

**Response:** `204 No Content`.

**Errors:** `400` when the user is not `blocked`, `401` unauthenticated,
`403` for `Usuario` or another tenant, `404` when the user id does not exist.

### `POST /api/v1/users/{id}/password-reset-link`

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                |
| Route          | `/api/v1/users/{id}/password-reset-link`                                              |
| Authentication | Access cookie. Actor is `active` and `Administrador` or `AdministradorTenant`         |
| Purpose        | Email one 30-minute password-change link to the selected active user's stored address |

**Request:** empty body. Unknown properties are rejected.

**Response:** `204 No Content`. The token and the link are omitted.

**Authorization:** `Administrador` may target any active user, including
themselves. `AdministradorTenant` may target any active user of their home
tenant, including themselves and an `Administrador` on that tenant.
`Usuario` is `403`.

**Side effects:** stores a SHA-256 hash in `password_reset_tokens` with
`expires_at` 30 minutes ahead (`ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN`,
default `30m`). Marks older unused tokens for that user as used. Email
subject `Altere a senha` with the sentence `Altere a senha pelo link abaixo.
O link expira em 30 minutos. Depois que a senha é alterada, o mesmo link
deixa de valer.` and `{CORS origin}/portal/change-password?token={token}`.
Completion stays on `POST /api/v1/auth/password-recovery/verify` and
`POST /api/v1/auth/password-recovery/reset`. Audit event
`password_reset_link_requested` records the actor user id, the target user
id, and the target tenant id.

**Errors:** `400` when the target is not `active`. `401` unauthenticated.
`403` for `Usuario`, an inactive actor, or an `AdministradorTenant`
targeting another tenant. `404` when the user id does not exist. `429` uses
`PASSWORD_RESET_RATE_LIMIT_MAX` and `PASSWORD_RESET_RATE_LIMIT_WINDOW`.
`503` when SMTP delivery fails; that attempt's token is marked used.

### `PATCH /api/v1/users/{id}`

| Field          | Value                                                                                                                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Method         | `PATCH`                                                                                                                                                                                                                                                                                               |
| Route          | `/api/v1/users/{id}`                                                                                                                                                                                                                                                                                  |
| Authentication | Access cookie. `Administrador`; `AdministradorTenant` for users of their tenant except `Administrador` targets; or self. Writing `profile` or `tenantId` is `Administrador` only. Writing `enabledActions` is `Administrador`, or `AdministradorTenant` for non-`Administrador` users of their tenant |
| Purpose        | Edit registration fields, photo, `enabledActions`, home tenant (Global only), and (Global only) `Usuario`/`AdministradorTenant`/`Administrador` profile                                                                                                                                               |

**Request:** `multipart/form-data`. Registration edit sends `firstName`,
`lastName`, optional `cargo` (maximum 160 characters), `age`, `sex`, `email`,
and optional `photo` (raster image, maximum 5 MB). Optional
`tenantId` is a UUID of an existing tenant. Only `Administrador` may send
it. Omitting `tenantId` leaves `users.tenant_id` unchanged. An uploaded
photo pointer moves into the destination tenant folder and is removed from
the previous folder. A brand path such as `/brand/symbol-vetor.png` is not
moved. A photo uploaded in the same save is written only under the
destination tenant. Audit event `user_updated` includes metadata
`previousTenantId` when the home tenant changes.
`Perfil` may send only `enabledActions` as a JSON array of `painel`, `viewReports`,
`createUser`, `editUser`, `viewProjects`, `manageProjects`, `moveCards`,
`createLane`, `renameLane`, `deleteLane`, `createTenant`, and/or `vetorAgent`. An empty array is allowed. Unknown values are `400`. Optional
`profile` is `Usuario`, `AdministradorTenant`, or `Administrador`.
`Administrador` is the global profile and keeps every system permission.
`AdministradorTenant` starts with every tenant permission except lane
configuration and can administer only the user's home tenant.
Administrador Global can change that selection, including lane actions.
`createLane`, `renameLane`, and `deleteLane` are held by `Administrador` by default. Only
`Administrador` can grant or revoke them. An existing `Administrador` cannot be demoted.
Password is not changed. Edit can add a photo when none exists or replace an
existing photo. `Administrador` keeps every mapped action even when
`enabledActions` is empty. `AdministradorTenant` has `painel`, `viewReports`,
`createUser`, `editUser`, `viewProjects`, `manageProjects`, and
`moveCards` until Administrador Global saves a different selection.
`vetorAgent` is not implied for `AdministradorTenant`. `createTenant` is not implied
for `AdministradorTenant`. Storing `createTenant` on a
non-`Administrador` user does not authorize `POST /api/v1/tenants`.

**Response:** `204 No Content`.

**Errors:** `400` invalid input, including an unknown `tenantId` or an
email that already exists on the destination tenant. The previous home
tenant is kept. `401` unauthenticated. `403` unauthorized registration,
`enabledActions`, `profile`, or `tenantId` write. A `Usuario` with
`editUser` may still PATCH only their own registration and cannot send
`tenantId`. `404` unknown id.

### `PATCH /api/v1/auth/session`

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Method         | `PATCH`                                                                |
| Route          | `/api/v1/auth/session`                                                 |
| Authentication | Access cookie. `Administrador` only                                    |
| Purpose        | Set the working session `tenantId` without rewriting `users.tenant_id` |

**Request:** `{ tenantId }` UUID of an existing tenant.

**Response:** `200` updated safe user. Access and refresh cookies rotate and
carry the working `tenantId`. Relatórios and other session-tenant surfaces
follow. Login still starts from `users.tenant_id`.

**Errors:** `400` unknown tenant, `401` unauthenticated, `403` not
`Administrador`.

### Project Kanban

Project endpoints use the access-cookie session tenant. `Administrador`
queries that working tenant after a Projetos switch. `AdministradorTenant`
and `Usuario` are limited to `users.tenant_id`. `viewProjects` (or an
implying profile) is required for reads and card operations.
`Administrador` and `AdministradorTenant` may create, rename, and delete
workspaces and projects. `Usuario` receives `403` on those writes even with
`manageProjects`. `moveCards` (or an implying profile) is required to move,
reorder, place, or drag. Only `AdministradorTenant` may set or remove the
per-project board background; Global `Administrador` receives `403`.
`GET /api/v1/projects/{id}` returns `kanbanFilters` or `null`. The object is
`{ status, date, taskCompletion }`. `status` lists zero or more lane keys.
`date` is `null` or `{ mode, startDate, endDate }` where `mode` is `start`,
`end`, or `range`. `taskCompletion` is `all`, `complete`, or `incomplete`.
`PATCH /api/v1/projects/{id}` accepts `name`, `kanbanFilters`, `kanbanLanes`,
or any combination. An empty body is `400`. `kanbanFilters` is stored in
`projects.metadata` under `kanbanFilters` and does not replace other metadata
keys. `kanbanLanes` replaces `projects.metadata.kanbanLanes` with
`{ key, label, color }[]`. Colors on one project are unique. Omitted `key`
creates a lane and assigns the first unused color from the twelve-color lane
palette. A default lane keeps its canonical color when a stored color is
repeated. A lane that still
has cards cannot be renamed or removed. `GET /api/v1/projects/{id}` returns
each lane with `key`, `label`, and `color`; when `kanbanLanes` is absent the
six default lanes are used. Project managers keep this route. Viewers with
`viewProjects` can read the board and apply filters locally; a filter or lane
write from them is `403`. The shared dashboard URL
is `/portal/projetos/{id}`. It does not create a token or a public route.
Opening it still requires an authenticated session, `viewProjects`, and the
session tenant that owns the project. An administrator whose session tenant
does not own the project is denied.
Card and project-document writes use board access (`viewProjects`).
Card DTOs omit filesystem paths; attachment URLs are
`/api/v1/cards/{id}/attachments/{attachmentId}`. Tags are
`{ name, color }[]`. Color keys are `lime`, `sky`, `pink`, `amber`,
`violet`, `teal`, `coral`, `navy`. Card files and project files share the
allowlist JPEG, PNG, GIF, WEBP, PDF, TXT, CSV, Markdown, JSON, ZIP, and
Office documents; 5 MB per file; 10 files per card; project tree 500 MB
and 200 nodes. Lanes are `backlog`,
`ready`, `working`, `review`, `deploy`, `done`. Priorities are `low`,
`medium`, `high`. Hard delete CASCADE removes dependents, documents, the
background file, and attachment files. Unauthenticated callers receive `401`. Unauthorized callers receive
`403`. Missing rows receive `404`. Invalid input, including wrong
attachment type or size, is `400`.

### Support tickets

Ticket routes use the access cookie. `Usuario` and `AdministradorTenant` are
limited to `users.tenant_id`. `Administrador` uses the active session
`tenantId` and cannot create tickets. When the active session tenant is the
company tenant (`BOOTSTRAP_ADMIN_TENANT_SLUG`, default `vetor`),
`Administrador` lists, reads, comments on, changes status, and marks read
for tickets of every tenant. On any other session tenant, `Administrador`
stays limited to that tenant. Each summary includes `tenantName`. `tenantId`,
`openedById`, and the
initial status are server-owned. Status values are `aberto`,
`em_andamento`, `em_analise`, `resolvido`, and `cancelado`. Categories are
`duvida`, `suporte_tecnico`, `erro_falha`, `solicitacao_servico`,
`financeiro_cobranca`, `melhoria`, and `outros`. Lists return newest
`updatedAt` first, then `createdAt`, with `page` default 1 and `limit`
default 20, maximum 100. Optional `tenantId` narrows that list. On the
company tenant session it may name any tenant. Outside that session a
`tenantId` other than the caller's effective tenant is `403`. An invalid
`tenantId` is `400`. A successful mutation returns
`Operação realizada com sucesso.` Mail is link-only. A new ticket and a
client comment are sent to the ticket tenant contact email from Cadastro
(`tenants.email`). A company comment and a status change are sent to the
active users of that tenant. `FORM_CONTACT` is not a ticket recipient. The
HTTP response returns after the row is stored and does not wait for SMTP.
A missing recipient or a delivery failure is logged and does not change the
HTTP result. Unknown body fields are `400`.
Missing tickets are `404`. A ticket outside the caller scope is `403`.
Priority is optional on create and defaults to `low`. The other values are
`medium` and `high`. Callers who can view a ticket can attach the same
allowlisted files as cards, at most 5 MB each and 10 files per ticket.
Attachment responses omit filesystem paths. Uploading an attachment does
not send mail.

## AI agent chat

Authenticated callers with `vetorAgent` use `/api/v1/ai/*`. `Administrador`
has that action through the existing mapped-action set. `AdministradorTenant`
does not receive it unless Cadastro stores it. The tenant comes from the
authenticated identity. Responses omit tenant and owner identifiers. A
message is stored with a `QUEUED` run and an unpublished outbox row in one
transaction, then `202` returns. One `QUEUED` or `PROCESSING` run is allowed
per conversation. A second message while that run is active is `409` and
includes the active `runId`. A turn that includes an image uses
`OPENROUTER_VISION_MODEL` because the default text model has no image
endpoint. A published run that stays `QUEUED` without a
lease for one lease interval is published again. SSE is best-effort. The run and message history remain the
recovery path. A message lists the files bound to it, without filesystem
paths. `GET /api/v1/ai/conversations/{conversationId}/attachments/{attachmentId}`
returns those bytes only for the conversation owner, and only after the file
is bound to a message. Conversation creation uses
`AI_CONVERSATION_RATE_LIMIT_MAX` and message submission uses
`AI_MESSAGE_RATE_LIMIT_MAX`. Both counters stay in process memory. SSE also
rejects a new connection when the process limit or the per-owner limit is
reached. The Agente Beta price is one BRL amount per million tokens.
`GET` and `PATCH /api/v1/admin/ai-pricing` are limited to `Administrador`.
A save writes that amount onto every tenant, and a new tenant copies the
current amount. `GET /api/v1/ai/pricing` returns that shared
`tokenCostPerMillion` and `usageCost`. `usageCost` is the caller's succeeded
prompts only: the sum of each prompt's input and output tokens, multiplied by
`tokenCostPerMillion`, divided by 1,000,000. Missing token counts count as
zero. Another user's prompts are excluded. A succeeded run may list, create,
or update cards on one project the caller can already access. The project
name is resolved in the worker by strict equality. Card create accepts an
omitted `assigneeUserId` and stores null. The board form still sends an
assignee.

## Document status

- [x] Base URL and prefix are aligned with the backend
- [x] Product endpoints are documented
- [x] Authentication requirements are documented
- [x] Error behavior is documented
- [x] Swagger and `openapi.yaml` are required companions of this contract
