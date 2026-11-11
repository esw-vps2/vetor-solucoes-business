---
id: VETOR-027
title: Finance installment amounts and named cost lines
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-14-parcelas-e-custos
created_at: 2026-10-14
updated_at: 2026-10-14
---

# Finance installment amounts and named cost lines

## Context

VETOR-015 lets an `Administrador` save one contract per project from the
Financeiro modal. `Número de parcelas` is only a count from 1 through 120.
`Valor do custo` is one amount. The implemented modal collapses every cost
row into that single amount.

The requester, pointing at those two fields, asked to enter the value of
each installment after setting the count, and to specify each cost by name
and amount, adding and removing lines. Examples given: Infraestrutura 400,
imposto 300, registro 200.

Original request (Portuguese, preserved):

> ao por o numero de parcelar, da a possibilidade de por o valor de cada
> parcela. No Valor do custo coloca a possibilidade de especificar cada
> custo, ou seja, Infraestrutura 400, imposto 300, registro 200, e assim
> sucessivamente, posso ir adicionando ou excluindo.

This specification does not change who may open Financeiro, the tenant
filter, `Valor pago`, the contract PDF, or the list formulas for amount
received, open balance, and cost.

## Desired outcome

From the same finance modal, an `Administrador` sets the installment count
and enters an amount for each installment. The same modal replaces the
single cost field with named cost lines that can be added and removed.
After save, the list column `Parcelas` stays the count, and `Custo` stays
the sum of the cost lines. `Valor pago` and `Em aberto` stay as in
VETOR-015.

## In scope

- One amount field per installment, shown when `Número de parcelas` is an
  integer from 1 through 120. Labels are `Parcela 1` through `Parcela N`
  in count order.
- Named cost lines in that modal. Each line has a free-text name and an
  amount in BRL. The user can add a line and remove a line before saving.
- Project cost remains the sum of the saved cost lines. Saving with no
  cost lines stores a zero project cost.
- The installment amount sum is shown in the modal and is not required to
  equal `Valor do contrato`.
- pt-BR copy in User experience.
- Approved delivery updates `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`.

## Out of scope

- Due dates, a payment flag, or a paid amount on an individual installment
- Replacing `Valor pago` or changing `Em aberto`
- Requiring the installment sum to equal the contract total
- A cost category picker in this modal
- Changing Financeiro authorization, the tenant filter, the PDF, notes, or
  project documents
- New list columns
- Bank integration, NF-e, or export

## Acceptance criteria

- AC-001: In the finance modal, a valid `Número de parcelas` of N shows N
  amount fields labeled `Parcela 1` through `Parcela N`. Raising the count
  keeps the existing amounts and appends empty fields. Lowering the count
  drops the fields above the new count. `Total das parcelas` shows the sum
  of the entered amounts. Save succeeds when that sum differs from
  `Valor do contrato`. Reopening the modal shows the saved amounts in
  order. An empty installment amount is stored as zero cents and shown
  empty again.
- AC-002: The modal no longer shows a single `Valor do custo` input. It
  shows cost lines with `Nome do custo` and an amount, `Adicionar custo`,
  and `Excluir` on each line. `Excluir` removes that line from the form
  without a second confirmation. A fully empty line is ignored on save. A
  line with only a name or only an amount is rejected with the validation
  copy. After save, the list `Custo` equals the sum of the saved lines.
  Reopening shows the same names, amounts, and order. Removing every line
  and saving sets project cost to zero.
- AC-003: `Valor pago`, `Em aberto`, the totals strip, and the `Parcelas`
  column keep the VETOR-015 behavior. `Parcelas` remains the count.
- AC-004: Invalid installment count, invalid money, a cost name longer
  than 80 characters, and a 501st cost line return `400` with the
  validation copy. Amounts are integer cents. The UI shows BRL.
- AC-005: Only an authenticated `Administrador` can read or write
  installment amounts and cost lines. Other profiles receive `403`.
  Unauthenticated callers receive `401`. Responses omit filesystem paths
  and `created_by_user_id`.

## User experience

The finance modal keeps the shared dark `Modal`, white labels, and light
inputs from VETOR-015 and `docs/design.md`. No new route and no icon
library.

1. `Número de parcelas` stays in the money grid. When its value parses as
   an integer from 1 through 120, the fields `Parcela 1` … `Parcela N`
   render in a single column under that grid, each with the same light
   money input. `Total das parcelas` sits under them in white text and
   formats the sum as pt-BR BRL. It does not block submit.
2. Changing the count preserves amounts for positions that still exist.
   New positions start empty. Positions removed by a lower count are
   discarded on the next save.
3. The single `Valor do custo` input is removed. In its place, a
   `Custos` block lists the lines. Each line is a row: `Nome do custo`,
   the amount, and `Excluir`. `Adicionar custo` appends an empty line.
   `Total dos custos` under the lines formats the sum of amounts that
   parse, as pt-BR BRL. Zero lines shows only `Adicionar custo` and a
   total of zero.
4. A project that already has one collapsed cost opens with one line. The
   name is the stored label. The amount is that cost. Lines added in the
   form stay in the order the user left them.
5. Submit stays `Salvar`. A successful save still closes the modal and
   refreshes the list. Money fields still accept a pt-BR reais value.
   Empty installment and empty cost amount fields use the same empty
   display as the other money fields (no cents shown for zero).

### Copy

| Element            | Copy                        |
| ------------------ | --------------------------- |
| Installment count  | `Número de parcelas`        |
| Installment amount | `Parcela 1` … `Parcela 120` |
| Installment sum    | `Total das parcelas`        |
| Cost section       | `Custos`                    |
| Cost name          | `Nome do custo`             |
| Cost line amount   | `Valor`                     |
| Add cost           | `Adicionar custo`           |
| Remove cost line   | `Excluir`                   |
| Cost sum           | `Total dos custos`          |

### Validation copy

| Condition                                    | Copy                                                |
| -------------------------------------------- | --------------------------------------------------- |
| Installment count out of range               | `Informe o número de parcelas entre 1 e 120.`       |
| Amount out of range or not a reais value     | `Informe um valor válido em reais.`                 |
| Cost line with only a name or only an amount | `Preencha todos os campos obrigatórios.`            |
| Cost name longer than 80 characters          | `O nome do custo deve ter no máximo 80 caracteres.` |
| 501st cost line                              | `Este projeto já tem o máximo de lançamentos.`      |

## API and integrations

No new public route. Authorization stays `Administrador` only, as in
VETOR-015. Unknown JSON properties stay rejected.

`PUT /api/v1/projects/{id}/contract` accepts the existing contract fields
plus required `installments`: an array whose length equals
`installmentCount`. Each item is `{ "amountCents": <integer> }` from 0
through 99999999999. Position is the array index plus one. The handler
replaces that project's installment rows in the same transaction as the
contract upsert. The contract response adds `installments`:
`[{ "position": 1, "amountCents": 0 }]`, ordered by position ascending.

`GET /api/v1/projects/{id}/finance` includes those `installments` on the
project payload. `GET /api/v1/finance/projects` does not add the array.
It already returns `installmentCount`.

`PUT /api/v1/projects/{id}/cost-lines` replaces that project's cost rows.
Body: `{ "lines": [{ "label": "Infraestrutura", "amountCents": 40000 }] }`.
`lines` length is 0 through 500. `label` is trimmed, 1 through 80
characters. `amountCents` is an integer from 1 through 99999999999. An
empty `lines` array deletes the project's costs. The response is the
saved cost DTO array in position order:
`{ id, incurredOn, amountCents, category, label, note }`. `category` is
`other`. `note` is null. `incurredOn` is the server's current calendar
date (`YYYY-MM-DD`). Position is the array index plus one.

Existing payment routes and existing cost POST, PATCH, and DELETE stay.
Cost POST and PATCH accept optional `label` (trimmed, 1 through 80 when
present). When POST omits `label`, the stored label is the existing
category's display name (`Equipe`, `Terceiro`, `Infraestrutura`,
`Outro`) so current callers keep working. The finance modal uses only
the replace route for costs.

`GET` finance `costs` are ordered by `position` ascending. Each cost
object includes `label`.

A length mismatch between `installments` and `installmentCount`, a cost
line past 500, or an invalid label or amount is `400` with message
`Invalid input.` The UI maps those cases to the validation copy before
the request when it can.

## Data impact

New table `project_contract_installments`:

| Column                     | Type                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `id`                       | uuid primary key                                              |
| `project_id`               | uuid not null, foreign key to `projects`, `ON DELETE CASCADE` |
| `position`                 | integer not null, 1 through 120                               |
| `amount_cents`             | bigint not null, 0 through 99999999999                        |
| `created_by_user_id`       | uuid not null, foreign key to `users`, `ON DELETE RESTRICT`   |
| `created_at`, `updated_at` | timestamptz not null                                          |

Unique `(project_id, position)`. Index `project_id`.

`project_costs` gains:

| Column     | Type                            |
| ---------- | ------------------------------- |
| `label`    | varchar(80) not null            |
| `position` | integer not null, 1 through 500 |

Unique `(project_id, position)` on `project_costs`. Existing rows are
backfilled in `created_at` ascending order. `label` is the trimmed `note`
truncated to 80 characters when `note` is non-empty; otherwise `Equipe`,
`Terceiro`, `Infraestrutura`, or `Outro` from `category`.

Installment rows are not a schedule of due dates. Cost still sums
`amount_cents`. Deleting a project cascades installment rows and cost
rows. One new TypeORM migration. `synchronize` stays false.

## Security

- Same access cookie and `Administrador`-only guard as VETOR-015. No new
  public route and no new `enabledActions` value.
- Installment amounts and cost labels are returned only on those
  authenticated finance responses. DTOs omit `created_by_user_id` and
  filesystem paths.
- Do not log amounts, cost labels, cookies, or tokens.
- Validate array length, integer cents, and label length on the backend.
  Reject unknown properties. Use parameterized queries. Do not accept
  `projectId` or `position` from the client; position is the array order.

## Testing

- AC-001: `frontend/components/finance/finance-home.spec.tsx` shows
  `Parcela 1` through `Parcela 3` after the count is set, keeps the first
  amounts when the count grows, and submits `installments` whose length
  matches the count, including a zero amount for an empty field. Backend
  unit and `backend/test/finance.e2e-spec.ts` round-trip the array and
  reject a length mismatch with `400`.
- AC-002: the component test adds a line, removes a line, saves names and
  amounts through `PUT /api/v1/projects/{id}/cost-lines`, and shows the
  summed `Custo` after refresh. An empty line is omitted. A half-filled
  line shows `Preencha todos os campos obrigatórios.` The e2e replace
  route stores order, clears costs with an empty array, and returns
  `label`.
- AC-003: the component test still saves `Valor pago` and shows `Em aberto`
  as contract minus paid. The list `Parcelas` cell is the count.
- AC-004: e2e `400` for an installment amount above the max, a 121st
  implied count, a label over 80 characters, and 501 lines. The component
  shows the validation copy for a non-numeric amount and a long name.
- AC-005: e2e `401` without a cookie and `403` for `AdministradorTenant`
  and `Usuario` on the contract PUT (with `installments`) and on
  `PUT /api/v1/projects/{id}/cost-lines`.

Commands after approved delivery: frontend and backend `typecheck`,
`lint`, `test`, and `build`; backend `test:e2e` for the finance spec;
`npm run sdd:validate`.

## Delivery

Delivered after human approval on 2026-10-14.

Placement:

- Frontend: `frontend/components/finance/finance-home.tsx`,
  `frontend/components/finance/finance-home.spec.tsx`,
  `frontend/lib/api/client.ts`
- Backend: contract and cost DTOs, `ProjectFinanceService`, a
  `project_contract_installments` entity, the cost entity, one migration,
  `backend/test/finance.e2e-spec.ts`, and the finance unit specs
- Contracts: `docs/product.md` FR-015, `docs/design.md` Financeiro modal
  sentence, `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`

No new npm dependency.

## Traceability

- Source: `chat-2026-10-14-parcelas-e-custos` (`human_prompt`)
- Extends VETOR-015. The sentences that limit the modal to one cost amount
  and that leave a planned installment schedule out of scope are replaced
  by this specification once it is approved. VETOR-015 remains the
  contract for payments, open balance, authorization, and the PDF.
- Does not change VETOR-026 project documents.

## Implementation evidence

- Changed: `frontend/components/finance/finance-home.tsx`,
  `frontend/components/finance/finance-home.spec.tsx`,
  `frontend/lib/api/client.ts`,
  `backend/src/modules/projects/project-finance.service.ts`,
  `backend/src/modules/projects/project-finance.controller.ts`,
  `backend/src/modules/projects/dto/finance.dto.ts`,
  `backend/src/modules/projects/dto/finance-response.dto.ts`,
  `backend/src/modules/projects/entities/project-contract-installment.entity.ts`,
  `backend/src/modules/projects/entities/project-cost.entity.ts`,
  `backend/src/database/migrations/1760000016000-add-installment-amounts-and-cost-lines.ts`,
  `backend/test/finance.e2e-spec.ts`, `backend/test/openapi-contract.spec.ts`,
  `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`,
  `openapi.yaml`
- Tests: frontend `finance-home.spec.tsx` 12 passed; backend
  `project-finance.service.spec.ts` 14 passed; `openapi-contract.spec.ts`
  passed with the finance unit file (16); backend `finance.e2e-spec.ts`
  8 passed. Frontend `typecheck` passed. Backend `typecheck` failed on
  pre-existing errors in `rate-limit.guard.spec.ts` and
  `session-tenant.e2e-spec.ts`.

## Validation evidence

- AC-001: not validated
- AC-002: not validated
- AC-003: not validated
- AC-004: not validated
- AC-005: not validated
