---
id: VETOR-015
title: Project financial control
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-21-financeiro-projetos
created_at: 2026-09-21
updated_at: 2026-10-27
---

# Project financial control

## Context

The requester asked for a `Financeiro` entry in the portal so VETOR can
control the money of projects that already exist: the contract (including
its PDF), the amount received per project, and costs. The screen must show,
per project and across tenants, how much was contracted, how much
has been received, how much is still open, how much was spent, and the
result.

Original request (Portuguese, preserved):

> Quero um botão Financeiro no portal para ter o controle financeiro
> completo dos projetos já existentes: contrato (incluindo o anexo), valor
> pago por projeto e custos. O resultado tem de mostrar, por projeto e no
> conjunto do tenant, quanto foi contratado, quanto já entrou, quanto falta
> receber, quanto custou e qual o resultado.

Follow-up on 2026-09-21 locked the surface, the formulas, who may read and
write, the currency, and the contract file. A later follow-up the same day
changed the tenant scope: the global `Administrador` manages finance for
every tenant from this page, including contract values, costs, and the
contract PDF. The page filters by tenant and does not change the portal
session. A later follow-up the same day moves contract editing into a
modal opened by `Novo Projeto` or a project row. The page totals omit
`Resultado` and `Resultado contratado`. The list shows tenant, workspace,
project, status, contract value, amount received, and cost. Those
decisions are recorded below.

VETOR-012 persists tenant → project workspace → project → one Kanban board,
and leaves billing out of scope. VETOR-014 adds the board visual treatment
and the project document tree. This specification does not change lanes,
cards, comments, checklist items, card attachments, or project documents.

Portal navigation today, in order, is `Painel`, `Relatórios`, `Projetos`
(when `viewProjects` applies), `Power BI` (`Administrador` only), and
`Cadastro`. Session JSON already includes `tenantId`, `tenantName`, and
`tenantSlug`. An `Administrador` changes session `tenantId` from Projetos
through `PATCH /api/v1/auth/session`. `AdministradorTenant` and `Usuario`
cannot switch tenant.

Project and workspace delete already hard-delete with CASCADE and unlink
tenant files. `Administrador` and `AdministradorTenant` may delete a
project or workspace (VETOR-012). This specification keeps that
authorization and extends the delete so financial rows and the contract
PDF are removed with the project.

UI language remains Portuguese (Brazil). This specification body is
English.

## Desired outcome

An `Administrador` sees `Financeiro` in the portal shell and opens
`/portal/financeiro` for every tenant. Every existing project appears
once, with its tenant, contract value, amount received, open balance,
cost, result (`received − cost`), and contracted result
(`contract value − cost`). Totals follow the visible tenant filter,
which defaults to all tenants and does not change the portal session.
The `Administrador` can save one contract per project, attach one current
PDF, and record payments and costs. Totals follow the formulas after each
save. `AdministradorTenant` and `Usuario` do not see the entry or the
figures, and the API responds `403`. A project with no financial rows
still appears, with zero amounts. Deleting the project removes the
financial record, the entries, and the contract file.

## In scope

- Sidebar item `Financeiro` in `PortalShell`, after `Projetos` and before
  `Power BI`, linking to `/portal/financeiro`. Shown only when
  `profile` is `Administrador`. Custom inline SVG in the existing shell
  stroke style (no icon library). Delivery chooses a ledger or coins
  pictogram. VETOR-036 replaces this navigation sentence: `Financeiro` is
  the parent button, and `Contratos` is the child link to
  `/portal/financeiro`.
- One page, heading `Financeiro`. No second product route. VETOR-036
  replaces the shell heading with `Contratos`. `Novo Projeto`
  and a project-row button open the shared `Modal` to edit that existing
  project's contract, contract value, paid amount, cost value, and PDF. The
  modal does not create a second project registry.
- Data scope is every tenant. The page shows a `Tenant` select whose
  first option is `Todas`. Choosing a tenant filters the table and the
  totals. It does not call `PATCH /api/v1/auth/session` and does not
  change Projetos.
- One financial record per existing project. The list is every tenant's
  projects (tenant → workspace → project). Do not create a second project
  registry. A project with no contract row and no entries still appears.
- Per project, one contract: title (`Número ou título`), signature date,
  start, end, total in BRL, status (`Rascunho`, `Vigente`, `Encerrado`,
  `Cancelado`), and one current PDF attachment.
- Payments received: many entries, each with date, amount in BRL, and
  optional note. Amount received is the sum. Open balance is contract
  total minus amount received.
- Costs: many manual entries, each with date, amount in BRL, category
  (`Equipe`, `Terceiro`, `Infraestrutura`, `Outro`), and optional note.
  Project cost is the sum.
- Project result is amount received minus cost. Contracted result is
  contract total minus cost. The API still returns both. The page does
  not show them in the totals strip or in the list.
- Read and write of contract, PDF, payments, and costs: authenticated
  `Administrador` only, for a project in any tenant. The PDF is stored in
  that project's tenant folder.
- Currency is BRL only. The database stores integer cents. The interface
  shows reais.
- Per-tenant encrypted notes on Financeiro: visible only when the tenant
  filter is a single tenant (not `Todas`). `Administrador` can create,
  edit, and delete notes. Title and body are encrypted at rest with
  AES-256-GCM using `NOTES_ENCRYPTION_KEY`. Cap 50 notes per tenant.
- Contract PDF: `application/pdf`, at most 10 MB, one current file per
  project. Replacing it removes the previous bytes. Storage is the
  existing tenant folder. Download is authenticated `Administrador` only.
- Create, edit, and delete of a payment or a cost.
- Remove the PDF without deleting the contract fields.
- Project delete and workspace delete (existing VETOR-012 authorization)
  remove financial rows and the contract file.
- Exact pt-BR copy in User experience.
- Approved delivery updates `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`.

## Out of scope

- Kanban lanes, cards, comments, checklist items, card attachments, board
  background, and project documents (VETOR-012 and VETOR-014 stay as
  approved)
- A second project or workspace registry
- A `PATCH /api/v1/auth/session` change on this page
- Bank integration, NF-e, tax, hours times rate, installment due dates,
  more than one contract per project, and export. Per-installment amounts
  and named cost lines are VETOR-027.
- A new `enabledActions` value, a Perfil checkbox, or any grant that lets
  `AdministradorTenant` or `Usuario` read or write finance
- Showing cost, result, contract value, payments, or the PDF to a tenant
  user
- Version history of the PDF
- Public or unauthenticated access
- Changing who may delete a project or workspace
- Implementation before a named human sets `status: approved`

## Acceptance criteria

- AC-001: An authenticated `Administrador` sees sidebar item `Financeiro`
  after `Projetos` and before `Power BI`, and can open
  `/portal/financeiro`. The heading is `Financeiro`. VETOR-036 replaces
  that navigation sentence: `Financeiro` is the parent, `Contratos` opens
  `/portal/financeiro`, and the shell heading is `Contratos`. The page offers a
  `Tenant` select defaulting to `Todas` and does not change the portal
  session. The list includes every project of every tenant with tenant
  name, workspace name, project name, contract status, contract value,
  amount received, and cost. The totals strip shows contract value, amount
  received, open balance, and cost for the visible rows. It does not show
  result or contracted result. `Novo Projeto` opens the finance modal.
- AC-002: A project with no contract row and no payment or cost rows
  appears in that list with zero amounts and status label `Sem contrato`.
  Opening Financeiro does not create a project.
- AC-003: An `Administrador` saves the contract, the contract value, the
  paid amount, and one cost value from the finance modal, and can attach,
  replace, and remove the PDF there. Saving the paid amount syncs payment
  rows so amount received matches that value. Saving the cost value stores
  that amount as the project cost. After a successful save the list amounts
  and the visible totals match the formulas in Data impact. `Em aberto` is
  the contract total minus the amount received.
- AC-004: The contract file is a PDF of at most 10 MB. A replacement
  overwrites the current contract file. A successful upload also stores
  that PDF as a finance project document. Download returns the PDF only to an
  authenticated `Administrador` for that project. Responses do not include
  a filesystem path.
- AC-005: `AdministradorTenant` and `Usuario` do not see `Financeiro`.
  Visiting `/portal/financeiro` does not show financial figures. Every
  finance endpoint returns `403` for those profiles, including when any
  `enabledActions` value is present. Unauthenticated callers receive
  `401`. Frontend hiding is UX only.
- AC-006: Projects from every tenant appear in the finance list. Finance
  reads and writes succeed for a project in another tenant. An unknown
  project id returns `404`.
- AC-007: Deleting a project removes its contract row, payments, costs,
  and contract file. Deleting a workspace does the same for each of its
  projects. Who may delete a project or workspace stays as in VETOR-012.
- AC-008: Invalid contract, payment, cost, or PDF input returns `400` and
  the copy in the validation table. Amounts are integer cents within the
  recorded bounds. The UI shows BRL, not raw cents.
- AC-009: Visible copy matches the copy table.
- AC-010: This specification does not add or change Kanban board behavior,
  project document behavior, or `enabledActions`.
- AC-011: When the tenant filter is a single tenant, Financeiro shows
  `Nova anotação` beside `Novo Projeto` in the toolbar and an `Anotações`
  post-it area below the totals strip and project table. Notes are per
  tenant, not per project. When the filter is `Todas`, the button and
  notes area are absent. Create, edit, and delete use the shared dark
  modal. Title and body are stored encrypted (AES-256-GCM); API
  responses return decrypted `title`/`body` only and never ciphertext,
  iv, auth tag, or filesystem paths. Missing or invalid
  `NOTES_ENCRYPTION_KEY` fails closed with `503` and message
  `Invalid input.` without persisting plaintext.

## User experience

`Financeiro` uses the existing portal shell: navy sidebar, off-white or
dark main area, Inter, and the tokens in `docs/design.md`. It is one
client page. No new visual language and no icon library.

1. An `Administrador` opens `Financeiro`. The main area shows the heading,
   the `Tenant` select on `Todas`, a `Novo Projeto` button, a totals
   strip, and the project table. The contract form is not inline. When a
   specific tenant is selected, `Nova anotação` appears beside
   `Novo Projeto`.
2. `AdministradorTenant` or `Usuario` does not see the sidebar item. If
   they open the URL, the main area shows only `Você não tem acesso ao
   financeiro.` and does not render amounts.
3. The totals strip shows `Valor do contrato`, `Pago`, `Em aberto`, and
   `Custo` for the visible rows. It does not show `Resultado` or
   `Resultado contratado`.
4. The table columns are `Tenant`, `Workspace`, `Projeto`, `Situação`,
   `Valor do contrato`, `Pago`, `Em aberto`, `Parcelas`, and `Custo`.
   `Em aberto` is the contract total minus the amount received. A project
   with no contract shows `—` in `Parcelas`. Each row has `Editar` and
   `Excluir`. `Editar` opens the finance modal for that project.
   `Excluir` asks `Excluir este projeto e todos os cards?` and, on
   confirm, deletes that project in any tenant, including its cards and
   finance, without changing the portal session. On viewports below the
   `lg` shell breakpoint the table scrolls horizontally
   (`overflow-x-auto`).
5. Empty tenant: `Nenhum projeto neste tenant.` The totals are zero.
6. Loading: a status `Carregando...`. Load failure: `Não foi possível
   carregar o financeiro.` Mutation failure: `Não foi possível concluir a
   operação.` Success: `Operação realizada com sucesso.`
7. `Novo Projeto` opens the shared `Modal` (`role="dialog"`, Escape and
   overlay dismissal). The heading is `Novo Projeto` until a project is
   chosen, then the project name. A `Projeto` select lists the visible
   rows as `Tenant · Workspace · Projeto`. Choosing one loads that
   project's finance. Primary controls are at least 40px tall. Labels in
   the dark modal are white; inputs stay light with navy text.
8. Modal fields: `Número ou título`, `Data de assinatura`, `Início`,
   `Fim`, `Valor do contrato`, `Valor pago`, `Número de parcelas`,
   `Valor do custo`, `Situação`, and `Anexo do contrato`. `Número de
   parcelas` is an integer from 1 through 120. Dates use the calendar date
   only. `Situação` is a select of the four status labels. Submit is
   `Salvar`. `Cancelar` closes the modal. The file control is a labelled
   `Enviar PDF` (hidden native file input, `accept="application/pdf"`).
   When a file exists, show its original name, `Baixar`, and `Excluir
   anexo`. `Excluir anexo` asks `Excluir o anexo do contrato?` with
   `Cancelar` and `Excluir`.
9. `Valor pago` is one amount for the project. Saving an amount of at
   least one cent stores it as the project amount received (create one
   payment when none exist, or update the first and delete the rest).
   Saving zero or empty removes the project's payment rows so `Pago` is
   zero. Installment amounts and named cost lines follow VETOR-027.
   `Em aberto` in the list is the contract
   total minus amount received (negative allowed when paid exceeds the
   contract).
10. Amount fields accept a pt-BR reais value (digits and one decimal
    comma). The client converts to integer cents before the request. The
    displayed amounts use `pt-BR` currency BRL. A negative open balance
    stays negative in that format.
11. While a mutation is in flight, its submit control is disabled. A
    successful save closes the modal and refreshes the list.
12. When the `Tenant` select is a specific tenant (not `Todas`),
    `Nova anotação` appears beside `Novo Projeto` in the top toolbar, and
    an `Anotações` area appears below the totals strip and project table.
    Saved notes render as title-only post-it cards in a wrapping row;
    clicking a card opens the edit modal. Empty: `Nenhuma anotação neste
    tenant.` Load failure: `Não foi possível carregar as anotações.`
    Mutation success and failure reuse the finance messages above.
    `Nova anotação` and clicking a post-it open the shared dark modal with
    white labels and light inputs for `Título` and `Anotação`, actions
    `Salvar` and `Cancelar`. When editing, `Excluir` is available in that
    modal and asks `Excluir esta anotação?` with `Cancelar` and `Excluir`.
    Choosing `Todas` hides the button and the notes area.

### Copy

| Element                      | Copy                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| Nav and heading              | `Financeiro`. VETOR-036 replaces the shell heading with `Contratos` and nests that destination under `Financeiro`. |
| Tenant filter                | `Tenant`, option `Todas`                                             |
| Forbidden                    | `Você não tem acesso ao financeiro.`                                 |
| Empty list                   | `Nenhum projeto neste tenant.`                                       |
| Loading                      | `Carregando...`                                                      |
| Load error                   | `Não foi possível carregar o financeiro.`                            |
| Mutation error               | `Não foi possível concluir a operação.`                              |
| Success                      | `Operação realizada com sucesso.`                                    |
| Missing contract status      | `Sem contrato`                                                       |
| Status values                | `Rascunho`, `Vigente`, `Encerrado`, `Cancelado`                      |
| Open finance                 | `Novo Projeto`                                                       |
| Project select               | `Projeto`, placeholder `Selecione um projeto`                        |
| Title field                  | `Número ou título`                                                   |
| Signature date               | `Data de assinatura`                                                 |
| Start / end                  | `Início`, `Fim`                                                      |
| Contract amount              | `Valor do contrato`                                                  |
| Paid amount                  | `Valor pago`, list and totals column `Pago`                          |
| Open balance                 | List and totals column `Em aberto` (contract total minus paid)       |
| Installments                 | `Número de parcelas`, list column `Parcelas`, empty `—`              |
| Cost amount                  | `Valor do custo`                                                     |
| Status field                 | `Situação`                                                           |
| File section                 | `Anexo do contrato`                                                  |
| File actions                 | `Enviar PDF`, `Baixar`, `Excluir anexo`                              |
| Totals                       | `Valor do contrato`, `Pago`, `Em aberto`, `Custo`                    |
| List columns                 | `Tenant`, `Workspace`, `Projeto`, `Situação`, `Valor do contrato`, `Pago`, `Em aberto`, `Parcelas`, `Custo` |
| Modal actions                | `Salvar`, `Cancelar`, `Excluir`                                      |
| Row actions                  | `Editar`, `Excluir`                                                  |
| Confirm delete project       | `Excluir este projeto e todos os cards?`                             |
| Confirm delete file          | `Excluir o anexo do contrato?`                                       |
| Notes section                | `Anotações`, `Nova anotação`                                         |
| Note fields                  | `Título`, `Anotação`                                                 |
| Empty notes                  | `Nenhuma anotação neste tenant.`                                     |
| Notes load error             | `Não foi possível carregar as anotações.`                            |
| Confirm delete note          | `Excluir esta anotação?`                                             |

### Validation copy

| Condition                                      | Copy                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| Missing required field                         | `Preencha todos os campos obrigatórios.`                             |
| End before start                               | `A data de fim deve ser igual ou posterior à data de início.`        |
| PDF type, magic bytes, or size                 | `O anexo deve ser um PDF de no máximo 10 MB.`                        |
| Amount out of range                            | `Informe um valor válido em reais.`                                  |
| Installment count out of range                 | `Informe o número de parcelas entre 1 e 120.`                        |
| 501st payment or 501st cost                    | `Este projeto já tem o máximo de lançamentos.`                       |

Stored status keys are `draft`, `active`, `closed`, and `cancelled`.
Stored category keys are `team`, `third_party`, `infrastructure`, and
`other`. The interface never shows the stored keys.

## API and integrations

No external integration. JSON except the PDF upload and download.
Identifiers are UUIDs. Dates are `YYYY-MM-DD`. Amounts in JSON are
integer cents (safe integers). Errors use the existing Nest HTTP
exception body. Controllers return DTOs, not entities.

All routes require the access cookie. Authorization is `profile`
`Administrador` only. A missing project id is `404`. Unauthenticated: `401`. Any other
profile: `403`.

| Method | Route | Request | Response | Errors |
| ------ | ----- | ------- | -------- | ------ |
| GET | `/api/v1/finance/projects` | None | `{ tenantId, tenantName, projects, totals }` | `401`, `403` |
| GET | `/api/v1/projects/{id}/finance` | None | Project finance DTO | `401`, `403`, `404` |
| PUT | `/api/v1/projects/{id}/contract` | Contract JSON | Contract DTO | `400`, `401`, `403`, `404` |
| POST | `/api/v1/projects/{id}/contract/file` | multipart field `file` | `{ hasFile, originalName }` | `400`, `401`, `403`, `404` |
| GET | `/api/v1/projects/{id}/contract/file` | None | PDF bytes | `401`, `403`, `404` |
| DELETE | `/api/v1/projects/{id}/contract/file` | None | `204` | `401`, `403`, `404` |
| POST | `/api/v1/projects/{id}/payments` | Payment JSON | `201` payment DTO | `400`, `401`, `403`, `404` |
| PATCH | `/api/v1/projects/{id}/payments/{paymentId}` | Payment JSON | Payment DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/projects/{id}/payments/{paymentId}` | None | `204` | `401`, `403`, `404` |
| POST | `/api/v1/projects/{id}/costs` | Cost JSON | `201` cost DTO | `400`, `401`, `403`, `404` |
| PATCH | `/api/v1/projects/{id}/costs/{costId}` | Cost JSON | Cost DTO | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/projects/{id}/costs/{costId}` | None | `204` | `401`, `403`, `404` |
| GET | `/api/v1/finance/tenants/{tenantId}/notes` | None | Note DTO array | `401`, `403`, `404`, `503` |
| POST | `/api/v1/finance/tenants/{tenantId}/notes` | `{ title, body }` | `201` note DTO | `400`, `401`, `403`, `404`, `503` |
| PATCH | `/api/v1/finance/tenants/{tenantId}/notes/{noteId}` | `{ title, body }` | Note DTO | `400`, `401`, `403`, `404`, `503` |
| DELETE | `/api/v1/finance/tenants/{tenantId}/notes/{noteId}` | None | `204` | `401`, `403`, `404`, `503` |

`GET /api/v1/finance/projects` returns every project of every tenant,
ordered by workspace name then project name using a pt-BR
case-insensitive order. One query with aggregates. No pagination in this
version. Each project object:

```json
{
  "projectId": "uuid",
  "projectName": "string",
  "workspaceId": "uuid",
  "workspaceName": "string",
  "contract": null,
  "paidAmountCents": 0,
  "openAmountCents": 0,
  "costAmountCents": 0,
  "resultAmountCents": 0,
  "contractedResultAmountCents": 0
}
```

`contract` is `null` when no contract row exists. Otherwise:

```json
{
  "title": "string",
  "signedOn": "YYYY-MM-DD",
  "startsOn": "YYYY-MM-DD",
  "endsOn": "YYYY-MM-DD",
  "totalAmountCents": 0,
  "status": "draft",
  "hasFile": false,
  "originalName": null
}
```

Nullable dates and `originalName` are JSON `null` when unset. `totals`
repeats the six amount fields, each the sum of the list. There is no
`hasFile` or name on the list item beyond the contract object; the list
does not need entry arrays.

`GET /api/v1/projects/{id}/finance` returns the same project summary plus
`payments` and `costs`. A payment is `{ id, paidOn, amountCents, note }`.
A cost is `{ id, incurredOn, amountCents, category, note }`. `note` is
`null` when empty. Payments and costs are ordered by their date
descending, then `created_at` descending. This call does not create a
contract row.

Contract JSON for PUT: `title` (required, trimmed, 1–160), `signedOn`,
`startsOn`, `endsOn` (each optional `YYYY-MM-DD` or omitted),
`totalAmountCents` (required integer, 0 through 99999999999), `status`
(required, one of the four stored keys). When both start and end are
present, end must be on or after start. PUT upserts the single contract
row. It does not change the file.

Payment JSON: `paidOn` (required date), `amountCents` (required integer,
1 through 99999999999), `note` (optional, trimmed, max 500, blank stored
as null). Cost JSON adds required `category` (one of the four stored
keys). The 501st payment or 501st cost on that project is `400`.

PDF upload: field name `file`, declared type `application/pdf`, size
1 byte through 10 MiB (10 × 1024 × 1024), and the existing `%PDF` magic
check (`isPdfBuffer`). Reject other types, empty files, and oversize
files with `400`. Store under the tenant folder as
`contracts/{projectId}.pdf`. Persist the pointer and the sanitized
original name on the contract row, creating the row with empty title
rejected — the PDF upload requires an existing contract row (`404` when
the contract was never saved). After the contract file is stored, the
same PDF bytes are also stored as a finance project document so the file
appears in `Arquivos do projeto`. Deleting the contract attachment does
not delete that project document. Download uses `Content-Type:
application/pdf` and `Content-Disposition: attachment` with the sanitized
original name, same serving style as the user photo GET. DELETE file
unlinks the bytes and clears the pointer and original name; the contract
fields remain. Replace writes the new bytes only after validation, then
unlinks any previous different bytes; a failed write leaves the previous
file in place. Because the pointer path is stable, replace overwrites
that path after the new buffer is accepted.

Unknown JSON properties are rejected. Do not accept `projectId`,
`tenantId`, file paths, or computed totals from the client.

Tenant notes: `title` (required, trimmed, 1–120) and `body` (required,
trimmed, 1–4000). Stored as AES-256-GCM over JSON `{ title, body }` with
a random 12-byte IV. Columns are `ciphertext`, `iv`, and `auth_tag`
only. The key is `NOTES_ENCRYPTION_KEY` (base64 of exactly 32 bytes).
Missing or invalid key yields `503` with message `Invalid input.` and
does not persist plaintext. Responses are `{ id, title, body, updatedAt }`
ordered by `updatedAt` descending. The 51st note on a tenant is `400`.
A note id that does not belong to the path tenant is `404`. Do not accept
`tenantId` in the body. Cap is application-enforced at 50 notes per
tenant.

Existing `DELETE /api/v1/projects/{id}` and
`DELETE /api/v1/project-workspaces/{id}` stay as authorized in VETOR-012.
Their service path unlinks each removed project's contract file and the
database CASCADE removes the rows.

## Data impact

Three new tables. Integer cents use `bigint`. Calendar dates use
PostgreSQL `date` so a contract day does not shift with timezone.
Timestamps use `timestamptz`. No float amount. No soft delete. Encrypted
tenant notes use a fourth table, `tenant_notes`.

| Table | Columns |
| ----- | ------- |
| `project_contracts` | `id` uuid, `project_id` uuid unique, `title` varchar 160, `signed_on` date null, `starts_on` date null, `ends_on` date null, `total_amount_cents` bigint not null, `installment_count` integer not null, `status` varchar 30 not null, `contract_filename` varchar 255 null, `original_name` varchar 255 null, `byte_size` integer null, `created_by_user_id` uuid, timestamps |
| `project_payments` | `id` uuid, `project_id` uuid, `paid_on` date not null, `amount_cents` bigint not null, `note` varchar 500 null, `created_by_user_id` uuid, timestamps |
| `project_costs` | `id` uuid, `project_id` uuid, `incurred_on` date not null, `amount_cents` bigint not null, `category` varchar 30 not null, `note` varchar 500 null, `created_by_user_id` uuid, timestamps |
| `tenant_notes` | `id` uuid, `tenant_id` uuid, `ciphertext` bytea, `iv` bytea (12), `auth_tag` bytea (16), `created_by_user_id` uuid, timestamps. Plaintext is never a column |

Check constraints: contract status in (`draft`, `active`, `closed`,
`cancelled`); contract `total_amount_cents` between 0 and 99999999999
inclusive; `installment_count` between 1 and 120 inclusive; payment and cost `amount_cents` between 1 and 99999999999
inclusive; cost category in (`team`, `third_party`, `infrastructure`,
`other`); `byte_size` null or 1 through 10485760; note `iv` length 12,
`auth_tag` length 16, `ciphertext` 1 through 16384 bytes.

Relationships:

| From | To | Delete |
| ---- | -- | ------ |
| `project_contracts.project_id` | `projects` | `ON DELETE CASCADE` |
| `project_payments.project_id` | `projects` | `ON DELETE CASCADE` |
| `project_costs.project_id` | `projects` | `ON DELETE CASCADE` |
| `tenant_notes.tenant_id` | `tenants` | `ON DELETE CASCADE` |
| each `created_by_user_id` | `users` | `ON DELETE RESTRICT` |

Index every foreign key. Unique `project_contracts.project_id`.

Formulas, computed in the service, not stored:

- Amount received = sum of that project's payment `amount_cents` (0 when
  none).
- Cost = sum of that project's cost `amount_cents` (0 when none).
- Contract total = the contract `total_amount_cents`, or 0 when no
  contract row.
- Open balance = contract total − amount received.
- Result = amount received − cost.
- Contracted result = contract total − cost.

Open balance, result, and contracted result may be negative. Do not clamp
them. Payments and costs may exist when the contract total is 0.

The contract file pointer is `contracts/{projectId}.pdf` relative to
`infrastructure/repository/files/{tenantId}`. Bytes are not stored in
PostgreSQL. The browser never receives the pointer or an absolute path.
`original_name` is the download name only.

A missing contract row means `Sem contrato` and a zero contract total. The
first successful PUT creates the row. Listing finance does not insert
rows.

Delivery adds one new TypeORM migration. `synchronize` stays false.

## Security

Policy recorded from the human request, applied with the existing portal
controls:

- Authentication is the existing access cookie. No new public route.
- Authorization is `Administrador` only for every finance route, including
  download. `AdministradorTenant` and `Usuario` receive `403` even if
  `enabledActions` contains any current or future value. Do not add a
  finance grant to the catalog.
- Frontend hiding of `Financeiro` is UX only.
- An `Administrador` may read and write finance for every tenant. The
  select on this page does not change the portal session. A missing
  project id is `404`. `AdministradorTenant` and `Usuario` still receive
  `403` on every finance route.
- DTOs omit filesystem paths, `created_by_user_id`, secrets, and tokens.
  Note responses omit ciphertext, iv, and auth tag.
- Do not log amounts, PDF bytes, cookies, file paths, note plaintext,
  ciphertext, or `NOTES_ENCRYPTION_KEY`.
- Validate MIME, `%PDF` magic, size, and the original name. Never execute
  the upload. Never trust the client path. Reject `..`, absolute paths,
  and `\`.
- Note encryption uses AES-256-GCM. Fail closed when
  `NOTES_ENCRYPTION_KEY` is missing or not exactly 32 decoded bytes.
- PDF upload requires a contract row already saved by this same
  `Administrador` flow, so a file cannot be stored without a project.
- Project and workspace delete authorization is unchanged from VETOR-012.
  `AdministradorTenant` can still delete a project and, by the required
  CASCADE, that delete removes financial rows and the PDF they are not
  allowed to read. This specification does not add a new restriction on
  project delete.
- No new rate-limit policy. These routes are authenticated mutations
  under the existing portal auth throttling, not new public routes.
- Do not weaken CORS, Helmet, or cookie flags.

## Testing

- AC-001: `frontend/components/finance/finance-home.spec.tsx` renders the
  nav item only for `Administrador`, the heading, the tenant select on
  `Todas`, one row per project, `Novo Projeto`, and totals without
  `Resultado` or `Resultado contratado`.
- AC-002: a project with a null contract renders `Sem contrato` and zero
  BRL amounts. The list request is a GET and does not POST a project.
- AC-003: component test opens the modal, saves a contract, a paid
  amount, and one cost amount, and shows the refreshed contract, paid,
  open, and cost amounts. Backend unit test covers the six
  formulas, including a negative open balance and a negative result.
  `backend/test/finance.e2e-spec.ts` covers PUT, PDF POST, payment and
  cost POST/PATCH/DELETE, and the following GET totals.
- AC-004: e2e rejects a non-PDF and a file larger than 10 MB with `400`;
  a second upload keeps one pointer and GET returns PDF bytes for
  `Administrador`. JSON bodies have no filesystem path. The unit test
  overwrites the stable pointer without deleting first, and unlinks the
  file when the attachment or the project is removed.
- AC-005: shell test hides the item for `AdministradorTenant` and
  `Usuario` and shows the forbidden copy. E2E expects `401` without a
  cookie and `403` for both non-`Administrador` profiles on each finance
  route.
- AC-006: e2e loads finance for a project in another tenant, includes
  that project in `GET /api/v1/finance/projects`, and returns `404` for
  an unknown project id. The component test filters the table with
  `Todas` and a single tenant.
- AC-007: `projects.service.spec.ts` deletes a project and a workspace
  and asserts `unlinkContractFiles` runs before the row delete. Migration
  `ON DELETE CASCADE` removes the contract, payments, and costs. Delete
  authorization stays the VETOR-012 HTTP routes.
- AC-008: e2e `400` for missing title, end before start, zero payment
  amount, unknown status, unknown category, and the 501st entry. The
  component formats cents as pt-BR BRL.
- AC-009: component test asserts the copy table labels used on the page.
- AC-010: no new `enabledActions` value in portal action tests; project
  board tests stay green without a finance control on the board.
- AC-011: component test keeps `Nova anotação` hidden on `Todas`, shows
  it beside `Novo Projeto` for one tenant, and creates a note whose
  post-it shows the title. Unit tests assert ciphertext excludes
  plaintext, list decrypts, missing tenant and cross-tenant note are
  `404`, the 51st note is `400`, and a missing key does not persist
  plaintext.

Commands after approved delivery: frontend and backend `typecheck`,
`lint`, `test`, `build`; backend `test:e2e`; `npm run sdd:validate`.

## Delivery

This specification is `implemented`. A named human approved it via `/goal`
on 2026-09-21. Delivery promoted the durable decisions into
`docs/product.md`, `docs/design.md`, `docs/api.md`, `openapi.yaml`,
Swagger, and `docs/database.md`.

Placement:

- Frontend: `frontend/app/portal/financeiro/page.tsx`,
  `frontend/components/finance/finance-home.tsx` and
  `finance-home.spec.tsx`, nav in
  `frontend/components/layout/portal-shell.tsx`, API calls in
  `frontend/lib/api/client.ts`, money helpers in `frontend/lib/finance.ts`
- Backend: finance controllers, DTOs, entities,
  `ProjectFinanceService`, and `TenantNotesService` inside
  `backend/src/modules/projects/`, reusing `isPdfBuffer` and the tenant
  folder helper. Project and workspace delete unlink
  `contracts/{projectId}.pdf`. Migrations
  `1760000007000-add-project-finance.ts` and
  `1760000009000-add-tenant-notes.ts`.
  `backend/test/finance.e2e-spec.ts`
- Contracts: `docs/product.md`, `docs/design.md`, `docs/api.md`,
  `openapi.yaml`, Swagger, and `docs/database.md`

No new npm dependency. No new workspace package. No new `enabledActions`
grant.

## Traceability

- Source: `chat-2026-09-21-financeiro-projetos` (`human_prompt`)
- Extends projects from VETOR-012 without changing Kanban scope
- Does not change VETOR-014 documents or board visuals
- Session tenant switch remains VETOR-012 `PATCH /api/v1/auth/session` on
  Projetos
- File hosting remains the VETOR-009 tenant folder
- PDF magic check reuses the existing `isPdfBuffer` helper
- Approved by the human `/goal` on 2026-09-21 and promoted into the
  global contracts in the same delivery

## Implementation evidence

- Changed: `backend/src/modules/projects/` (finance controllers, DTOs,
  entities, `ProjectFinanceService`, `finance-amounts.ts`,
  `attachment-file.ts`, `attachment-upload.ts`, delete unlink in
  `ProjectsService`), `backend/src/modules/portal/tenant-storage.service.ts`,
  `backend/src/modules/portal/multer-exception.filter.ts`,
  `backend/src/database/migrations/1760000007000-add-project-finance.ts`,
  `backend/test/finance.e2e-spec.ts`, `backend/test/openapi-contract.spec.ts`,
  `frontend/app/portal/financeiro/page.tsx`,
  `frontend/components/finance/finance-home.tsx`,
  `frontend/components/layout/portal-shell.tsx`,
  `frontend/lib/api/client.ts`, `frontend/lib/finance.ts`,
  `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`,
  `openapi.yaml`
- Tests: `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run test:e2e`, `npm run build`, and `npm run sdd:validate` passed
  on 2026-09-21. Backend unit tests cover the six formulas, the 501st
  entry, other-tenant `404`, PDF magic, pointer overwrite, and unlink on
  project and workspace delete. Frontend tests cover the nav, forbidden
  copy, zero contract, and the finance modal (contract value, paid amount,
  and cost value). The later UI follow-up was checked with frontend
  typecheck, lint, `finance-home.spec.tsx`, `npm run build --workspace
  frontend`, and `npm run sdd:validate`. Backend e2e was not re-run for
  that follow-up because the HTTP contract did not change.
  `backend/test/finance.e2e-spec.ts` covers the finance HTTP routes,
  `400` validation, `401`, and `403`.

## Validation evidence

- AC-001: not validated
- AC-002: not validated
- AC-003: not validated
- AC-004: not validated
- AC-005: not validated
- AC-006: not validated
- AC-007: not validated
- AC-008: not validated
- AC-009: not validated
- AC-010: not validated
