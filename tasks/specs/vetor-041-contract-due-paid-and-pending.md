---
id: VETOR-041
title: Contract due dates drive paid and pending amounts
status: implemented
source_kind: human_prompt
source_reference: chat-2026-11-09-valor-pendente-vencimento
created_at: 2026-11-09
updated_at: 2026-11-09
---

# Contract due dates drive paid and pending amounts

## Context

Contratos at `/portal/financeiro` stores one contract per project. Each
installment has an amount and no due date. `Valor pago` is a single amount
the `Administrador` types. Saving it replaces `project_payments` for that
project. The list and the totals strip show `Pago` from those payment rows
and `Em aberto` as the contract total minus that paid sum.

The human asked Contratos to count an installment into the paid amount when
its due date arrives, and to add `Valor Pendente` as the contract total
minus the paid amount.

Confirmed in the same conversation:

- `Valor pago` is no longer typed. It is the sum of installment amounts
  whose due date is today or earlier.
- `Valor Pendente` is the contract total minus that paid sum. It is
  read-only in the contract form. The list column `Em aberto` is renamed
  `Valor Pendente`.
- An installment with no due date does not count as paid.

A project that already has a typed paid amount and installments without
due dates shows `Valor pago` as zero and `Valor Pendente` as the contract
total until due dates are saved. Stored `project_payments` rows stay in the
database and stop feeding these figures. There is no backfill.

## Desired outcome

On Contratos, each installment has a due date. When that calendar date is
today or earlier in `America/Sao_Paulo`, the whole installment amount is
part of `Valor pago`. Future dates and empty dates are excluded. `Valor
Pendente` is the contract total minus that sum, in the form and in the
list. The backend and the form use the same rule.

## In scope

- A due date on each installment, optional, saved with the contract.
- Derived `Valor pago` from installments due on or before today.
- Read-only `Valor pago` and `Valor Pendente` in the contract modal.
- Rename of the list column and the totals-strip label `Em aberto` to
  `Valor Pendente`, using the same subtraction.
- List, project finance, and totals use the derived paid sum for
  `paidAmountCents`, `openAmountCents`, and `resultAmountCents`.
- pt-BR copy in User experience.
- Approved delivery updates `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`.

## Out of scope

- Partial payment of one installment. The whole amount counts on the due
  date.
- A payment ledger, bank integration, NF-e, or a scheduled job that posts
  a payment row.
- Deleting `project_payments` or removing the existing payment routes.
- Requiring installment dates to be ordered, or requiring the installment
  sum to equal the contract total.
- Renaming the JSON field `openAmountCents`.
- Changing `Custos e Despesas`, cost lines, the contract PDF, project
  documents, authorization, or the tenant filter.
- Backfilling old typed payments into installment due dates.

## Acceptance criteria

- AC-001: In the contract modal, each `Parcela N` has a `Vencimento` date.
  An empty date saves as null and reopens empty. A valid date reopens as
  that date. Raising the installment count keeps existing amounts and
  dates and appends empty fields. Lowering the count drops the positions
  above the new count.
- AC-002: The modal has no editable `Valor pago` field and does not write
  `project_payments`. Read-only `Valor pago` is the sum of installment
  amounts whose `Vencimento` is today or earlier in `America/Sao_Paulo`.
  A future date, an empty date, and an unparseable date are excluded. The
  figure updates as amounts and dates change, before save.
- AC-003: Read-only `Valor Pendente` is the parsed contract total minus
  that paid sum, including a negative result. When the contract amount
  does not parse, `Valor Pendente` shows `—`. The list column and the
  totals strip say `Valor Pendente` and show the same subtraction. After
  save, the list matches the saved installments and the server date.
- AC-004: `GET /api/v1/finance/projects` and
  `GET /api/v1/projects/{id}/finance` set `paidAmountCents` from
  installments with `dueOn` on or before the `America/Sao_Paulo` calendar
  date. `openAmountCents` is the contract total minus that sum.
  `resultAmountCents` is that sum minus project cost. Payment rows do not
  add to these figures. `PUT /api/v1/projects/{id}/contract` accepts
  `dueOn` as `YYYY-MM-DD` or null on every installment. An invalid
  `dueOn` returns `400`.
- AC-005: Only an authenticated `Administrador` can read or write
  installment due dates and these amounts. Other profiles receive `403`.
  Unauthenticated callers receive `401`. Responses omit filesystem paths
  and `created_by_user_id`.

## User experience

The contract modal keeps the shared dark `Modal`, white labels, and light
inputs from VETOR-015, VETOR-027, and `docs/design.md`. No new route and
no icon library.

1. Remove the editable `Valor pago` input from the money grid. `Valor do
   contrato`, `Número de parcelas`, and `Situação` stay.
2. Under the installment count, each position is one row on wide screens:
   `Parcela N` with the existing money input, and `Vencimento` with the
   same light `type="date"` input used by `Início` and `Fim`. On narrow
   screens the two fields stack. `Total das parcelas` stays under the
   rows.
3. Under that total, two read-only lines use the same white semibold text:
   `Valor pago` and `Valor Pendente`, each followed by pt-BR BRL. They
   follow the formulas in Desired outcome, using the browser clock
   converted to the `America/Sao_Paulo` calendar date. They are not
   inputs and do not block submit.
4. The project table header and the totals strip replace `Em aberto` with
   `Valor Pendente`. Column order is unchanged. Amounts stay right-aligned.
   A negative pending amount stays visible, as the open balance already
   can.
5. Saving still closes the modal and refreshes the list. The form no
   longer creates, updates, or deletes payment rows.

### Copy

| Element              | Copy                |
| -------------------- | ------------------- |
| Installment due date | `Vencimento`        |
| Derived paid amount  | `Valor pago`        |
| Pending amount       | `Valor Pendente`    |
| Missing pending      | `—`                 |
| List and totals      | `Valor Pendente`    |

### Validation copy

| Condition                                      | Copy                                   |
| ---------------------------------------------- | -------------------------------------- |
| `dueOn` present and not a calendar date        | `Informe uma data de vencimento válida.` |
| Installment count, money, and cost lines       | Unchanged from VETOR-015 and VETOR-027 |

## API and integrations

No new public route. Authorization stays `Administrador` only. Unknown
JSON properties stay rejected.

`PUT /api/v1/projects/{id}/contract` keeps the current contract body. Each
`installments` item becomes `{ "amountCents": <integer>, "dueOn": <date or null> }`.
`dueOn` may be omitted or null. When present it is `YYYY-MM-DD`. The
handler stores that date on the installment row in the same transaction
as the contract upsert. Position remains the array index plus one.

`GET /api/v1/projects/{id}/finance` returns each installment as
`{ "position": 1, "amountCents": 0, "dueOn": null }`, ordered by position.
`dueOn` is the stored date or null.

`GET /api/v1/finance/projects` does not add the installment array. Its
`paidAmountCents` is the sum of `amount_cents` for installments of that
project whose `due_on` is not null and is on or before the server's
`America/Sao_Paulo` calendar date, passed as a query parameter. The same
sum is `paidAmountCents` on the project finance payload. `openAmountCents`
remains contract total minus that sum. `resultAmountCents` remains that
sum minus project cost. `project_payments` is not part of the sum.

An invalid `dueOn`, a length mismatch, or an invalid amount is `400`
with message `Invalid input.` The UI maps an invalid date to the
validation copy before the request when it can.

Existing payment routes stay callable and do not change these three
figures.

## Data impact

`project_contract_installments` gains:

| Column   | Type                                      |
| -------- | ----------------------------------------- |
| `due_on` | `date` null                               |

No check that `due_on` is ordered by `position`. Existing rows stay null.
One new TypeORM migration. `synchronize` stays false. `project_payments`
is unchanged and is not read for Contratos paid, pending, or result.

Deleting a project still cascades installment rows.

## Security

- Same access cookie and `Administrador`-only guard as VETOR-015. No new
  public route, no weakened guard, and no new collected data beyond the
  installment due date the human asked to store.
- Due dates are returned only on the authenticated project finance
  payload. List responses keep the existing amount fields. DTOs omit
  `created_by_user_id` and filesystem paths.
- Do not log amounts, due dates, cookies, or tokens.
- Validate `dueOn` as a calendar date or null on the backend. Reject
  unknown properties. Use a parameterized date in the paid-sum query.
  Do not accept `projectId` or `position` from the client.

## Testing

- AC-001: `frontend/components/finance/finance-home.spec.tsx` shows
  `Vencimento` beside each parcela, keeps the first date when the count
  grows, and submits `dueOn` null for an empty field and the chosen date
  otherwise. Backend unit and `backend/test/finance.e2e-spec.ts`
  round-trip `dueOn` and return it on the finance payload.
- AC-002: the component test has no textbox named `Valor pago`. With the
  clock fixed, a due date of today is included, tomorrow is excluded, and
  an empty date is excluded. The read-only paid text changes when the
  amount or date changes. Submit does not call the payment client.
- AC-003: the component test shows `Valor Pendente` as contract minus the
  derived paid sum, including a negative value, and `—` when the contract
  amount is not a reais value. The list header and totals use `Valor
  Pendente` and do not use `Em aberto`.
- AC-004: service unit tests and finance e2e show `paidAmountCents` from
  due installments only, `openAmountCents` as contract minus that sum, and
  `resultAmountCents` as that sum minus cost. A payment row does not
  increase paid. An invalid `dueOn` returns `400`.
- AC-005: finance e2e keeps `401` without a cookie and `403` for
  `AdministradorTenant` and `Usuario` on contract PUT, now including
  `dueOn`.

Commands after approved delivery: frontend and backend `typecheck`,
`lint`, `test`, and `build`; backend `test:e2e` for the finance spec;
`npm run sdd:validate`.

## Delivery

Delivered after human approval on 2026-11-09.

Placement:

- Frontend: `frontend/components/finance/finance-home.tsx`,
  `frontend/components/finance/finance-home.spec.tsx`,
  `frontend/lib/api/client.ts`
- Backend: contract DTO, installment entity, `ProjectFinanceService`,
  one migration, `backend/test/finance.e2e-spec.ts`, and the finance unit
  specs
- Contracts: `docs/product.md` FR-015, `docs/design.md` Contratos
  sentences, `docs/api.md`, `openapi.yaml`, Swagger, and
  `docs/database.md`

No new npm dependency. The shared visual change is the due-date field on
the existing installment row and the rename of the open-balance label.
Promote that label into `docs/design.md` on delivery.

## Traceability

- Source: `chat-2026-11-09-valor-pendente-vencimento` (`human_prompt`)
- Extends VETOR-015 and VETOR-027. The manual `Valor pago` field, the
  `Em aberto` label, and the exclusion of installment due dates are
  replaced by this specification once it is approved. VETOR-015 remains
  the contract for authorization, the PDF, and the payment routes.
  VETOR-027 remains the contract for installment amounts and named cost
  lines.
- Does not change VETOR-026 project documents or VETOR-037 operating
  costs.

## Implementation evidence

- Changed: `frontend/components/finance/finance-home.tsx`, `frontend/components/finance/finance-home.spec.tsx`, `frontend/lib/api/client.ts`, `frontend/lib/finance.ts`, `backend/src/modules/projects/project-finance.service.ts`, `backend/src/modules/projects/project-finance.service.spec.ts`, `backend/src/modules/projects/dto/finance.dto.ts`, `backend/src/modules/projects/dto/finance-response.dto.ts`, `backend/src/modules/projects/entities/project-contract-installment.entity.ts`, `backend/src/modules/projects/finance-amounts.ts`, `backend/src/database/migrations/1760000026000-add-installment-due-on.ts`, `backend/test/finance.e2e-spec.ts`, `docs/product.md`, `docs/design.md`, `docs/api.md`, `docs/database.md`, `openapi.yaml`
- Tests: backend `project-finance.service.spec.ts` passed inside `npm run test --workspace backend` (51 files, 357 tests). Frontend `finance-home.spec.tsx` passed inside `npm run test --workspace frontend` (87 files, 368 tests). `npm run test:e2e --workspace backend -- test/finance.e2e-spec.ts` passed (8 tests). Backend and frontend `typecheck` passed. Backend `lint` passed. Frontend `lint` passed with nine existing warnings and no errors. Backend and frontend `build` passed. `npm run sdd:validate` passed for 41 specifications. The logged-in Contratos screen was not opened in a browser in this session.

## Validation evidence

- AC-001: not validated
- AC-002: not validated
- AC-003: not validated
- AC-004: not validated
- AC-005: not validated
