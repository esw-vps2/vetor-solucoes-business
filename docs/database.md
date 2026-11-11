# Data model contract

Use this document when the project requires persistent data. It records the
durable, cross-feature data model and lifecycle decisions.

Feature-specific data changes, migrations, retention implications, and
acceptance criteria live in the approved specification under `docs/specs/`.
Promote a decision here only when it changes the shared model or policy.

Source for this decision: the extracted `tmp/vetor` leadpage has no API, no
database, and no persisted form. Contact is a `mailto:` action.

## Relationship to specifications

- Read the approved feature specification before changing persistence.
- Record the feature's data delta in its specification before implementation.
- Update this contract with the approved resulting entity, relationship, or
  lifecycle decision.
- Do not add TypeORM, migrations, or entities while persistence remains
  undecided.

When PostgreSQL and TypeORM are adopted, follow
`.cursor/rules/typeorm.mdc` and `.cursor/rules/postgres.mdc` for entities,
migrations, naming, and data access.

## Persistence decision

| Surface  | Persistence                                   | Status   |
| -------- | --------------------------------------------- | -------- |
| Leadpage | None. Copy and assets are static.             | Approved |
| Lead CTA | No stored inquiry. Sends through the backend. | Approved |
| Portal   | PostgreSQL model defined below.               | Approved |

Do not create tables, TypeORM entities, or migrations for the static leadpage
or its contact inquiries.

The portal model uses PostgreSQL and TypeORM migrations.

## Entities

| Entity                          | Purpose                               | Main fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Status   |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `tenants`                       | Tenant identity and lifecycle         | `id`, unique `name` (varchar 160), unique `slug` (varchar 80), nullable unique `email` (varchar 255; empty/null emails do not collide), `status` (varchar 30, create uses `active`), `photo_url` (varchar 255, not null, default empty string), `mfa_enabled` (boolean, not null, default false; existing rows including `vetor` are false), timestamps                                                                                                                      | Approved |
| `users`                         | Tenant-scoped portal credentials      | `id`, `tenant_id`, `email`, `password_hash`, `profile` (`Administrador` / `AdministradorTenant` / `Usuario`), `status`, `first_name`, `last_name`, optional `cargo` (varchar 160), `age`, `sex` (`M`/`F`/`O`), `photo_url`, `enabled_actions` (jsonb array of `painel` / `viewReports` / `createUser` / `editUser` / `viewProjects` / `manageProjects` / `moveCards` / `createLane` / `renameLane` / `deleteLane` / `createTenant` / `vetorAgent`, default `[]`), timestamps | Approved |
| `powerbi_reports`               | Imported Power BI catalog             | `id`, `workspace_id`, `report_id`, `dataset_id`, `embed_url`, `name`, `description`, `active`, timestamps                                                                                                                                                                                                                                                                                                                                                                    | Approved |
| `powerbi_report_distributions`  | Per-tenant report access              | `id`, `report_id`, `tenant_id`, `display_name`, `icon`, `sort_order`, `default_page`, `active`, timestamps                                                                                                                                                                                                                                                                                                                                                                   | Approved |
| `project_workspaces`            | Tenant project workspace              | `id`, `tenant_id`, `name` (varchar 120), optional `metadata` jsonb, timestamps                                                                                                                                                                                                                                                                                                                                                                                               | Approved |
| `projects`                      | Project under a workspace             | `id`, `workspace_id`, `name` (varchar 120), `next_card_number` (integer, default 1), nullable `background_filename` (varchar 255 pointer), optional `metadata` jsonb, timestamps                                                                                                                                                                                                                                                                                             | Approved |
| `cards`                         | Kanban card                           | `id`, `project_id`, `number` (unique per project), `title`, `description`, `created_by_user_id`, nullable `assignee_user_id`, `starts_at`, `due_at`, `priority` (`low`/`medium`/`high`), `lane` (varchar key matching `^[a-z0-9-]{1,20}$`; default keys `backlog`/`ready`/`working`/`review`/`deploy`/`done`), `position`, `tags` jsonb `{ name, color }[]`, nullable `cover_attachment_id`, optional `metadata` jsonb, timestamps                                                    | Approved |
| `card_comments`                 | Comment on a card                     | `id`, `card_id`, `author_user_id`, `body` (varchar 4000), optional `metadata` jsonb, timestamps                                                                                                                                                                                                                                                                                                                                                                              | Approved |
| `card_attachments`              | Attachment file pointer               | `id`, `card_id`, `filename`, `content_type`, `byte_size`, `original_name`, `created_by_user_id`, timestamps. Bytes live on the tenant filesystem                                                                                                                                                                                                                                                                                                                             | Approved |
| `card_checklist_items`          | Checklist item on a card              | `id`, `card_id`, `body` (varchar 200), `done`, `position`, `created_by_user_id`, timestamps                                                                                                                                                                                                                                                                                                                                                                                  | Approved |
| `project_documents`             | Project file or folder node           | `id`, `project_id`, nullable `parent_id`, `kind` (`file`/`folder`), `original_name` (varchar 120), nullable `filename`, nullable `content_type`, `byte_size`, `created_by_user_id`, timestamps. Unique siblings via `(project_id, COALESCE(parent_id, zero-uuid), original_name)`                                                                                                                                                                                            | Approved |
| `project_contracts`             | One contract per project              | `id`, unique `project_id`, `title` (varchar 160), nullable `signed_on` / `starts_on` / `ends_on` dates, `total_amount_cents` bigint, `installment_count` integer 1 through 120, `status` (`draft`/`active`/`closed`/`cancelled`), nullable `contract_filename`, nullable `original_name`, nullable `byte_size`, `created_by_user_id`, timestamps                                                                                                                             | Approved |
| `finance_project_documents`     | Private Financeiro project file       | `id`, `project_id`, `tenant_id`, `storage_filename`, `original_name` (varchar 255), `content_type` (varchar 200), `byte_size`, `created_by_user_id`, timestamps. Files are private to the global `Administrador` and live below the VETOR tenant storage root                                                                                                                                                                                                                | Approved |
| `project_payments`              | Received payment entry                | `id`, `project_id`, `paid_on` date, `amount_cents` bigint, nullable `note` (varchar 500), `created_by_user_id`, timestamps                                                                                                                                                                                                                                                                                                                                                   | Approved |
| `project_costs`                 | Manual cost entry                     | `id`, `project_id`, `incurred_on` date, `amount_cents` bigint, `category` (`team`/`third_party`/`infrastructure`/`other`), `label` (varchar 80), `position` integer 1 through 500 unique per project, nullable `note` (varchar 500), `created_by_user_id`, timestamps                                                                                                                                                                                                        | Approved |
| `project_contract_installments` | Amount and due date of one contract installment | `id`, `project_id`, `position` integer 1 through 120 unique per project, `amount_cents` bigint 0 through 99999999999, nullable `due_on` date, `created_by_user_id`, timestamps. A null `due_on` is not part of the paid sum | Approved |
| `tenant_notes`                  | Encrypted per-tenant note             | `id`, `tenant_id`, `ciphertext` bytea, `iv` bytea (12 bytes), `auth_tag` bytea (16 bytes), `created_by_user_id`, timestamps. Plaintext is AES-256-GCM JSON `{ title, body }` under `NOTES_ENCRYPTION_KEY`. Max 50 notes per tenant (application cap)                                                                                                                                                                                                                         | Approved |
| `tickets`                       | Tenant-owned support ticket           | `id`, `tenant_id`, `opened_by_user_id`, `title` (varchar 160), `description` text, `category` (`duvida`/`suporte_tecnico`/`erro_falha`/`solicitacao_servico`/`financeiro_cobranca`/`melhoria`/`outros`), `status` (`aberto`/`em_andamento`/`em_analise`/`resolvido`/`cancelado`, default `aberto`), `priority` (`low`/`medium`/`high`, default `low`), timestamps                                                                                                            | Approved |
| `ticket_attachments`            | Attachment file pointer on a ticket   | `id`, `ticket_id`, `filename`, `content_type`, `byte_size`, `original_name`, `created_by_user_id`, timestamps. Bytes live on the tenant filesystem. The API does not return `filename`                                                                                                                                                                                                                                                                                       | Approved |
| `ticket_comments`               | Comment on a support ticket           | `id`, `ticket_id`, `author_user_id`, `body` (varchar 5000), timestamps                                                                                                                                                                                                                                                                                                                                                                                                       | Approved |
| `ticket_read_states`            | Per-user ticket read marker           | `id`, `ticket_id`, `user_id`, `last_seen_at`, timestamps. Unique `(ticket_id, user_id)`                                                                                                                                                                                                                                                                                                                                                                                      | Approved |
| `expense_categories`            | Company expense category              | `id`, unique `slug`, unique case-insensitive `name`, `position`, `active`, timestamps. Seeded once by slug                                                                                                                                                                                                                                                                                                                                                                   | Approved |
| `expense_subcategories`         | Category child                        | `id`, `category_id`, unique `slug`, unique case-insensitive `name`, `position`, `active`, timestamps. Category delete is `RESTRICT`                                                                                                                                                                                                                                                                                                                                          | Approved |
| `expense_series`                | Recurrence template, not a ledger row | `id`, `interval` (`monthly`/`yearly`), `occurrence_count` 1 through 120, `starts_on`, shared description, category, amount, type, supplier, payment method, notes, nullable client and project, `active`, `created_by_user_id`, timestamps                                                                                                                                                                                                                                   | Approved |
| `operating_expenses`            | One company operating expense         | `id`, nullable `series_id` and `series_index`, `series_detached`, description, category, nullable subcategory, `amount_cents` bigint 1 through 99999999999, `expense_type` (`fixed`/`variable`/`occasional`), nullable supplier and payment method, `competence_month` date (day 1), nullable `due_on` and `paid_on`, `status` (`pending`/`paid`/`cancelled`), nullable client and project, notes, cancel actor, timestamps                                                  | Approved |
| `operating_expense_documents`   | Expense file pointer                  | `id`, `expense_id`, `storage_filename`, `original_name`, `content_type`, `byte_size`, `created_by_user_id`, timestamps. The API does not return `storage_filename`                                                                                                                                                                                                                                                                                                           | Approved |
| `refresh_sessions`              | Rotated refresh sessions              | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `last_used_at`, timestamps                                                                                                                                                                                                                                                                                                                                                                                        | Approved |
| `password_reset_tokens`         | Single-use password reset state       | `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, timestamps. Public recovery and create-user links use `PASSWORD_RESET_TOKEN_EXPIRES_IN` (default 15 minutes). `Editar usuário` reset links use `ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN` (default 30 minutes) and are issued only for `active` users.                                                                                                                                                                   | Approved |
| `mfa_email_challenges`          | Single-use e-mailed login code        | `id`, `user_id`, `token_hash`, `failed_attempts`, `expires_at`, `used_at`, timestamps. Hash only. Three wrong codes inside the lifetime set `users.status` to `blocked`. Cancel deletes that row and does not change `users.status`.                                                                                                                                                                                                                                         | Approved |
| `security_audit_events`         | Security event history                | `id`, `user_id`, `tenant_id`, `event_type`, `metadata`, timestamps                                                                                                                                                                                                                                                                                                                                                                                                           | Approved |

## Relationships

| From                            | Relationship | To                             | Notes                                                                                                               |
| ------------------------------- | ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `users`                         | belongs to   | `tenants`                      | `tenant_id` is required and indexed                                                                                 |
| `refresh_sessions`              | belongs to   | `users`                        | Revoke on logout, password reset, and the third wrong MFA code                                                      |
| `password_reset_tokens`         | belongs to   | `users`                        | Store only a token hash. A newer link, a completed password change, or a failed reset-link email marks the row used |
| `mfa_email_challenges`          | belongs to   | `users`                        | `user_id` `ON DELETE CASCADE`. Store only a token hash. `active` is the only status that can log in.                |
| `security_audit_events`         | references   | `users`, `tenants`             | Do not store secrets or raw tokens                                                                                  |
| `powerbi_reports`               | unique on    | `workspace_id`, `report_id`    | Power BI ids stored from Python                                                                                     |
| `powerbi_report_distributions`  | belongs to   | `powerbi_reports`, `tenants`   | `ON DELETE RESTRICT`; unique `(report_id, tenant_id)`                                                               |
| `project_workspaces`            | belongs to   | `tenants`                      | `ON DELETE RESTRICT`; indexed `tenant_id`                                                                           |
| `projects`                      | belongs to   | `project_workspaces`           | `ON DELETE CASCADE`                                                                                                 |
| `cards`                         | belongs to   | `projects`                     | `ON DELETE CASCADE`; unique `(project_id, number)`                                                                  |
| `cards`                         | references   | `users`                        | `created_by_user_id` `ON DELETE CASCADE`; `assignee_user_id` `ON DELETE RESTRICT` (reassigned before user delete)   |
| `cards`                         | references   | `card_attachments`             | `cover_attachment_id` `ON DELETE SET NULL`                                                                          |
| `card_comments`                 | belongs to   | `cards`, `users`               | Card `ON DELETE CASCADE`; author `ON DELETE CASCADE`                                                                |
| `card_attachments`              | belongs to   | `cards`, `users`               | Card `ON DELETE CASCADE`; uploader `ON DELETE CASCADE`; filesystem bytes removed with the row                       |
| `card_checklist_items`          | belongs to   | `cards`, `users`               | Card `ON DELETE CASCADE`; creator `ON DELETE CASCADE`                                                               |
| `project_documents`             | belongs to   | `projects`, `users`            | Project `ON DELETE CASCADE`; parent folder `ON DELETE CASCADE`; creator `ON DELETE CASCADE`                         |
| `project_contracts`             | belongs to   | `projects`, `users`            | Project `ON DELETE CASCADE`; unique `project_id`; creator `ON DELETE CASCADE`                                       |
| `finance_project_documents`     | belongs to   | `projects`, `tenants`, `users` | Project and tenant `ON DELETE CASCADE`; creator `ON DELETE CASCADE`; indexed by project and tenant                  |
| `project_payments`              | belongs to   | `projects`, `users`            | Project `ON DELETE CASCADE`; creator `ON DELETE CASCADE`                                                            |
| `project_costs`                 | belongs to   | `projects`, `users`            | Project `ON DELETE CASCADE`; creator `ON DELETE CASCADE`; unique `(project_id, position)`                           |
| `project_contract_installments` | belongs to   | `projects`, `users`            | Project `ON DELETE CASCADE`; creator `ON DELETE CASCADE`; unique `(project_id, position)`                           |
| `tenant_notes`                  | belongs to   | `tenants`, `users`             | Tenant `ON DELETE CASCADE`; creator `ON DELETE CASCADE`; no plaintext columns                                       |
| `tickets`                       | belongs to   | `tenants`, `users`             | Tenant and opener `ON DELETE RESTRICT`                                                                              |
| `ticket_attachments`            | belongs to   | `tickets`, `users`             | Ticket `ON DELETE CASCADE`; uploader `ON DELETE RESTRICT`                                                           |
| `ticket_comments`               | belongs to   | `tickets`, `users`             | Ticket `ON DELETE CASCADE`; author `ON DELETE RESTRICT`                                                             |
| `ticket_read_states`            | belongs to   | `tickets`, `users`             | Ticket and user `ON DELETE CASCADE`; unique `(ticket_id, user_id)`                                                  |

## Data lifecycle

| Concern          | Decision                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retention        | No automated purge is configured for portal, email-log, or audit records.                                                                                                                                                                                                                                                                                                                                                           |
| Deletion         | Expired and used reset tokens and MFA challenges are unusable; their hashes may remain stored. Project workspaces, projects, cards, comments, attachments, checklist items, and documents are hard-deleted with CASCADE. Attachment, document, and background files are removed from the tenant folder with the row. Deleting a user who opened a ticket or wrote a ticket comment fails with `400` and leaves the ticket in place. |
| Backups          | PostgreSQL backup and recovery follow the infrastructure deployment policy.                                                                                                                                                                                                                                                                                                                                                         |
| Sensitive fields | Lead inquiries are not stored. Passwords and raw tokens are never stored.                                                                                                                                                                                                                                                                                                                                                           |

`tenants.ai_token_cost_per_million` (`numeric(12, 4)`, not null, default
`0.6`) stores the Agente Beta price in BRL per million tokens. The product
keeps one price: an administrator save writes the same value on every row,
and a new tenant copies the current shared value.

The `tenants` table has unique constraints on `name` and `slug`. `email` is
nullable and unique when present; multiple empty or null emails are allowed.
`status` `active` is the stored usable value used by bootstrap `vetor` and
new tenant creates.

The `users` table has a unique composite constraint on `tenant_id` and
`email`. An `Administrador` may reassign `users.tenant_id` to another
existing tenant. A colliding email on that tenant is rejected and the
previous `tenant_id` stays. An `Administrador` user keeps a home tenant
association while ABAC grants access to all tenants without duplicating
the account.

Backend startup ensures tenant slug `vetor` (name `VETOR`) and user
`admin@vetor.tech` exist. The tenant id remains a generated UUID. If the user
already exists, startup does not insert a duplicate or change the stored
password hash. Missing profile fields on that administrator are filled with
`Admin`, `Vetor`, `40`, `M`, and `/brand/symbol-vetor.png`. The bootstrap
password is supplied by `BOOTSTRAP_ADMIN_PASSWORD` and stored only as a
bcrypt hash.

Each tenant has a server-side folder at
`infrastructure/repository/files/{tenantId}`. The backend creates that folder
when a tenant row is inserted, for tenant `vetor`, and for every tenant
already in the database. A refused tenant create (including a duplicate
`name`, `slug`, or non-empty `email`) does not create a folder. Folder paths
are not returned to the browser.

`users.photo_url` stores a filename pointer (`{userId}.{extension}`) for an
uploaded raster image, or `/brand/symbol-vetor.png` for the bootstrap
administrator until that user uploads an image. Image bytes are not stored
in PostgreSQL. Uploaded files
live under the tenant folder. The session photo field is an API-served URL
(`/api/v1/users/{id}/photo`) or the static brand path, never a filesystem
path.

`tenants.photo_url` stores a filename pointer (`{tenantId}.{extension}`) for
an uploaded raster image, or `''` when the tenant has no photo. The bootstrap
tenant starts with `''` and is not backfilled. Image bytes stay in
`infrastructure/repository/files/{tenantId}`. The session field
`tenantPhotoUrl` is `/api/v1/tenants/{tenantId}/photo` when a pointer exists,
and `''` otherwise. It is not a filesystem path and is not stored in the
access token.

`users.enabled_actions` stores the granted API values `painel`, `viewReports`,
`createUser`, `editUser`, `viewProjects`, `manageProjects`,
`moveCards`, `createLane`, `renameLane`, `deleteLane`, `createTenant`, and `vetorAgent`.
The array may be empty. `createLane`, `renameLane`, and `deleteLane` are
not implied for `AdministradorTenant`; only `Administrador` grants them.
Grants add to
`users.profile`:
`Administrador` is the global profile and keeps every mapped action even
when the array is empty. `AdministradorTenant` has `painel`, `viewReports`, `createUser`,
`editUser`, `viewProjects`, `manageProjects`, and `moveCards` on their home
tenant until `enabled_actions` stores an explicit tenant selection.
`vetorAgent` is not implied for `AdministradorTenant`. `createTenant` is not implied for
`AdministradorTenant`. Storing
`createTenant` on a non-`Administrador` user does not authorize tenant
create. Bootstrap `admin@vetor.tech` remains `Administrador` and does not
need the mapped values stored. `users.profile` allowed values are
`Administrador`, `AdministradorTenant`, and `Usuario`. `users.status`
`active` is the only value that can sign in, receive password recovery, or
receive an `Editar usuário` reset link.
`blocked` stays until `Administrador` or the tenant `AdministradorTenant`
sets it back to `active`.

Project Kanban persistence is tenant → `project_workspaces` → `projects` →
`cards` → `card_comments` / `card_attachments` / `card_checklist_items`, plus
`project_documents` (a per-project tree) and optional
`projects.background_filename`. A project has exactly one
board (the project plus its cards). Each project stores `next_card_number`
starting at 1; creating a card assigns that number and increments.
Deleted card numbers are not reused. Hard delete CASCADE removes
workspaces, projects, cards, comments, attachments, checklist items, and
documents. Attachment, document, background, and contract PDF files
are unlinked from `infrastructure/repository/files/{tenantId}` with the
row. Contract bytes live at `contracts/{projectId}.pdf` inside that folder. Folder paths and `filename` pointers are not returned to the browser;
download uses `/api/v1/cards/{id}/attachments/{attachmentId}` or
`/api/v1/projects/{id}/documents/{documentId}`. Optional
`metadata` jsonb on workspaces, cards, and comments is opaque extension
storage. `projects.metadata.kanbanFilters` stores the board filter selection
`{ status, date, taskCompletion }` described in `docs/api.md`.
`projects.metadata.kanbanLanes` stores `{ key, label, color }[]` when a
manager customizes lanes. Colors on one project are unique. Absent
`kanbanLanes` means the six default lanes.
`cards.lane` is a varchar key matching `^[a-z0-9-]{1,20}$`. Other project
metadata keys stay untouched when filters or lanes are saved.

`powerbi_reports` stores the imported catalog. `dataset_id` and `embed_url`
come from Python, not from the client. There is no RLS column and no modules
table. `powerbi_report_distributions` grants a tenant access to one catalog
row. Embed tokens are not persisted.

Financeiro project documents store only validated metadata in PostgreSQL.
Their bytes are written below
`infrastructure/repository/files/{vetorTenantId}/finance/{tenantId}/{projectId}/{documentId}.{extension}`.
The server resolves the VETOR tenant root and removes these bytes before the
existing project deletion cascade removes the metadata. The application caps
each project at 200 documents and 500 MiB of aggregate document bytes, with a
25 MiB per-file limit.

Operating expense documents use the same allowlist and 25 MiB file limit.
Each expense accepts 20 files and 100 MiB in total. Bytes are written below
`infrastructure/repository/files/{vetorTenantId}/expenses/{expenseId}/{documentId}.{extension}`.
Deleting a project or a tenant sets the expense client and project references
to null and keeps the company row. A category or subcategory that still has
an expense cannot be deleted.

AI conversations, messages, runs, and outbox events belong to the creating
user inside the authenticated tenant. Deleting that user or tenant cascades
to those rows. Row-Level Security is not enabled. Application queries carry
the tenant and owner predicates. Message and run foreign keys that point at
each other are deferred so one transaction can insert both. One assistant
message is stored per run. One `QUEUED` or `PROCESSING` run is allowed per
conversation. `ai_runs.tool_trace` is a nullable jsonb list of tool name,
outcome code, project id, and card id. It does not store titles,
descriptions, comments, or message text.

## Model status

- [x] Persistence is required by the product
- [x] Entities and relationships are documented
- [x] Sensitive data handling is defined
- [x] Migration plan is defined

The approved VETOR-003 specification requires the portal model. The leadpage
contact flow remains non-persistent.
