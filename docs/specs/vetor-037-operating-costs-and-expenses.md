---
id: VETOR-037
title: Operating costs and expenses
status: approved
source_kind: human_prompt
source_reference: chat-2026-10-27-custos-e-despesas
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Operating costs and expenses

## Context

The authenticated portal sidebar shows `Financeiro` as a parent button and
`Contratos` as its only child. `Contratos` opens `/portal/financeiro` and
keeps the project-contract screen from VETOR-015, VETOR-026, and VETOR-027.
Only `Administrador` sees that tree. VETOR-036 left a second child unnamed.

The human asked for a sibling below `Contratos`, labeled `Custos e Despesas`,
and for a module that records, classifies, and follows the company's own
operating expenses. The examples are marketing campaigns, LLM and API
consumption, VPS and cloud, software licenses, and administrative services.
The human attached a light-theme screen reference for the list: month, category,
and status filters, four summary cards, a table, `Nova despesa`, search, and
pagination. The rows and amounts in that reference are visual only.

This module is a company ledger. It is not a second copy of project cost lines,
and it does not change contract value, amount received, project cost, or
project result.

UI language remains Portuguese (Brazil). This specification body is English.

### What the human stated

- A `Custos e Despesas` control directly under the `Contratos` link.
- List, create, edit, and cancel expense entries. Cancel keeps history.
- Categories and subcategories, including the initial tree in Data impact,
  manageable in the interface. No physical delete of a category that has
  entries.
- Optional recurrence, monthly or yearly. Each occurrence is its own entry.
  The series is not an extra expense. Repeating generation must not duplicate
  an occurrence.
- Competence, due date, and payment date are different facts. A payment date
  exists only after the payment happened.
- Attachments for invoices, receipts, payment proofs, supplier bills, and
  other related documents. Reuse the platform file service. Do not store
  file bytes in PostgreSQL.
- Search, filters, sort, pagination, and summary cards from persisted rows.
- Optional links to a client, a project, or a cost center when that record
  already exists. Do not duplicate those records and do not add another
  finance module.
- BRL display, Brazilian dates, loading, empty, error, and cancel confirmation.
- The existing authentication and authorization. Do not invent a role.
- The screen reference is visual. Do not persist its sample rows.

Follow-up on 2026-10-27, after the draft questions:

- Q-001: `Pagas` uses the payment date. The human answered `Data do pagamento`.
- Q-002: The human sets how many months to add and the payment start date.
  Saving projects one expense for each following month. Edit asks whether the
  change applies to one expense or to the whole series. Cancel applies to one
  expense, to a selected group, or to the whole series.
- Q-003: An expense can be edited in any status.

### What this draft decides

Design and technical choices below are proposals for approval. They follow
`docs/design.md`, the finance money representation, the ticket list
pagination, and the finance document file policy. The three answers above are
business decisions. The projection mechanics that follow them are technical.

## Desired outcome

An `Administrador` sees `Custos e Despesas` under `Financeiro`, below
`Contratos`, and opens one company ledger. The list shows the selected
competence month, the four persisted summaries, and the matching entries.
`Pagas` follows the payment date. The same person can register an expense,
project a monthly or yearly series from a start date and a count, edit any
status, and cancel one row, several rows, or the series without deleting
history. Other profiles do not see the control or the figures. `Contratos`
stays the project-finance screen it is today.

## In scope

Human requirements:

- Sidebar child `Custos e Despesas` immediately below `Contratos`.
- List with period, category, subcategory, status, supplier, expense type,
  and project filters, plus search, clear, sort, and pagination.
- Summary cards for the period total, the paid total, the pending total, and
  the valid entry count.
- Create and edit with the required and optional fields in User experience.
- Cancel that keeps the row and removes it from the summaries.
- The initial category tree, plus create, rename, and inactivate for
  categories and subcategories.
- Separate competence, due date, and payment date.
- Expense types `Fixa`, `Variável`, and `Eventual`.
- Statuses `Pendente`, `Pago`, and `Cancelado`.
- Document attach and download.
- `Pagas` summed by payment date inside the selected month.
- Recurrence projected on save from a count and `Data de início do pagamento`.
- A choice, on edit, between one expense and the whole series.
- Cancel of one expense, of the selected expenses, or of the whole series.
- Edit allowed in `Pendente`, `Pago`, and `Cancelado`.
- pt-BR copy, BRL, and the loading, empty, error, and confirmation states.

Technical proposals:

- New route `/portal/financeiro/despesas`. `Contratos` remains
  `/portal/financeiro`.
- Create at `/portal/financeiro/despesas/nova`, read at
  `/portal/financeiro/despesas/{id}`, and edit at
  `/portal/financeiro/despesas/{id}/editar`.
- A Nest module `backend/src/modules/expenses/` and the HTTP API below.
- Amounts as integer cents, the same representation as project finance.
- One company ledger. The portal session tenant does not filter it.
- Optional client is an existing tenant. Optional project is an existing
  project. Supplier and payment method are text on the expense, because no
  supplier or payment-method registry exists.
- No cost-center field, because no cost-center entity exists.
- File bytes through `TenantStorageService`, under the bootstrap tenant
  `vetor`, using the finance-document type and size checks.
- Summary and page rows come from one filtered query. The cards are not
  computed from the current page, and the screen reference amounts are not
  seeded.

## Out of scope

Stated by the human:

- Financial overview, contract management, accounts payable, accounts
  receivable, cash flow, managerial income statement, and bank reconciliation.
- Automatic Meta Ads, Google Ads, LLM usage, bank, invoice, tax, accounting,
  or budget integrations.
- Client profitability dashboards.
- Any change to the finance hierarchy already implemented.
- Another finance module beyond this ledger.

Also out of this specification:

- Changing `Contratos` formulas, the tenant filter, contract modal,
  installments, project cost lines, finance PDFs, project documents, or
  encrypted notes.
- Renaming `/portal/financeiro` or moving its screen.
- A new `enabledActions` value or a grant for `AdministradorTenant` or
  `Usuario`.
- Seeding the reference rows: AWS, Meta Ads, Cursor Pro, OpenAI API, VPS, or
  their amounts.
- A supplier registry, a payment-method registry, or a cost-center registry.
- Physical delete of an expense.
- Creating an expense already cancelled. A later edit can change the status.
- A scheduled job that keeps generating months after the saved count.
- Preview, OCR, or conversion of attachments.
- Implementation before a named human sets `status: approved`.

## Acceptance criteria

- AC-001: An `Administrador` sees `Financeiro` in its current position and
  sees `Custos e Despesas` directly under `Contratos`. The new control links
  to `/portal/financeiro/despesas`. `Contratos` still links to
  `/portal/financeiro`. On the new route the new control is current and
  `Contratos` is not. Sidebar search still finds `Financeiro`, `Contratos`,
  and `Custos e Despesas`.
- AC-002: The list uses the portal shell, heading `Custos e Despesas`, the
  period control, the four cards, `Nova despesa`, the table columns in User
  experience, and the pager. A database with no expenses shows the empty
  copy and zero summaries. It does not show the reference amounts.
- AC-003: Period, category, subcategory, status, supplier, type, project,
  and search filter the table by competence month. `Limpar filtros` returns
  to the current competence month and clears the other filters. Sort and
  pagination run on the server. `Despesas do mês`, `Pendentes`, and
  `Lançamentos` use that full filtered set, not the current page. `Pagas`
  uses the payment-date rule in AC-008.
- AC-004: An `Administrador` creates an expense and edits it in any status.
  Description, category, amount, competence, and type are required on a
  one-off expense. Subcategory, supplier, due date, payment date, payment
  method, notes, client, and project are optional. Amounts are integer cents
  from 1 through 99999999999. Competence, due date, and payment date are
  stored separately. Payment date is accepted only with status `paid`.
  Setting `Pendente` clears the payment date. An edit can move a cancelled
  expense back to `Pendente` or `Pago`.
- AC-005: Cancelling one expense, the expenses selected on the page, or every
  expense in a series keeps each row, sets status `cancelled`, and removes
  those rows from all four summaries. The rows remain available when the
  status filter includes cancelled. A second cancel of a row that is already
  cancelled leaves that row cancelled.
- AC-006: The initial category tree is present after migration. An
  `Administrador` can create, rename, and inactivate a category or
  subcategory. A category or subcategory that has an expense cannot be
  physically deleted. An inactive category cannot be chosen for a new
  expense. Existing rows keep the inactive name.
- AC-007: An attachment is stored as bytes outside PostgreSQL and downloaded
  only by an authenticated `Administrador`. The finance-document allowlist
  and 25 MB file limit apply. The response has no filesystem path. Files of
  an expense in any status can be downloaded and removed by that profile.
- AC-008: While the list request is in flight, the cards do not show zero as
  if it were the result. An error shows the failure copy and no invented
  totals. After success, `Despesas do mês`, `Pendentes`, and `Lançamentos`
  follow the competence month and exclude cancelled rows. `Pagas` sums
  `paid` rows whose `paid_on` falls in the selected month, using the other
  filters and ignoring competence. The `Pagas` card states that it uses the
  payment date. A paid row whose payment month differs from its competence
  month counts in `Pagas` for the payment month.
- AC-009: `AdministradorTenant` and `Usuario` do not see `Financeiro` or
  `Custos e Despesas`. A direct visit shows `Você não tem acesso ao
  financeiro.` and no figures. Every new expense endpoint returns `403` for
  those profiles and `401` without a session.
- AC-010: Saving a recurrence of N months or N years from a start date
  creates N expenses, one per step, each `pending` and without a payment
  date. The series row is not an extra expense. Repeating generation for the
  same series and competence does not create a second row. Edit requires a
  choice of this expense or the whole series. This expense stops receiving
  later series edits. The whole series updates the shared fields of the
  expenses that still follow it. Raising the count appends the missing
  pending months. Lowering the count cancels the pending months beyond the
  new end.
- AC-011: Project contract totals, payments, cost lines, documents, and notes
  behave as they do today. Deleting a project or a tenant does not delete a
  company expense.
- AC-012: Loading, empty, error, validation, and cancel confirmation use the
  copy table. The layout remains usable at the portal mobile width and in
  the existing dark shell tokens.

## User experience

The page uses `AuthenticatedPortal` and `PortalShell`, the same way
`/portal/financeiro` does. The shell heading is `Custos e Despesas` on the
list, create, detail, and edit routes. The body does not repeat that heading
as a second title. Content width is `max-w-[1440px]`. Gutters stay on the
shell. Light surfaces are white on `off-white`. Dark surfaces use the
existing `dark:bg-navy` and `dark:text-white` pairs. Icons are custom inline
SVG. Focus uses the accent ring. Primary controls are at least 40px tall.
No icon library and no second palette.

The reference still marks `Contratos` as the current item because it was
composed on today's shell. On this route, `Custos e Despesas` is the current
item.

### Sidebar

`Financeiro` stays a parent button with the ledger icon. It toggles
`aria-expanded` and is not a link. The child list is the existing indented
`ul`. Order is `Contratos`, then `Custos e Despesas`. Neither child has an
icon. The current child uses the accent pill and `aria-current="page"`.
The tree starts expanded only on a Financeiro route. On every other route,
including Power BI, it stays collapsed until the Financeiro button is
clicked. Choosing either child closes the mobile drawer.

Search keeps the parent when the query is contained in `financeiro`,
`contratos`, or `custos e despesas`. A match on a child shows that child
even when the tree was collapsed.

### List

The first row matches the reference. `Período`, `Categoria`, and `Status`
are white rounded cards. `Nova despesa` is the accent pill at the right of
that row: navy text, a custom plus mark, and a link to
`/portal/financeiro/despesas/nova`. `Subcategoria`, `Fornecedor`, `Tipo`,
and `Projeto` open from `Mais filtros`. `Limpar filtros` and `Categorias`
sit beside that control.

Filters, in order:

| Control        | Label           | Behavior                                                |
| -------------- | --------------- | ------------------------------------------------------- |
| Month          | `Período`       | Competence month for the table and for every card except `Pagas`. Default is the current month in `America/Sao_Paulo`. Options run from 24 months before through 120 months ahead, labeled `Outubro 2026`. |
| Category       | `Categoria`     | `Todas`, then categories by position. Inactive categories remain available so old rows can be found. |
| Subcategory    | `Subcategoria`  | `Todas`. Narrows to the selected category. |
| Status         | `Status`        | `Todos`, `Pendente`, `Pago`, `Cancelado`. Default `Todos`. |
| Supplier       | `Fornecedor`    | Text contains, case insensitive.                        |
| Type           | `Tipo`          | `Todos`, `Fixa`, `Variável`, `Eventual`.                |
| Project        | `Projeto`       | `Todos`, then `{tenant} — {project}`.                   |
| Clear          | `Limpar filtros` | Restores the defaults and page 1.                      |

Under the filters, one line states the table period:
`Competência: Outubro 2026`. The month name follows the selected period.

Four cards follow, in one column on small screens, two from `md`, and four
from `lg`. Each card is white, `rounded-2xl`, `border-navy/10`, with a 2px
accent strip on the top edge. The label is the short uppercase name on the
left. The value uses `formatCentsBRL` except the count, which is an integer.
A decorative SVG sits on the right and is `aria-hidden`.

| Card label         | Value |
| ------------------ | ----- |
| `Despesas do mês`  | Sum of non-cancelled expenses whose competence is the selected month, after category, subcategory, status, supplier, type, project, and search. |
| `Pagas`            | Sum of expenses with status `paid` whose `paid_on` falls in the selected month. Category, subcategory, supplier, type, project, and search still apply. Competence does not. A status filter of `Pendente` or `Cancelado` makes this card zero. The card shows the caption `Data de pagamento`. |
| `Pendentes`        | Sum of `pending` expenses in the competence set above. |
| `Lançamentos`      | Count of non-cancelled expenses in the competence set above. |

Cancelled rows stay in the table when the status filter includes them, and they stay out of the four cards. The pager total can be higher than `Lançamentos`. A payment in November for an October competence counts in November's `Pagas` and in October's table.

The table card is titled `Lançamentos recentes`. Its search field placeholder
is `Buscar lançamentos...`. Search matches description or supplier and combines
with the filters.

Columns, in order: `Descrição`, `Categoria`, `Fornecedor`, `Competência`,
`Vencimento`, `Valor`, `Status`, `Recorrência`, `Ações`. The reference omits
`Recorrência`; the written request includes it, so the column is present.
Competence renders as `Out/2026`. Due date and payment date render as
`dd/MM/yyyy`. An empty optional date or supplier renders `—`. Recurrence
renders `Mensal`, `Anual`, or `—`.

Status is a tinted pill with a dot and a label. `Pago` uses accent.
`Pendente` uses the existing working-lane amber `#F5A524`. `Cancelado` uses
the muted text token. `Ver` and the kebab `Ações do lançamento` sit at the
end of the row. The search field sits on the same line as `Lançamentos
recentes`.

The first column is a checkbox, `Selecionar`, with a header checkbox for the
current page. Changing page or filters clears the selection. `Ver` links to
the detail route. `Ações do lançamento` opens `Editar` for every status and
`Cancelar` when the row is not cancelled. A row that belongs to a series also
offers `Cancelar série` while that series still has an expense that is not
cancelled. `Cancelar selecionados` appears when at least one checkbox is
selected.

Column headers sort on the server. The default order is competence month
descending, due date ascending with empty dates last, then description
ascending. The active header exposes `aria-sort`.

The footer reads `Mostrando 1 a 20 de 46 lançamentos`. Page size is 20, the
ticket list default. The pager has `Página anterior`, numbered pages, and
`Próxima página`. The current page uses the accent fill and navy text.

The table scrolls horizontally inside the card on narrow screens. The page
itself scrolls vertically with the shell.

### Create, detail, and edit

Create and edit are pages, not a modal. The field count, the dates, and the
files do not fit the contract modal. Detail is read-only and uses the same
field layout. `Voltar` returns to `/portal/financeiro/despesas`.

Required fields use `aria-required="true"`. The money input reuses
`parseReaisToCents` and then rejects zero. Display of a saved amount uses
`formatCentsBRL`.

| Field            | Copy                   | Rule |
| ---------------- | ---------------------- | ---- |
| Description      | `Descrição`            | Required. Trimmed, 1 through 160 characters. |
| Category         | `Categoria`            | Required. Active categories only. Placeholder `Selecione`. |
| Amount           | `Valor`                | Required. BRL, 1 through 99999999999 cents. |
| Competence       | `Competência`          | Required calendar month. |
| Type             | `Tipo de despesa`      | Required. `Fixa`, `Variável`, or `Eventual`. No default. |
| Subcategory      | `Subcategoria`         | Optional. Must belong to the selected category and be active. |
| Supplier         | `Fornecedor`           | Optional text, 1 through 160 characters when present. |
| Due date         | `Data de vencimento`   | Optional calendar date. Independent of competence. |
| Status           | `Status`               | On create, `Pendente` or `Pago`. Default `Pendente`. On edit, also `Cancelado`. |
| Payment date     | `Data de pagamento`    | Enabled only for `Pago`, and then required. Cleared when status is `Pendente`. A cancelled row may keep the date it already had. |
| Payment method   | `Forma de pagamento`   | Optional text, 1 through 80 characters when present. |
| Notes            | `Observações`          | Optional, 1 through 2000 characters when present. |
| Client           | `Cliente relacionado`  | Optional tenant. `Nenhum` is the empty choice. |
| Project          | `Projeto relacionado`  | Optional project. When both are set, the project must belong to that tenant. When only the project is set, the server stores that project's tenant as the client. |

Create can turn on `Despesa recorrente`. The one-off competence and due date
stay hidden while it is on. The block then asks:

| Field | Copy | Rule |
| ----- | ---- | ---- |
| Interval | `Periodicidade` | `Mensal` or `Anual`. |
| Count | `Número de meses` or `Número de anos` | Integer from 1 through 120. The label follows the interval. |
| Start | `Data de início do pagamento` | Required calendar date. It is the due date of the first expense. |

Saving creates the series and one pending expense per step, in the same
request. Month 0 uses the start date. Each next month, or each next year,
moves the due date by one step and sets competence to that due date's month.
The day is clamped to the last day of the shorter month. Every generated
expense starts as `Pendente`, with an empty payment date. The shared form
fields are copied onto each expense. The series itself is not listed and is
not added to the cards. Success returns to the list on the start month and
shows `Série salva. {n} lançamentos projetados.`, with the saved count in place of `{n}`.
`Salvar` stays disabled while the request is in flight.

A one-off edit does not turn that expense into a series. Recurrence is chosen
on create.

When the expense still follows a series, edit shows `Aplicar em` before the
fields, with `Somente este lançamento` and `Série inteira`. Save stays
disabled until one is chosen. `Somente este lançamento` saves that row and
stops later series edits from changing it. The detail then shows `Este
lançamento foi desvinculado da série.` `Série inteira` saves the shared
fields on the series and on every expense that still follows it: description,
category, subcategory, amount, type, supplier, payment method, notes, client,
and project. Competence, due date, payment date, status, and files stay on
each expense. The series form can also change the count and the start date.
It cannot change `Mensal` to `Anual` or the reverse. A later start date moves
the due date and competence of the pending expenses that still follow the
series. Paid and cancelled expenses keep their dates. A higher count appends
the missing pending steps. A lower count cancels the pending steps beyond the
new end. An expense that was edited alone is left as it is. If that step's
month already exists, the save does not create a second row.

`Salvar` on a one-off edit shows `Despesa salva.` and opens the detail route.
Files selected on the form upload after the expense id exists, one file per
request. If the expense is saved and a file fails, the detail stays open and
shows the file error. The expense is not rolled back.

Detail shows `Editar` in every status. `Cancelar lançamento` opens the
confirmation when the row is not cancelled. `Cancelar série` does the same
for the series. `Baixar` downloads one attachment. `Remover` removes one
attachment in any status.

### Categories

`Categorias` is a secondary button on the list. It opens the shared `Modal`,
titled `Categorias`, viewport-capped and internally scrolled. The modal lists
each category and its subcategories in position order. `Nova categoria` and
`Nova subcategoria` add a name. `Editar` renames. `Inativar` and `Ativar`
toggle `active`. `Excluir` appears only when that category or subcategory has
no expenses and, for a category, no subcategories. An inactive row shows
`Inativa`. Escape and the overlay close the modal.

### Cancel confirmation

The shared modal asks before cancel.

| Element | One expense | Selected expenses | Series |
| ------- | ----------- | ----------------- | ------ |
| Title   | `Cancelar lançamento` | `Cancelar lançamentos` | `Cancelar série` |
| Body    | `O lançamento permanece no histórico e deixa de entrar nos indicadores.` | `Os lançamentos selecionados permanecem no histórico e deixam de entrar nos indicadores.` | `Todos os lançamentos desta série permanecem no histórico e deixam de entrar nos indicadores.` |
| Confirm | `Cancelar lançamento` | `Cancelar selecionados` | `Cancelar série` |
| Dismiss | `Voltar` | `Voltar` | `Voltar` |

Success copy is `Despesa cancelada.` for one row, `Lançamentos cancelados.`
for a selection, and `Série cancelada.` for the series.

### States

| State | Copy |
| ----- | ---- |
| Loading | `Carregando...` |
| No expenses yet | `Nenhuma despesa cadastrada. Use Nova despesa para registrar a primeira.` |
| Filters match nothing | `Nenhum lançamento para os filtros selecionados.` |
| Request failed | `Não foi possível concluir a operação.` |
| Retry | `Tentar de novo` |
| Denial | `Você não tem acesso ao financeiro.` |
| Missing description | `Informe a descrição.` |
| Missing category | `Selecione a categoria.` |
| Invalid amount | `Informe um valor válido em reais.` |
| Missing competence | `Informe a competência.` |
| Missing type | `Selecione o tipo de despesa.` |
| Paid without a payment date | `Informe a data de pagamento.` |
| Payment date while pending | `A data de pagamento só pode ser informada quando a despesa estiver paga.` |
| Subcategory outside the category | `Selecione uma subcategoria desta categoria.` |
| Project outside the client | `Selecione um projeto do cliente informado.` |
| Inactive category on create | `Selecione uma categoria ativa.` |
| Category saved | `Categoria salva.` |
| Count out of range | `Informe um número entre 1 e 120.` |
| Missing recurrence start | `Informe a data de início do pagamento.` |
| Missing edit scope | `Selecione se a alteração vale para este lançamento ou para a série.` |
| Interval change | `A periodicidade da série não pode ser alterada.` |

During loading and after an error, the cards do not render `R$ 0,00` or `0`
as a result. Zero appears only after a successful response whose persisted
total is zero.

## API and integrations

All routes require the existing access cookie and profile `Administrador`.
Controllers return DTOs. Unknown JSON properties are rejected. There is no
new public route and no new rate-limit threshold. The global rate-limit
guard stays as it is.

`400` validation uses the existing Nest message `Invalid input.` The UI maps
the cases it can see to the copy table before the request. `403` is
`Access denied.` `404` is an unknown expense, category, subcategory, project,
or document. A document id that belongs to another expense is `404`.

### Expenses

| Method | Path | Request | Response | Errors |
| ------ | ---- | ------- | -------- | ------ |
| GET | `/api/v1/expenses` | Query below | Page plus summary | `400`, `401`, `403` |
| GET | `/api/v1/expenses/{id}` | None | Expense detail | `401`, `403`, `404` |
| POST | `/api/v1/expenses` | Create body | `201` detail, or the series result | `400`, `401`, `403` |
| PATCH | `/api/v1/expenses/{id}` | Partial body plus optional `scope` | Detail | `400`, `401`, `403`, `404` |
| POST | `/api/v1/expenses/{id}/cancel` | None | Detail | `401`, `403`, `404` |
| POST | `/api/v1/expenses/cancel` | `{ "ids": ["uuid"] }` | Cancel result | `400`, `401`, `403` |
| POST | `/api/v1/expense-series/{id}/cancel` | None | `{ "cancelledCount": 0 }` | `401`, `403`, `404` |

List query:

| Param | Rule |
| ----- | ---- |
| `competence` | `YYYY-MM`. Omitted means the current month in `America/Sao_Paulo`. |
| `categoryId` | UUID. Omitted means all. |
| `subcategoryId` | UUID. Omitted means all. |
| `status` | `pending`, `paid`, or `cancelled`. Omitted means all. |
| `supplier` | Trimmed contains, max 160. |
| `type` | `fixed`, `variable`, or `occasional`. |
| `projectId` | UUID. |
| `q` | Trimmed contains on description or supplier, max 160. |
| `page` | Integer, default 1. |
| `limit` | Integer, default 20, maximum 100. |
| `sort` | `description`, `category`, `supplier`, `competence`, `dueOn`, `amount`, `status`, or `recurrence`. Default `competence`. |
| `direction` | `asc` or `desc`. Default `desc` for competence, `asc` for the other default tie-breaks. |

List response:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "summary": {
    "periodTotalCents": 0,
    "paidTotalCents": 0,
    "pendingTotalCents": 0,
    "count": 0
  }
}
```

`total` counts the table rows, including cancelled rows when the status
filter includes them. `summary.count` counts non-cancelled rows in the
competence set. `periodTotalCents` and `pendingTotalCents` use that same
competence set. `paidTotalCents` sums `paid` rows whose `paid_on` is inside
the selected month, after category, subcategory, supplier, type, project,
and search. It does not use competence. When the status filter is `pending`
or `cancelled`, `paidTotalCents` is 0. The four numbers are calculated in
the service for the whole filtered population. The page slice does not
produce them.

List items omit notes and documents. Detail includes them. Neither DTO
includes `createdByUserId`, a storage path, or the series template fields
beyond the identifiers below.

```json
{
  "id": "uuid",
  "description": "string",
  "categoryId": "uuid",
  "categoryName": "string",
  "subcategoryId": null,
  "subcategoryName": null,
  "amountCents": 1,
  "competenceMonth": "2026-10",
  "expenseType": "fixed",
  "supplierName": null,
  "dueOn": null,
  "paidOn": null,
  "paymentMethod": null,
  "notes": null,
  "clientTenantId": null,
  "clientTenantName": null,
  "projectId": null,
  "projectName": null,
  "status": "pending",
  "recurrence": null,
  "seriesId": null,
  "seriesIndex": null,
  "seriesDetached": false,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

`recurrence` is `null`, `monthly`, or `yearly`. Create accepts status
`pending` or `paid` only. `paid` requires `paidOn`. `pending` rejects
`paidOn`. Edit accepts `pending`, `paid`, and `cancelled`. Moving a row to
`pending` clears `paidOn` and `cancelled_at`. Moving it to `paid` requires
`paidOn`. Moving it to `cancelled` keeps an existing `paidOn` and sets
`cancelled_at`. A second cancel returns the row still cancelled.

A one-off body omits `recurrence`. A recurring create sends:

```json
{
  "recurrence": {
    "interval": "monthly",
    "count": 12,
    "startsOn": "2026-10-27"
  }
}
```

`count` is 1 through 120. The service creates the series and the expenses in
one transaction. Generated rows are `pending`, with `paidOn` null, `dueOn`
stepped from `startsOn`, and `competenceMonth` set to that due month. The
response is `{ "seriesId", "generatedCount", "firstExpenseId" }`. Static
paths `associations` and `cancel` are declared before `/{id}`.

`PATCH` of an expense that still follows a series requires
`scope: "occurrence"` or `scope: "series"`. `occurrence` updates that row and
sets `seriesDetached`. `series` updates the shared fields listed in User
experience, and may include `count` and `startsOn`. `interval` in that body
is `400`. A one-off `PATCH` rejects `scope`, `count`, and `startsOn`.

`POST /api/v1/expenses/cancel` accepts 1 through 100 ids. Unknown ids are
`404` for the whole request. Ids that are already cancelled are returned in
`alreadyCancelledIds`. The others are returned in `cancelledIds`.
`POST /api/v1/expense-series/{id}/cancel` cancels every expense of that
series that is not cancelled, including a detached expense, and marks the
series inactive.

### Associations

`GET /api/v1/expenses/associations` returns `{ "tenants": [{ "id", "name" }], "projects": [{ "id", "name", "tenantId", "tenantName" }] }`
for the selects. It does not return contract amounts. The client cannot
choose a storage tenant through this payload.

### Categories

| Method | Path | Response | Errors |
| ------ | ---- | -------- | ------ |
| GET | `/api/v1/expense-categories` | Category tree | `401`, `403` |
| POST | `/api/v1/expense-categories` | `201` category | `400`, `401`, `403` |
| PATCH | `/api/v1/expense-categories/{id}` | Category | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/expense-categories/{id}` | `204` | `401`, `403`, `404`, `409` |
| POST | `/api/v1/expense-categories/{id}/subcategories` | `201` subcategory | `400`, `401`, `403`, `404` |
| PATCH | `/api/v1/expense-subcategories/{id}` | Subcategory | `400`, `401`, `403`, `404` |
| DELETE | `/api/v1/expense-subcategories/{id}` | `204` | `401`, `403`, `404`, `409` |

A category name is trimmed, 1 through 80 characters, unique case-insensitively.
A subcategory name is unique inside its category. PATCH accepts `name` and
`active`. DELETE returns `409` when an expense, or a subcategory, still
references the row. The tree includes `active`, `position`, and
`expenseCount` so the modal can hide `Excluir` without trusting the client.

### Documents

| Method | Path | Request | Response | Errors |
| ------ | ---- | ------- | -------- | ------ |
| POST | `/api/v1/expenses/{id}/documents` | Multipart field `file` | `201` document DTO | `400`, `401`, `403`, `404` |
| GET | `/api/v1/expenses/{id}/documents/{documentId}` | None | Bytes, attachment disposition | `401`, `403`, `404` |
| DELETE | `/api/v1/expenses/{id}/documents/{documentId}` | None | `204` | `401`, `403`, `404` |

The document DTO is `{ "id", "originalName", "contentType", "byteSize", "createdAt" }`.
Upload reuses `isFinanceDocumentMime`, `matchesDeclaredFinanceDocumentType`,
`safeFinanceDocumentName`, and `MAX_FINANCE_DOCUMENT_BYTES` (25 MB). Each
expense accepts at most 20 documents and 100 MB in total. Add and remove are
allowed in every expense status.

### Recurrence

Generation runs inside the create transaction. There is no scheduler. The
idempotency key is `(series_id, competence_month)`. A second insert for that
pair does not add a row. Raising `count` reopens a cancelled expense that
still follows the series and occupies that month, copying the current shared
fields and leaving it `pending` with no payment date. A detached expense in
that month stays detached, and no second row is created for the month.

Swagger, `openapi.yaml`, and `docs/api.md` gain these routes in the approved
delivery. No existing finance path changes.

## Data impact

New migration `1760000021000-add-operating-expenses.ts`. Money is `bigint`
cents, matching `project_costs.amount_cents` and `docs/database.md`. Calendar
facts use `date`, matching `project_payments.paid_on`. Event timestamps use
`timestamptz`. Enums are `varchar` plus a check constraint.

### `expense_categories`

| Column | Type |
| ------ | ---- |
| `id` | uuid primary key |
| `slug` | varchar 80, unique, stable |
| `name` | varchar 80 |
| `position` | integer, unique |
| `active` | boolean, default true |
| timestamps | `created_at`, `updated_at` |

### `expense_subcategories`

| Column | Type |
| ------ | ---- |
| `id` | uuid primary key |
| `category_id` | uuid, foreign key `ON DELETE RESTRICT` |
| `slug` | varchar 80, unique inside the category |
| `name` | varchar 80 |
| `position` | integer, unique inside the category |
| `active` | boolean, default true |
| timestamps | `created_at`, `updated_at` |

### `expense_series`

The series is the recurrence template. It is not an expense and it is not
included in summaries. Saving a count and a start date creates the expenses
immediately.

| Column | Type |
| ------ | ---- |
| `id` | uuid primary key |
| `interval` | varchar, `monthly` or `yearly` |
| `occurrence_count` | integer, 1 through 120 |
| `starts_on` | date |
| `description` | varchar 160 |
| `category_id` | uuid, `ON DELETE RESTRICT` |
| `subcategory_id` | uuid nullable, `ON DELETE RESTRICT` |
| `amount_cents` | bigint, 1 through 99999999999 |
| `expense_type` | varchar, `fixed`, `variable`, or `occasional` |
| `supplier_name` | varchar 160 nullable |
| `payment_method` | varchar 80 nullable |
| `notes` | varchar 2000 nullable |
| `client_tenant_id` | uuid nullable, `ON DELETE SET NULL` |
| `project_id` | uuid nullable, `ON DELETE SET NULL` |
| `active` | boolean, default true |
| `created_by_user_id` | uuid nullable, `ON DELETE SET NULL` |
| timestamps | `created_at`, `updated_at` |

### `operating_expenses`

| Column | Type |
| ------ | ---- |
| `id` | uuid primary key |
| `description` | varchar 160 |
| `category_id` | uuid, `ON DELETE RESTRICT` |
| `subcategory_id` | uuid nullable, `ON DELETE RESTRICT` |
| `amount_cents` | bigint, 1 through 99999999999 |
| `competence_month` | date, day must be 1 |
| `expense_type` | varchar, `fixed`, `variable`, or `occasional` |
| `supplier_name` | varchar 160 nullable |
| `due_on` | date nullable |
| `paid_on` | date nullable |
| `payment_method` | varchar 80 nullable |
| `notes` | varchar 2000 nullable |
| `client_tenant_id` | uuid nullable, tenants, `ON DELETE SET NULL` |
| `project_id` | uuid nullable, projects, `ON DELETE SET NULL` |
| `status` | varchar, `pending`, `paid`, or `cancelled` |
| `series_id` | uuid nullable, `ON DELETE RESTRICT` |
| `series_index` | integer nullable, 0 through 119 |
| `series_detached` | boolean, default false |
| `created_by_user_id` | uuid nullable, `ON DELETE SET NULL` |
| `cancelled_at` | timestamptz nullable |
| `cancelled_by_user_id` | uuid nullable, `ON DELETE SET NULL` |
| timestamps | `created_at`, `updated_at` |

Checks:

- `paid` requires `paid_on`.
- `pending` requires `paid_on` null.
- `cancelled` may keep `paid_on`.
- `series_id` null requires `series_index` null and `series_detached` false.
- Unique `(series_id, competence_month)` where `series_id` is not null.
- Unique `(series_id, series_index)` where `series_id` is not null.

Indexes cover `competence_month`, `status`, `category_id`, `subcategory_id`,
`project_id`, `client_tenant_id`, and `series_id`.

`SET NULL` on project and tenant is required so project delete and tenant
delete keep the company expense and do not change the VETOR-015 delete
behavior for contract rows.

### `operating_expense_documents`

| Column | Type |
| ------ | ---- |
| `id` | uuid primary key |
| `expense_id` | uuid, `ON DELETE CASCADE` |
| `storage_filename` | varchar, server pointer |
| `original_name` | varchar 255 |
| `content_type` | varchar 200 |
| `byte_size` | integer, 1 through 25 MB |
| `created_by_user_id` | uuid nullable, `ON DELETE SET NULL` |
| timestamps | `created_at`, `updated_at` |

The pointer shape is `expenses/{expenseId}/{documentId}.{ext}` and is stored
under the bootstrap tenant folder `vetor`. The optional client on the
expense does not choose the folder. Bytes are not a column.

### Initial categories

The migration inserts these names once, matched by slug, with
`ON CONFLICT DO NOTHING`. A later rename in the UI is not overwritten.
Positions follow this list.

| Category slug | Name | Subcategory slugs and names |
| ------------- | ---- | --------------------------- |
| `infraestrutura-e-cloud` | Infraestrutura e Cloud | `vps-e-servidores` VPS e servidores; `aws-e-outros-provedores-cloud` AWS e outros provedores cloud; `dominios-e-dns` Domínios e DNS; `armazenamento-e-monitoramento` Armazenamento e monitoramento |
| `ia-e-apis` | IA e APIs | `tokens-de-llm` Tokens de LLM; `assinaturas-de-ia` Assinaturas de IA; `consumo-de-apis` Consumo de APIs; `outros-servicos-de-ia` Outros serviços de IA |
| `marketing-e-aquisicao` | Marketing e aquisição | `meta-ads` Meta Ads; `google-ads` Google Ads; `ferramentas-de-marketing` Ferramentas de marketing; `producao-de-conteudo` Produção de conteúdo |
| `software-e-licencas` | Software e licenças | `ferramentas-de-desenvolvimento` Ferramentas de desenvolvimento; `assinaturas-saas` Assinaturas SaaS; `ferramentas-de-bi` Ferramentas de BI; `licencas-corporativas` Licenças corporativas |
| `servicos-e-operacao` | Serviços e operação | `contabilidade` Contabilidade; `consultores-e-freelancers` Consultores e freelancers; `servicos-terceirizados` Serviços terceirizados; `despesas-administrativas` Despesas administrativas |

Approved delivery records these tables in `docs/database.md`. It does not
rewrite `project_costs`.

## Security

The audience is the existing finance audience. `Financeiro` is already
visible only to `Administrador`, and the human asked to reuse that
authorization and not to invent a role. Hiding the sidebar child is
presentation. The service rejects every other profile with `403` and an
unauthenticated caller with `401`.

No new public route, no weakened guard, and no `enabledActions` grant.
`AdministradorTenant` and `Usuario` do not receive company expenses, file
bytes, or category management.

The client cannot send a storage path, a storage tenant, `createdByUserId`,
or a summary. The server resolves the `vetor` tenant folder. Download checks
the expense id and the document id together. Responses omit filesystem paths
and actor ids.

Input is validated with DTOs and `class-validator`. Amounts are integers.
File type is checked from the declared MIME and the content, using the
finance-document helpers. Executables, scripts, HTML, and SVG stay rejected
by that allowlist.

Logs for create, update, cancel, category changes, and file upload record
the actor id, the expense or category id, and the outcome. They omit
description, notes, supplier, payment method, amounts, file names, and file
bytes. These are application logs. They are not written to the security
audit table.

Cancelled rows and their files remain readable by `Administrador`. Cancel
does not delete them. The human confirmed that an expense in any status can
be edited, so a cancelled row can change status, amount, dates, and files.
Those writes use the same `Administrador` gate.

## Testing

Frontend tests use Vitest and React Testing Library. Backend unit tests sit
beside the service. HTTP coverage is `backend/test/expenses.e2e-spec.ts`.

- AC-001: Portal shell shows the child under `Contratos` for `Administrador`,
  marks it current on `/portal/financeiro/despesas`, keeps `Contratos`
  current only on `/portal/financeiro`, and matches sidebar search.
- AC-002: The list renders the filters, four cards, table, and empty copy
  from an empty successful response. The reference amounts are absent.
- AC-003: Filter, clear, search, sort, and page controls send the query
  fields. A fixture with more than one page does not let the card sum equal
  only the visible rows when the service summary says otherwise.
- AC-004: The form blocks the required-field and date rules. The service
  stores cents, rejects zero and a float, and rejects a payment date on a
  pending expense. E2E covers create and edit of a pending, paid, and
  cancelled expense, including a cancelled expense returned to `paid`.
- AC-005: Cancel of one id, of two ids, and of a series keeps the rows,
  excludes them from the summary, and returns them when status is
  `cancelled`. A second cancel does not create a second row.
- AC-006: The migration seed is covered by a test or a service fixture that
  asserts the five names. Delete of a referenced category returns `409`.
  Inactivate removes it from the create options and leaves the old name on
  the expense.
- AC-007: Upload rejects a disallowed type and a file over 25 MB. Download
  and delete are authenticated. The DTO has no path. Delete is allowed on a
  cancelled expense. Storage writes under the `vetor` tenant pointer.
- AC-008: The loading state has no zero totals. The error state shows the
  failure copy. The success state renders `summary`. A fixture with
  competence in October and `paid_on` in November contributes to November's
  `paidTotalCents` and to October's period total.
- AC-009: Shell and page denial for `AdministradorTenant` and `Usuario`.
  E2E expects `401` and `403` on list, create, cancel, category delete, and
  download.
- AC-010: Creating a monthly series of 3 from 2026-10-27 stores due dates
  27 Oct, 27 Nov, and 27 Dec, each pending and without `paid_on`. A yearly
  series steps one year. A second generation for the same competence does
  not insert. The summary does not add the series row. Edit scope
  `occurrence` detaches that row. Edit scope `series` changes the shared
  amount on the rows that still follow it and leaves a detached amount.
  Raising and lowering `count` appends and cancels the pending tail.
- AC-011: An existing finance list or contract test still passes. Project
  delete nulls `project_id` and leaves the operating expense.
- AC-012: Empty, error, validation, and confirmation dialogs render the copy
  table. A narrow viewport assertion checks the stacked cards and the
  horizontal table scroll.

## Delivery

The named human invoked `/goal` on this specification on 2026-10-27. That
invocation set `status: approved`. Q-001, Q-002, and Q-003 are answered.

Approved delivery adds the sidebar child and the expense screens. It does
not change `FinanceHome` behavior.

Delivery choices recorded at approval:

- Resolve the storage tenant with `BOOTSTRAP_ADMIN_TENANT_SLUG` (default
  `vetor`) and pass that tenant id to `TenantStorageService`. The new file
  kind is `expense`. The pointer is `expenses/{expenseId}/{documentId}.{ext}`
  and uses a new predicate. It does not reuse `isFinanceDocumentPointer`.
- Each occurrence keeps the day-of-month of `startsOn`, clamped to the last
  day of that occurrence's month. 31 January, then 28 or 29 February, then
  31 March.
- While `Despesa recorrente` is on, the form does not collect competence,
  due date, status, or payment date. A recurring create that also sends
  `status` or `paidOn` is `400`. Generated rows are `pending`.
- A new category or subcategory takes the next `position`. Its slug is
  derived from the name at create and does not change on rename. A slug
  collision receives a numeric suffix.
- List tie-breaks, after the requested column, are competence descending,
  due date ascending with empty dates last, description ascending, then id
  ascending. An omitted `direction` is `desc` only for competence and `asc`
  for every other sort.
- The four routes set `pageTitle` to `Custos e Despesas`, including the
  denial state.
- `AccessTokenGuard` and `AdministradorGuard` protect every new controller.
- Migration `1760000021000` follows `1760000020000`.
- Category `expenseCount` counts expenses with that `category_id`.
  Subcategory `expenseCount` counts expenses with that `subcategory_id`.
- Moving pending series dates uses temporary competence values inside the
  transaction so the unique month constraint can be reshuffled, then writes
  the final months. A pending row whose target month is already taken keeps
  its dates. A paid, cancelled, or detached row is not given a second index.

- `frontend/components/layout/portal-shell.tsx` and its tests.
- `frontend/app/portal/financeiro/despesas/page.tsx`
- `frontend/app/portal/financeiro/despesas/nova/page.tsx`
- `frontend/app/portal/financeiro/despesas/[id]/page.tsx`
- `frontend/app/portal/financeiro/despesas/[id]/editar/page.tsx`
- `frontend/components/expenses/` and `frontend/lib/expenses.ts`
- API client functions in `frontend/lib/api/client.ts`
- `backend/src/modules/expenses/`
- `backend/src/database/migrations/1760000021000-add-operating-expenses.ts`
- `TenantStorageService` gains an `expense` file kind. It does not change
  photo, attachment, contract, or finance paths.
- `docs/product.md` gains the route and a sidebar sentence on FR-015.
- `docs/design.md` records the second child and the list surface.
- `docs/api.md`, `openapi.yaml`, and Swagger record the new paths.
- `docs/database.md` records the new tables.
- VETOR-036 Q-001 gets one sentence pointing here. That file's status and
  contract rules stay as they are.

Commands after implementation: backend and frontend `lint`, `typecheck`,
`test`, and `build`; backend `test:e2e`; `npm run sdd:validate`. Browser
check of the list, create, cancel, category dialog, denial, and the mobile
drawer, with the running portal session.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-27-custos-e-despesas`.
- The human selected the `Contratos` anchor at `/portal/financeiro` and
  asked for `Custos e Despesas` below it, then supplied the module scope and
  the list reference.
- VETOR-036 Q-001 is the open slot this specification fills.
- VETOR-015, VETOR-026, and VETOR-027 remain the contract, payment, project
  cost, and project document rules.
- Company ledger, `Administrador` only, integer cents, omitted cost center,
  and text supplier are decisions recorded in this draft from the prompt
  plus the current model.
- Q-001 is the human's answer `Data do pagamento`: `Pagas` uses `paid_on`.
- Q-002 is the human's answer that the count and the payment start date
  project the following months, that edit offers one expense or the series,
  and that cancel offers one expense, several, or the series. Generated
  months start as `Pendente`, without a payment date, so a future month is
  not treated as money already paid.
- Q-003 is the human's answer that an expense can be edited in any status.
- The reference amounts and supplier names are not requirements.
- Approval: the human invoked `/goal` on this file on 2026-10-27.

## Implementation evidence

- Changed: `backend/src/modules/expenses/`, `backend/src/database/migrations/1760000021000-add-operating-expenses.ts`, `backend/src/modules/portal/tenant-storage.service.ts`, `frontend/app/portal/financeiro/despesas/`, `frontend/components/expenses/`, `frontend/lib/expenses.ts`, `frontend/lib/api/client.ts`, `frontend/components/layout/portal-shell.tsx`, `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`, `openapi.yaml`, and the VETOR-036 Q-001 sentence.
- Tests: `backend/src/modules/expenses/expenses.service.spec.ts`, `backend/src/modules/expenses/expense-dates.spec.ts`, `backend/src/modules/expenses/expense-series.spec.ts`, `backend/src/modules/expenses/operating-expense.entity.spec.ts`, `backend/test/expenses.e2e-spec.ts`, `frontend/components/expenses/expenses-home.spec.tsx`, `frontend/components/expenses/expense-form.spec.tsx`, `frontend/lib/expenses.spec.ts`, and `frontend/components/layout/portal-shell.spec.tsx`.
- Commands: `npm run lint` passed with seven existing image warnings and no errors. `npm run typecheck` passed. `npm run test` passed (backend 300, frontend 322, SDD 10). `npm run test:e2e` passed (94). `npm run build` passed, including `/portal/financeiro/despesas`, `/nova`, `/[id]`, and `/[id]/editar`. `npm run sdd:validate` passed (37 specifications). `npm run format:check` was not run.
- Limitations: the browser check used the signed-in `Administrador` at `http://app.vps2.com.br:3000`. The list, filters, empty and filtered-empty copy, create, detail (`Despesa salva.`), one-row cancel (`Despesa cancelada.`), category dialog, collapsed search for `custos`, Contratos at `/portal/financeiro`, and the 390px drawer were exercised. A one-off expense was saved and cancelled, so it remains in history and stays out of the summaries. An unused category created during the check was removed. The recurrence form hid competence, due date, and status; the series was not saved. Denial for `Usuario` and `AdministradorTenant` was not opened in that session, because signing out would require a new MFA login. Those profiles are covered by the shell and page tests, and the expense HTTP tests cover `401` and `403`.

## Validation evidence

- AC-001: awaiting human confirmation.
- AC-002: awaiting human confirmation.
- AC-003: awaiting human confirmation.
- AC-004: awaiting human confirmation.
- AC-005: awaiting human confirmation.
- AC-006: awaiting human confirmation.
- AC-007: awaiting human confirmation.
- AC-008: awaiting human confirmation.
- AC-009: awaiting human confirmation.
- AC-010: awaiting human confirmation.
- AC-011: awaiting human confirmation.
- AC-012: awaiting human confirmation.
