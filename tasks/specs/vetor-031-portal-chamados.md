---
id: VETOR-031
title: Portal tenant support tickets
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-26-portal-chamados-multi-tenant
created_at: 2026-10-26
updated_at: 2026-10-27
---

# Portal tenant support tickets

## Context

The named human approver invoked `/goal` on this specification on
2026-10-26 and thereby approved it for delivery.

The authenticated portal has tenant-scoped users, an active session
`tenantId`, the global `Administrador` profile, the tenant-scoped
`AdministradorTenant` profile, and the tenant-scoped `Usuario` profile.
Projects already demonstrate the required backend pattern: reload the active
user, resolve the effective tenant scope, load the resource, and verify the
resource hierarchy before returning data.

This feature adds a support-ticket domain owned by a tenant. A ticket is
owned by the tenant, not by the user who opened it. The opening user is an
actor recorded on the ticket, while `tenantId` is the ownership boundary.

For this feature:

- `Cliente` is represented by an authenticated `Usuario` or
  `AdministradorTenant`.
- `Empresa` is represented by the existing global `Administrador`.
- `Administrador` attends every tenant's tickets when the active session
  tenant is the company tenant (`BOOTSTRAP_ADMIN_TENANT_SLUG`, default
  `vetor`). On any other session tenant, `Administrador` stays limited to
  that tenant.
- Ticket data is exchanged through the existing NestJS API. The frontend
  never accesses PostgreSQL directly.
- The repository has no generic in-app notification subsystem. Notifications
  use the existing SMTP-backed `MailService`.

The requested user-visible product language is Portuguese (Brazil), while
identifiers and technical contracts follow the repository conventions.

## Desired outcome

An authenticated portal user can open `Suporte` from the portal shell.
Clients can open tickets owned by their tenant, read the ticket conversation,
add comments, and see the current status. The company can list and filter
tickets in the active session tenant, add comments, update status, and mark
tickets as viewed.

The backend is the authority for authentication, authorization, input
validation, tenant isolation, notification recipients, and response data.

## In scope

- Add the authenticated portal navigation item `Suporte`.
- Add the client ticket route `/portal/chamados` and ticket detail route
  `/portal/chamados/{id}`.
- Allow a Cliente to create a ticket with:
  - `title`, required, 3–160 characters.
  - `category`, required.
  - `description`, required, 10–5,000 characters.
- Use the following required category values:
  - `DUVIDA = duvida`
  - `SUPORTE_TECNICO = suporte_tecnico`
  - `ERRO_FALHA = erro_falha`
  - `SOLICITACAO_SERVICO = solicitacao_servico`
  - `FINANCEIRO_COBRANCA = financeiro_cobranca`
  - `MELHORIA = melhoria`
  - `OUTROS = outros`
- Persist the ticket owner from the authenticated session tenant.
- Persist the opening user from the authenticated session user.
- Set the initial ticket status on the backend to `aberto`.
- Use the following status values:
  - `aberto`
  - `em_andamento`
  - `em_analise`
  - `resolvido`
  - `cancelado`
- Allow a Cliente and Empresa to list and view tickets within their
  authorized tenant scope.
- Order the ticket list by most recent activity, represented by
  `updatedAt` descending with a deterministic creation-time tie-breaker.
- Support status, category, and tenant filters in the ticket list. The
  tenant filter is available to Empresa and narrows the list. It does not
  widen access beyond the effective tenant scope.
- Allow a Cliente and Empresa to add comments with a body of 2–5,000
  characters.
- Display comments in descending creation-date order.
- Record the comment author and creation date.
- Track a per-user last-seen marker for each ticket.
- Expose a new-comment indicator calculated for the authenticated user.
- Allow only Empresa to update the ticket status.
- Allow Cliente and Empresa to mark tickets as viewed.
- Send email notifications through the existing SMTP-backed `MailService`:
  - New ticket to the ticket tenant contact email stored on `tenants.email`
    at Cadastro.
  - Client comment to that same tenant contact email.
  - Company comment to all active users of the ticket tenant.
  - Status change to all active users of the ticket tenant.
- Limit notification email content to the event, ticket identifier, and an
  authenticated portal link. Do not include the description or comment body.
- Reuse the existing authenticated portal shell, status feedback, modal,
  accessibility, responsive, and VETOR visual patterns.
- Add unit, HTTP integration, and frontend component coverage for the
  behavior defined here after approval.

## Out of scope

- Attachments and priority. Those behaviors are specified in VETOR-034.
- SLA, escalation, or service-level timers.
- Assignment to a specific attendant, team, or user.
- Editing or deleting tickets.
- Editing or deleting comments.
- Detailed status-transition history.
- Customer-service evaluation.
- WhatsApp or any external support integration.
- A new in-app notification entity, notification inbox, notification badge,
  WebSocket, SSE channel, queue, or worker.
- A public or unauthenticated ticket route.
- Trusting `tenantId`, `openedById`, status, timestamps, or ownership fields
  supplied by the frontend.
- A separate all-tenant screen. The company attendance list is the existing
  `Suporte` page while the session tenant is the company tenant.
- Changes to the existing project Kanban domain.
- A new feature-specific rate-limit threshold. Ticket routes do not declare
  a new limit. The existing global rate-limit guard remains.

## Acceptance criteria

- AC-001: An authenticated portal user with any current supported profile
  sees `Suporte` in the portal shell and can navigate to
  `/portal/chamados`. Unauthenticated callers cannot access the route.
- AC-002: The Cliente opening form requires a title of 3–160 characters, a
  category from the recorded catalog, and a description of 10–5,000
  characters. Blank, short, long, or unknown category values are rejected by
  the backend.
- AC-003: Creating a ticket uses the authenticated session `tenantId`,
  authenticated user id, and server status `aberto`, regardless of any
  attempted client values for those fields. The response includes a success
  message and the created ticket data.
- AC-004: A `Usuario` or `AdministradorTenant` can only list, view, comment
  on, and mark as viewed tickets whose `tenantId` equals the user's home
  tenant. An `Administrador` whose session tenant is the company tenant
  (`BOOTSTRAP_ADMIN_TENANT_SLUG`, default `vetor`) can list and attend
  tickets from every tenant. On any other session tenant, `Administrador`
  can only access tickets of that tenant.
- AC-005: A ticket id from another tenant cannot return ticket, tenant,
  author, comment, or read-state data to a Cliente, or to an `Administrador`
  whose session tenant is not the company tenant. Backend authorization
  remains in force when a caller changes the id manually.
- AC-006: The list is ordered by most recent `updatedAt` first and supports
  validated status, category, and tenant filters. The UI exposes status and
  category filters on the list, and the tenant filter on the Empresa view.
  A `tenantId` outside the caller's effective scope is rejected. On the
  company tenant session, Empresa may filter to any tenant.
- AC-007: The detail view displays the ticket identifier, title, category,
  status, description, tenant/customer, opening author, dates, comments, and
  the authenticated user's new-comment indicator.
- AC-008: Cliente and Empresa can create comments between 2 and 5,000
  characters. The backend records the authenticated author and displays
  comments in descending creation-date order. Comment edit and delete routes
  do not exist.
- AC-009: Only Empresa can change a ticket to one of the five recorded
  statuses. Cliente status writes receive `403`, including direct API calls.
  Any of the five statuses may replace any other. An unchanged status does
  not send mail.
- AC-010: Marking a ticket as viewed updates only the authenticated user's
  last-seen marker for that ticket. A comment created after that marker is
  represented as new for that user.
- AC-011: A new ticket and a Client comment send a link-only email to the
  ticket tenant contact email from Cadastro (`tenants.email`). An Empresa
  comment and a status change send a link-only email to every active user of
  the ticket tenant. Emails do not contain ticket descriptions or comment
  bodies. The HTTP response does not wait for SMTP. A missing or blank
  tenant contact email, or a later delivery failure, is logged and leaves
  the stored mutation in place. `FORM_CONTACT` is not a ticket recipient.
- AC-012: The Cliente sees the create-ticket and comment controls but no
  status control. Empresa sees filtering, comment, status, and mark-viewed
  controls but no create-ticket control. These UI checks do not replace
  backend authorization.
- AC-013: Every request DTO rejects unknown fields. Ticket and comment
  responses use explicit DTOs and do not expose password hashes, tokens,
  filesystem paths, or unrelated user data.
- AC-014: All protected operations return the project's established
  authentication and authorization outcomes: `401` when unauthenticated,
  `403` when authenticated but not authorized, `404` when the resource does
  not exist within the expected lookup path, and `400` for invalid input.
- AC-015: No SLA, assignment, edit, delete, WhatsApp, public route, or
  detailed transition-history behavior is added. Attachments and priority
  belong to VETOR-034.

## User experience

UI language is Portuguese (Brazil). The visual treatment follows
`docs/design.md`, the current `PortalShell`, the shared accessible `Modal`,
Tailwind tokens, Inter, VETOR spacing, visible focus, semantic landmarks,
and the existing inline status feedback pattern. No icon library or toast
library is added.

### Portal navigation

Add a `Suporte` item to the authenticated shell for `Administrador`,
`AdministradorTenant`, and `Usuario`. Place it immediately below `Cadastro`
and above `Projetos` when `Projetos` is visible. Use a custom inline SVG
ticket/support icon in the existing sidebar stroke style. The item navigates
to `/portal/chamados`.

The `Suporte` item is a UX affordance. Direct requests to the API remain
protected by the backend.

### Ticket list

`/portal/chamados` uses the existing portal page header and responsive main
area. The page contains:

- A list of ticket summaries.
- Status, category, and tenant filter controls. The tenant control is
  shown to Empresa, beside the category control, with a `Todos` option and
  one option per tenant name.
- Loading, empty, error, and success states using existing `role="status"`,
  `role="alert"`, and `aria-live` patterns.
- A link or button for each ticket that opens
  `/portal/chamados/{id}`.
- An accessible new-comment indicator when the current user has comments
  newer than their last-seen marker.

The Cliente receives an `Abrir chamado` control. Empresa does not receive
that control because opening tickets is a Cliente capability in this
specification.

Ticket summaries show only the data needed to identify and prioritize the
record in the list: identifier, title, category, status, tenant when the
actor is Empresa, and most recent activity date.

### Ticket creation

The Cliente opens an accessible modal that uses the same white dialog as
`Novo card`: white surface, navy text, `border-navy/10`, no `Fechar janela`,
and accent `Salvar` with `Cancelar`. Escape and overlay dismissal still
close it. The form contains `Título`, `Categoria`, and `Descrição`.
Client-side validation provides immediate feedback, while the backend
repeats every validation.

On success, the existing portal success feedback pattern displays
`Operação realizada com sucesso.` and the form closes or resets after the
created ticket is available. Invalid input uses the existing generic
feedback `Não foi possível concluir a operação.` unless a more specific
validation message is already established by the form.

### Ticket detail

`/portal/chamados/{id}` shows the full ticket data in a responsive detail
surface. It includes:

- Identifier, title, category, and status.
- Description.
- Tenant/customer name.
- Opening author.
- Creation and update dates.
- The new-comment indicator for the current user.
- A `Marcar como visto` action that calls the dedicated read endpoint.
- Comments ordered from newest to oldest.
- A comment form for Cliente and Empresa.
- A status control for Empresa only.

Status values are displayed with Portuguese labels derived from the
recorded status values: `Aberto`, `Em andamento`, `Em análise`, `Resolvido`,
and `Cancelado`. Category display labels are the Portuguese names of the
recorded catalog: `Dúvida`, `Suporte técnico`, `Erro/falha`,
`Solicitação de serviço`, `Financeiro/cobrança`, `Melhoria`, and `Outros`.

### Feedback and accessibility

Use the established portal feedback copy where applicable:

- Success: `Operação realizada com sucesso.`
- Forbidden: `Você não tem permissão para esta ação.`
- Generic failure: `Não foi possível concluir a operação.`
- Not found: `Este registro não existe.`

Forms use associated labels, keyboard navigation, visible focus, semantic
buttons and links, accessible status announcements, and responsive layouts.
The existing `docs/design.md` accessibility and reduced-motion decisions
remain in force. The formal WCAG level stays the global contract's
undecided value.

## API and integrations

The API uses the existing `/api/v1` prefix, access-cookie authentication,
camelCase JSON, UUID identifiers, explicit response DTOs, `class-validator`
DTOs, and the global `ValidationPipe` with `whitelist` and
`forbidNonWhitelisted`.

The requested Portuguese endpoint names are adapted to the repository's
English plural resource convention as `tickets`, while the portal UI route
uses `chamados` to match the existing Portuguese portal routes.

### Resource representation

The ticket summary DTO contains:

- `id`
- `tenantId`
- `title`
- `category`
- `status`
- `createdAt`
- `updatedAt`
- `hasNewComments`

The ticket detail DTO additionally contains:

- `description`
- `openedById`
- `openedBy` with safe id and display-name fields
- `tenant` with safe id and display-name fields
- `comments`

The comment DTO contains:

- `id`
- `ticketId`
- `authorId`
- `author` with safe id and display-name fields
- `body`
- `createdAt`
- `updatedAt`

Ticket and comment DTOs do not include user email, password-related fields,
filesystem paths, tokens, or internal persistence metadata. Email addresses
are loaded server-side only for notification delivery.

### Planned endpoints

| Method | Path                            | Authentication and authorization                                                    | Request                                                      | Success                          | Errors                     |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------- | -------------------------- |
| POST   | `/api/v1/tickets`               | Access cookie; `Usuario` or `AdministradorTenant` in the authenticated tenant scope | `{ title, category, description }`                           | `201` `{ message, ticket }`      | `400`, `401`, `403`        |
| GET    | `/api/v1/tickets`               | Access cookie; Cliente or Empresa in the effective tenant scope                     | Query `status?`, `category?`, `tenantId?`, `page?`, `limit?` | `200` paginated ticket summaries | `400`, `401`, `403`        |
| GET    | `/api/v1/tickets/{id}`          | Access cookie; Cliente or Empresa with access to the ticket tenant                  | None                                                         | `200` ticket detail DTO          | `401`, `403`, `404`        |
| PATCH  | `/api/v1/tickets/{id}`          | Access cookie; Empresa only in the active session tenant                            | `{ status }` only                                            | `200` `{ message, ticket }`      | `400`, `401`, `403`, `404` |
| POST   | `/api/v1/tickets/{id}/comments` | Access cookie; Cliente or Empresa with access to the ticket tenant                  | `{ body }`                                                   | `201` `{ message, comment }`     | `400`, `401`, `403`, `404` |
| POST   | `/api/v1/tickets/{id}/read`     | Access cookie; Cliente or Empresa with access to the ticket tenant                  | Empty body                                                   | `204`                            | `401`, `403`, `404`        |

`POST /api/v1/tickets` accepts no tenant, author, status, identifier, or
timestamp fields. `PATCH /api/v1/tickets/{id}` accepts only `status`;
editing any other ticket field is not part of this feature. The read
endpoint is idempotent for the authenticated user and ticket.

List pagination is a technical safeguard for potentially large tenant
collections. The default page size is 20 and the maximum page size is 100.
The response contains `items`, `page`, `limit`, and `total`.

Status and category query values are validated against the recorded catalogs.
An unknown filter is `400`. Optional `tenantId` must be a UUID. On the
company tenant session it narrows the all-tenant list. For every other
caller, a `tenantId` other than the effective tenant is `403`.

### API behavior and notification integration

The backend saves the domain mutation and returns the HTTP response before
SMTP delivery finishes. Delivery continues in the same process, without a
retry queue or notification worker. If the recipient is missing or SMTP
delivery fails, the persisted mutation remains, the failure is logged
without transport details, and the HTTP result stays successful.

The company recipient for a new ticket and a client comment is the contact
email saved on the ticket tenant at Cadastro (`tenants.email`). A missing or
blank value is logged after the mutation is stored.
`FORM_CONTACT` remains the public lead-form recipient and is not used for
ticket mail. Customer recipients for an Empresa comment or a status change
are all active users of the ticket tenant, with duplicate email addresses
de-duplicated before sending.

Email subjects and templates are feature-specific additions to the existing
email template service. The email contains the event, ticket identifier, and
an authenticated portal link built from the configured frontend origin and
`/portal/chamados/{id}`. It does not contain ticket descriptions or comment
bodies.

Approved delivery must update `docs/api.md`, `openapi.yaml`, and Swagger at
`/api/docs` together with the backend and frontend changes.

## Data impact

PostgreSQL and TypeORM are already adopted by the portal. Approved delivery
adds a feature module and a migration. The frontend continues to access data
only through NestJS.

### Intended hierarchy

```text
tenants
  └── tickets
        ├── ticket_comments
        └── ticket_read_states
```

### Intended tables

| Entity               | Purpose                                | Main fields                                                                                                                                   |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tickets`            | Tenant-owned support ticket            | `id` UUID, `tenant_id` FK, `opened_by_user_id` FK, `title` varchar(160), `description` text, `category` varchar, `status` varchar, timestamps |
| `ticket_comments`    | Immutable support conversation entries | `id` UUID, `ticket_id` FK, `author_user_id` FK, `body` varchar(5000), timestamps                                                              |
| `ticket_read_states` | Per-user last-seen state for a ticket  | `id` UUID, `ticket_id` FK, `user_id` FK, `last_seen_at` timestamptz, timestamps, unique `(ticket_id, user_id)`                                |

`tickets.tenant_id` is required and indexed. Ticket status and category use
varchar values with database check constraints rather than PostgreSQL enum
types. `ticket_comments.ticket_id` and `ticket_comments.author_user_id`
are required and indexed. `ticket_read_states` has a unique key per ticket
and user.

The ticket list has an index supporting tenant scope and recent activity,
and additional indexes support status and category filtering. Comments have
an index supporting ticket lookup and creation-date ordering.

The ticket `updatedAt` changes when the ticket is created, when a comment is
added, and when the status changes. No separate transition-history table is
created.

Deletion behavior follows the recorded constraint that tenant isolation and
required attribution are not silently removed:

- `tickets.tenant_id`, `tickets.opened_by_user_id`, and
  `ticket_comments.author_user_id` use `ON DELETE RESTRICT`.
- `ticket_comments.ticket_id` and `ticket_read_states.ticket_id` use
  `ON DELETE CASCADE` because those rows are owned by the ticket. This
  feature still has no ticket-delete operation.
- `ticket_read_states.user_id` uses `ON DELETE CASCADE` because a read
  marker is per-user view state, not ticket attribution.
- Existing user deletion that would remove a ticket opener or comment
  author fails with `400` instead of deleting the ticket or its comments.

The project-wide data contract currently has no automated purge for portal
records. This feature does not add retention or purge behavior.

## Security

Every endpoint requires the existing portal access-cookie authentication
unless the endpoint is explicitly public. No endpoint in this feature is
public.

Authorization is enforced in the backend and uses a fresh active-user
lookup. The access-token identity is used to locate the actor, but the
backend does not trust client-supplied profile, permissions, tenant, author,
or ownership fields.

- `Usuario` and `AdministradorTenant` use their home `users.tenant_id`.
- `Administrador` uses the active session `tenantId`, not an arbitrary
  request field.
- Every ticket id is checked against the effective tenant before its detail,
  comments, status, or read state is loaded or changed.
- `tenantId` is never accepted from the ticket creation form. On the list
  query it only narrows an already authorized scope.
- `openedById` is always the authenticated user id.
- `status` is always `aberto` on creation and can be changed only by
  `Administrador`.
- A `Usuario` or `AdministradorTenant` receives `403` for status writes.
- Frontend hiding is UX only and does not authorize any operation.
- Unknown DTO properties are rejected.
- Response DTOs omit passwords, hashes, reset tokens, access tokens, refresh
  tokens, filesystem paths, and unrelated user fields.
- Ticket descriptions and comment bodies are returned only to authorized
  users in the ticket tenant.
- Email notifications contain no description or comment body. The portal
  link does not grant access without an authenticated session.
- Existing Helmet, explicit CORS, cookie settings, global validation, and
  rate-limit guard remain enabled.
- User-generated text is rendered through normal React escaping and escaped
  by email templates; no raw HTML is accepted.

Feature-specific anti-spam rate-limit thresholds for ticket creation and
comments are not defined. Delivery retains the existing backend rate-limit
controls, adds no public route, and does not weaken an existing control.

The specification does not add a new security audit policy. Existing
security-audit behavior remains unchanged. Detailed ticket transition
history is out of scope.

## Testing

Approved delivery must add or update tests in the same change as the
behavior.

### Backend unit tests

- DTO validation for required fields, lengths, enum values, and rejected
  unknown fields.
- Ticket creation uses the authenticated user and tenant and forces status
  `aberto`.
- Client and company scope resolution.
- Cross-tenant detail, comment, status, and read-state denial.
- Company-only status changes.
- List ordering and status, category, and tenant filters, including a
  client `tenantId` outside the effective scope.
- Comment length validation, author persistence, descending response order,
  and lack of edit/delete behavior.
- Per-user last-seen calculation and new-comment indicator.
- Notification recipients, event types, link-only templates, and sanitized
  SMTP failures.

### Backend HTTP integration tests

- `401` for unauthenticated calls.
- `400` for invalid DTOs, filters, status, category, and unknown properties.
- `403` for Cliente status changes and cross-scope operations.
- `404` for missing tickets and comments.
- Creation, listing, detail, status update, comment creation, and mark-read
  response contracts.
- Tenant isolation when a caller changes a UUID manually.

### Frontend component and route tests

- `Suporte` navigation visibility, route, and placement immediately below
  `Cadastro`.
- Client create form validation and successful submission.
- Company filters and status control.
- Hidden status control for Cliente.
- Ticket detail, comments, descending display, read action, and new-comment
  indicator.
- Loading, empty, error, success, and unauthorized states.
- Responsive and accessible labels, roles, focus behavior, and feedback.

### Acceptance coverage

- AC-001: `frontend/components/layout/portal-shell.spec.tsx` shows `Suporte`
  for `Usuario` and places it immediately below `Cadastro`; `AuthenticatedPortal`
  keeps the route behind the existing session.
- AC-002: `backend/src/modules/tickets/dto/ticket.dto.spec.ts` and
  `frontend/components/tickets/tickets-home.spec.tsx`.
- AC-003: `backend/src/modules/tickets/tickets.service.spec.ts` and
  `backend/test/tickets.e2e-spec.ts`.
- AC-004: `tickets.service.spec.ts` tenant and session-tenant cases.
- AC-005: service and e2e cross-tenant `403` without returning ticket data.
- AC-006: service list order and filters;
  `frontend/components/tickets/tickets-home.tsx` filter controls.
- AC-007: `frontend/components/tickets/ticket-detail.spec.tsx`.
- AC-008: service comment order and e2e missing edit route `404`.
- AC-009: service and e2e client status `403`; company status update.
- AC-010: service mark-read leaves `updatedAt` unchanged and clears the
  new-comment flag.
- AC-011: `mail.service.spec.ts`, `email-template.service.spec.ts`, and
  service recipient assertions.
- AC-012: tickets home and ticket detail component tests.
- AC-013: DTO unknown-field tests and explicit response DTO mapping.
- AC-014: `backend/test/tickets.e2e-spec.ts` for `401`, `400`, `403`, and
  `404`.
- AC-015: no SLA, assignment, edit, delete, or public ticket route in this
  specification. Attachments and priority are covered by VETOR-034.

## Delivery

The named human approved this specification by invoking `/goal` on
2026-10-26. Delivery adds the tickets module, migration, portal screens,
tests, and the affected global contracts.

- A backend tickets module with entities, DTOs, controllers, services,
  authorization checks, notification template integration, and a TypeORM
  migration under the existing backend conventions.
- Backend unit tests next to the ticket behavior and HTTP integration tests
  under `backend/test/`.
- Frontend App Router pages for the list and detail routes, portal-shell
  navigation, forms, detail/comment/status components, API-client methods,
  and Vitest/React Testing Library coverage.
- The consolidated changes to `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `openapi.yaml`, `docs/database.md`, and the project's QA
  routes where the approved scope requires them.

The delivery agent must not add requirements beyond this approved scope.
Any missing business or security policy must return this specification to
review rather than being inferred in code.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-10-26-portal-chamados-multi-tenant`
- Request: create a complete tenant-owned support-ticket module where the
  client opens and follows tickets and the company reads, comments, filters,
  updates status, and marks tickets as viewed.
- Confirmed human decisions recorded during specification:
  - Client maps to `Usuario` and `AdministradorTenant`; Empresa maps to the
    existing `Administrador`.
  - Empresa uses the active session tenant rather than an all-tenant list.
  - Category is required and uses the seven values recorded above.
  - Notifications use SMTP.
  - Customer comment/status notifications go to all active tenant users.
  - Follow-up 2026-10-27: company ticket notices use the Cadastro email on
    the ticket tenant (`tenants.email`), not `FORM_CONTACT`.
  - Follow-up 2026-10-27: the company tenant session attends tickets from
    every tenant. Other session tenants stay scoped to themselves.
  - Follow-up 2026-10-27: ticket HTTP responses do not wait for SMTP.
    Notification failures are logged and do not change the HTTP result.
  - Follow-up 2026-10-27: Empresa filters the support list by tenant. The
    filter sits beside category and does not grant access outside the
    effective tenant scope.
  - Follow-up 2026-10-27: attachments and priority moved to VETOR-034.
  - Notification emails contain only event, identifier, and authenticated
    link.
  - Read state is stored per authenticated user and ticket using
    `lastSeenAt`.
- Existing contracts consulted:
  - `docs/architecture.md`
  - `docs/api.md`
  - `docs/database.md`
  - `docs/design.md`
  - `docs/product.md`
  - `docs/conventions.md`
  - `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`
  - `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`
  - `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`
  - `backend/src/modules/projects/projects.service.ts`
  - `backend/src/modules/portal/access-token.guard.ts`
  - `backend/src/modules/mail/mail.service.ts`
  - `frontend/components/layout/portal-shell.tsx`
  - `frontend/lib/api/client.ts`

## Implementation evidence

- Changed: tickets module, migration `1760000019000`, SMTP ticket notices,
  user-delete foreign-key handling, portal `Suporte` list and detail, and
  the product, design, API, database, and OpenAPI contracts.
- Tests: backend unit tests passed (270), backend e2e passed (88), frontend
  tests passed (291), backend and frontend typecheck passed, `npm run lint`
  passed with the existing frontend image warnings and no errors, backend
  and frontend builds passed, and `spec-driven-development` passed for 31
  specifications. `npm run format:check` still fails on pre-existing files
  outside this delivery. `npm run audit:all` still reports pre-existing
  high and critical advisories in existing dependencies. Authenticated
  browser checks covered the company list, filters, empty state,
  missing-ticket message, and the absence of the client create control.
- Limitations: No additional numeric anti-spam threshold is defined.
  Ticket routes do not declare a new rate limit.

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
