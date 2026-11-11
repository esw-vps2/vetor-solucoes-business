---
id: VETOR-036
title: Financeiro navigation tree for Contratos
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-27-financeiro-contratos-nav
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Financeiro navigation tree for Contratos

## Context

The authenticated portal sidebar shows `Financeiro` as one link to
`/portal/financeiro`. That link is the `KanbanSidebarItem` the requester
selected: same row chrome, ledger icon, and placement before `Power BI`.
Only `Administrador` sees it. The route renders the existing finance screen
(`FinanceHome`) inside `PortalShell` with the heading `Financeiro`.

`Projetos` is already a tree in that sidebar: the parent row stays, and
child links sit in an indented list underneath. This request asks for that
kind of tree on `Financeiro`.

Original request (Portuguese, preserved):

> preciso que seja uma arvore com dois botoes onde as informações que temos
> dentro de financeiro, ficará dentro de Contratos. Apenas essa mudança
> simples, Em resumo dentro de financeiro adicione um botão Contratos, e o
> conteudo de Financeiro ficara em Contratos

This draft reads that as two controls: the existing `Financeiro` row becomes
the parent, and one child, `Contratos`, opens the screen that `Financeiro`
opens today. The finance screen stays one block. Nothing inside it is split
apart.

VETOR-015, VETOR-026, and VETOR-027 stay in force for contracts, payments,
costs, documents, notes, formulas, and authorization. This specification
replaces only the VETOR-015 statement that `Financeiro` is a single sidebar
link and that the shell heading of that destination is `Financeiro`.

Open question:

- Q-001: The phrase "árvore com dois botões" might instead mean two
  children under `Financeiro`. Only `Contratos` was named. This delivery
  does not add a second child. VETOR-037 names that child `Custos e Despesas`
  at `/portal/financeiro/despesas`.

## Desired outcome

An `Administrador` sees `Financeiro` in the same sidebar position, with
`Contratos` nested under it. Choosing `Contratos` opens the current finance
screen at `/portal/financeiro`. The shell heading on that screen is
`Contratos`. Profiles that cannot see `Financeiro` today still cannot see
`Contratos` or the screen.

## In scope

- Turn the `Financeiro` sidebar row into the parent of a tree. Keep its
  label, ledger icon, and order (after `Relatórios`, before `Power BI`).
  Show it only when `profile` is `Administrador`.
- Add one child control labeled `Contratos` under that parent. It links to
  the existing route `/portal/financeiro`.
- Show the unchanged `FinanceHome` content when `Contratos` is selected.
- Set the shell heading of `/portal/financeiro` to `Contratos`.
- Keep direct visits, refresh, and existing bookmarks of `/portal/financeiro`
  on that same screen, with `Contratos` marked current.
- Update `docs/product.md` and `docs/design.md` so the sidebar describes
  this tree and the heading `Contratos`.

## Out of scope

- A second child under `Financeiro` (Q-001).
- Splitting the finance screen into separate pages for contract, payments,
  costs, documents, or notes.
- A new product route, redirect, or rename of `/portal/financeiro`.
- Changing finance formulas, the tenant filter, project rows, the contract
  modal, installments, cost lines, PDFs, project documents, or encrypted
  notes.
- Changing who may read or write finance.
- New HTTP paths, DTO fields, tables, or migrations.
- Changing `Projetos`, `Power BI`, `Administrador`, or any other nav item.

## Acceptance criteria

- AC-001: An `Administrador` sees `Financeiro` in its current sidebar
  position and sees `Contratos` nested under it. `Contratos` links to
  `/portal/financeiro`.
- AC-002: Choosing `Contratos` shows the existing finance screen, and the
  shell heading is `Contratos`. The tenant filter, project rows, totals,
  contract modal, documents, and notes behave as they do today.
- AC-003: Opening `/portal/financeiro` directly shows that same screen, with
  `Contratos` as the current sidebar item.
- AC-004: `AdministradorTenant` and `Usuario` do not see `Financeiro` or
  `Contratos`. A direct visit still shows the existing denial copy, and the
  finance API still rejects them.

## User experience

`Financeiro` stays a parent row with the existing ledger icon and pill
chrome (`KanbanSidebarItem`). It is a button, not a link, because the only
destination is the child. The button toggles the child list and exposes
`aria-expanded`. It does not use `aria-current`, because it is not the
page. On a Financeiro route the tree starts expanded, so the current child
is visible. On every other route, including Power BI, it starts collapsed.
Only the Financeiro button opens or closes it. Choosing Power BI does not
open the child list. The expanded state is component state and is not stored.

The child list reuses the `Projetos` tree: an indented `ul` with a left
border (`border-l`, `ml-5`) and one text link. `Contratos` has no icon.
The current link uses the accent pill already used by a project link
(`aria-current="page"` when the pathname is `/portal/financeiro`). The
child is full width inside the indent. It does not repeat the parent
`w-[280px]`, which would overflow the sidebar. Focus keeps the existing
accent ring. Choosing `Contratos` closes the mobile drawer, as other
destinations do.

Sidebar search keeps the parent when the query matches `Financeiro` or
`Contratos`. A query that matches `Contratos` shows the child even if the
tree was collapsed. A query that matches neither hides the group.

The shell heading follows the selected destination, so `/portal/financeiro`
renders `Contratos`. The finance body is not given a second title. Empty,
loading, error, and denial copy inside `FinanceHome` stay as they are.
Light and dark surfaces stay on the current sidebar tokens. Do not add an
icon library.

## API and integrations

No HTTP method, path, payload, response, or error changes. `Contratos`
continues to call the finance endpoints already used by
`/portal/financeiro`. Swagger, `openapi.yaml`, and `docs/api.md` stay
unchanged.

## Data impact

No table, column, index, or migration. Contract, payment, cost, document,
and note records stay as VETOR-015, VETOR-026, and VETOR-027 defined them.

## Security

No new authentication or authorization policy. `Financeiro` and `Contratos`
stay visible only for `Administrador`, matching FR-015. Hiding the child
is presentation. The backend remains the authority: other profiles receive
the existing `403` on finance reads and writes. This change does not add a
public route, weaken a guard, or expose additional fields.

## Testing

- AC-001: Portal shell coverage shows `Financeiro` and a nested `Contratos`
  link to `/portal/financeiro` for `Administrador`, and shows that the
  parent does not navigate.
- AC-002: The finance page heading is `Contratos`, and an existing finance
  interaction (tenant totals or the contract modal) still renders.
- AC-003: Rendering the finance route marks `Contratos` as the current
  page.
- AC-004: `AdministradorTenant` and `Usuario` do not see either control,
  and the denial copy on a direct visit remains.

Frontend coverage uses Vitest and React Testing Library in the portal shell
and finance page tests. No new backend test is required, because the HTTP
contract and authorization do not change.

## Delivery

The named human invoked `/goal` on this specification on 2026-10-27. That
invocation set `status: approved`.

After approval, change only the sidebar tree and the shell heading:

- `frontend/components/layout/portal-shell.tsx` — parent button, nested
  `Contratos` link, search match, and expanded state.
- `frontend/app/portal/financeiro/page.tsx` — `pageTitle` `Contratos`.
- Portal shell and finance component tests that assert the `Financeiro`
  link or the heading `Financeiro`.
- `docs/product.md` FR-015 and the portal finance row, and the `Financeiro`
  sidebar paragraph in `docs/design.md`.

Do not add a route segment, a redirect, or a finance API change. Record
the replaced navigation sentence against VETOR-015 without reopening that
specification's finance rules.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-10-27-financeiro-contratos-nav`.
- The human selected the sidebar link `Financeiro`
  (`href="/portal/financeiro"`) and asked for a tree whose existing finance
  information lives under `Contratos`.
- Parent-plus-one-child is the reading of "dois botões" used here. A second
  child is Q-001.
- Keeping `/portal/financeiro` is a technical choice so the current screen,
  bookmarks, and finance API stay in place. The heading `Contratos` follows
  the shell rule that the heading names the selected destination.
- The nested list follows the `Projetos` tree in `PortalProjectNav` and
  `docs/design.md`.
- Depends on the approved finance screen from VETOR-015, VETOR-026, and
  VETOR-027. Does not replace those rules.
- Approval: the human invoked `/goal` on this file on 2026-10-27.

## Implementation evidence

- Changed: `frontend/components/layout/portal-shell.tsx`, `frontend/components/kanban-ui/kanban-sidebar-item.tsx`, `frontend/app/portal/financeiro/page.tsx`, `frontend/components/layout/portal-shell.spec.tsx`, `frontend/components/finance/finance-home.spec.tsx`, `frontend/app/portal/financeiro/page.spec.tsx`, `frontend/app/portal/page.spec.tsx`, `docs/product.md`, `docs/design.md`, and `docs/specs/vetor-015-financeiro-projetos.md`.
- Tests: portal shell coverage for the nested `Contratos` link, the parent toggle, search, and the current page; finance home heading `Contratos` with tenant totals; finance route heading, current link, totals, contract modal path, and denial copy.
- Commands: frontend `lint` passed with seven existing image warnings and no errors, frontend `typecheck` passed, frontend `test` passed (314 tests), frontend `build` passed, and `npm run sdd:validate` passed. Backend `test` and `test:e2e` were not run because this delivery does not change the API or persistence.
- Limitations: browser checks used the running app at `http://app.vps2.com.br:3000` with an existing `Administrador` session. `Financeiro` toggled `Contratos`, search for `contratos` showed the child while collapsed, search for `xyz` hid the group, and the contract modal for `Chat Mandala360` still opened. At 390px, choosing `Contratos` closed the drawer. A session for `AdministradorTenant` or `Usuario` was not signed in during this check. Q-001 remains open: no second child was added.

## Validation evidence

- AC-001: awaiting human confirmation.
- AC-002: awaiting human confirmation.
- AC-003: awaiting human confirmation.
- AC-004: awaiting human confirmation.
