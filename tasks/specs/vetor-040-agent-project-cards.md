---
id: VETOR-040
title: Agent project card tools
status: implemented
source_kind: human_prompt
source_reference: chat-2026-11-04-agent-project-cards
created_at: 2026-11-04
updated_at: 2026-11-04
---

# Agent project card tools

## Context

The portal already has an owner-scoped chat at `/portal/vetor-agent` for
callers with `vetorAgent` (VETOR-033, VETOR-035). The sidebar label is
`Agente`. The worker sends the conversation to OpenRouter and streams a
reply. The provider request has no tools. The in-repo default instruction
says the assistant must not claim access to projects, expenses, tickets, or
files.

Kanban data already exists. A tenant has project workspaces, each workspace
has projects, and each project has cards. `projects.name` is a `varchar(120)`
and is not unique inside a workspace, a tenant, or the database. The board
shows each card as `#` plus `cards.number`, which is unique per project.
Creating a card from the board requires `title`, `description`, and
`assigneeUserId`. `cards.assignee_user_id` is not null today. The server
assigns the card number, places the card at the end of the project's first
lane, and defaults `priority` to `medium`. The Novo card form labels are
`Título`, `Associado`, `Descrição`, `Data início`, `Data fim`, and
`Prioridade` (`Baixa`, `Média`, `Alta`).
Updating a card uses `PATCH /api/v1/cards/{id}` and the fields on
`UpdateCardDto`. Reads and those writes require `viewProjects` and the
caller's scoped tenant. `Administrador` uses the session tenant already
stored on the AI conversation. Other profiles use `users.tenant_id`.

No earlier specification covered listing, creating, or updating those cards
from the agent. Checklist items are a separate existing entity and are not
the target of this request.

The human prompt on 2026-11-04 asks Agente Beta, reached from the sidebar at
`/portal/vetor-agent`, to read, create, and update cards on projects the
caller can already access. The caller must state the project name. The
backend must resolve that name by strict equality. A missing or ambiguous
project blocks every read and write. Card text is untrusted data.

The same conversation later confirmed three business rules. Two or more
accessible projects with the same name stop the operation, and the assistant
says it cannot help. An assignee matches one person by full name or by first
name; if nobody matches, or more than one person matches, the card is created
with no person associated. A create request shows the fill-in layout first,
and the card is stored only from the filled reply.

## Desired outcome

From the existing `/portal/vetor-agent` conversation, a caller who already
has `vetorAgent` and `viewProjects` can name one accessible project and have
the assistant list its cards, create one card, or update one unambiguous
card. The assistant performs that work only after the backend accepts the
project name and the required card fields. The board at `/portal/projetos`
shows the same cards afterward.

## In scope

Confirmed by the human prompt:

- List the cards of one project.
- Create one card on that project.
- Update one existing card on that project.
- Require an explicit project name on the operation.
- Resolve the name in the backend by strict equality with the stored name.
- Reject a partial name, a fuzzy match, a slug, an id, or a similar name.
- Treat case, accents, spaces, and punctuation as significant.
- Remove only quotes that wrap the name in the user message. Do not otherwise
  normalize the name.
- When no project matches, reply with exactly:
  `O projeto "<nome informado>" não foi localizado. Informe o nome exatamente como cadastrado.`
- When no project matches, do not list, create, or update a card.
- When two accessible projects have that exact name, do not run the
  operation. Reply exactly:
  `Existem dois projetos com o mesmo nome, e por isso não é possível apoiar.`
- When more than two accessible projects have that exact name, do not run
  the operation. Reply exactly:
  `Existem mais de dois projetos com o mesmo nome, e por isso não é possível apoiar.`
- When more than one card shares the target title, do not update. Reply
  exactly `Já existe um card com este título`. A later message can select
  the card by its board number.
- Before creating a card, show the fill-in layout below. Create only from a
  later user message that fills `Título` and `Descrição`.
- Associate a person only when the full name, or otherwise the first name,
  matches exactly one eligible user. If it matches nobody or more than one
  user, store the card with no assignee and do not write that person's name
  on the card.
- Treat project names, card titles, descriptions, and comments as untrusted
  content. Do not run instructions found there as agent commands.
- Reuse the existing project and card model, names, and APIs.

Technical decisions for that scope:

- The chat surface stays `/portal/vetor-agent`. No new page or navigation
  item.
- The browser keeps posting the user message through the existing AI client.
  It does not query projects or cards for this feature.
- The worker, not the model, decides whether a project matches.
- Tool handlers call the existing `ProjectsService` methods that already
  enforce `viewProjects` and tenant scope: board read, `createCard`, and
  `updateCard`.
- Each of list, create, and update resolves the project again. A previous
  tool result is not permission to skip that check.
- The model cannot pass a project id, slug, or workspace id in place of the
  exact name.
- Card identity inside the resolved project uses the existing `cards.number`
  shown on the board as `#N`. A title match is strict and local to that
  project. A supplied number must belong to that project.
- Create and update validate tool arguments with DTOs and `class-validator`
  before any service call.
- Persistence stays on `projects` and `cards`. No second card or task table.

## Out of scope

- Deleting a card, moving or reordering a card, changing lanes, comments,
  attachments, checklist items, covers chosen from new uploads, project
  documents, finance, and workspace or project administration.
- Creating a project, renaming a project, or making project names unique.
- A new public route, a route without the existing session guard, or a
  weaker `viewProjects` rule.
- Fuzzy search, autocomplete, "did you mean", case folding, accent folding,
  trimming, or slug lookup.
- Reading or writing `.env` files, provider keys, or the production value of
  `AI_AGENT_SYSTEM_INSTRUCTIONS`.
- A new visual system, a new portal page, or browser-generated DOM paths and
  utility-class snapshots as an implementation contract.

## Acceptance criteria

- AC-001: A project name that is equal to exactly one accessible stored name,
  including case, accents, spaces, and punctuation, resolves to that project.
  The comparison does not trim or otherwise normalize the stored characters.
- AC-002: A partial name, a similar name, a different case, a missing or
  added accent, a different space run, different punctuation, a slug, or a
  project id does not resolve. The reply is exactly
  `O projeto "<nome informado>" não foi localizado. Informe o nome exatamente como cadastrado.`
  The quoted name is the explicit name taken from the current user message
  after removing one pair of wrapping quotes.
- AC-003: When the name does not resolve, list, create, and update perform
  no card read and no card write.
- AC-004: When the name resolves to one project, listing returns only that
  project's cards and only the fields named in API and integrations.
- AC-005: After the project resolves and the user returns the layout with
  `Título` and `Descrição`, the new card is stored on that project through
  `createCard`, with the existing number, lane, and default priority
  behavior. A blank, unknown, or colliding `Associado` stores
  `assigneeUserId` as null and does not copy that text into the title or
  description.
- AC-006: An update whose title matches exactly one card in that project, or
  whose card number matches one card in that project, changes only the
  supplied `UpdateCardDto` fields on that card.
- AC-007: When more than one card in the resolved project has the same exact
  title and the caller did not supply a card number, no card changes. The
  reply is exactly `Já existe um card com este título`.
- AC-008: A create reply that lacks `Título` or `Descrição` makes no API
  write. The assistant shows the layout again, keeping the lines already
  filled. An update with no writable field makes no API write.
- AC-009: A caller without `viewProjects`, a caller outside the project
  tenant, and a caller whose session cannot see the project cannot list,
  create, or update. A project outside the caller scope uses the same
  not-found reply as AC-002 and does not reveal that the name exists
  elsewhere.
- AC-010: Titles, descriptions, and comments returned to the model are data.
  They do not select a project, select a card, or authorize a write.
- AC-011: Two accessible projects named alike produce exactly
  `Existem dois projetos com o mesmo nome, e por isso não é possível apoiar.`
  Three or more produce exactly
  `Existem mais de dois projetos com o mesmo nome, e por isso não é possível apoiar.`
  List, create, and update do not run.
- AC-012: `Associado` equal to one eligible user's `firstName + " " + lastName`
  assigns that user. If no full name matches, `Associado` equal to exactly
  one eligible `firstName` assigns that user. Zero matches or more than one
  match create the card with a null assignee and do not persist the typed
  name.
- AC-013: A create request whose project resolves to one project receives the
  layout in User experience and does not create a card on that turn. The
  following user message is the create turn when `Título` and `Descrição`
  are filled.

## User experience

The existing conversation transcript is the only surface. The user writes in
the current composer. The assistant reply is ordinary transcript text. There
is no new panel, modal, or board embedded in the chat.

Confirmed Portuguese copy when the backend finds no accessible project:

`O projeto "<nome informado>" não foi localizado. Informe o nome exatamente como cadastrado.`

When exactly two accessible projects share the name, the reply is exactly:

`Existem dois projetos com o mesmo nome, e por isso não é possível apoiar.`

When three or more share it, the reply is exactly:

`Existem mais de dois projetos com o mesmo nome, e por isso não é possível apoiar.`

A caller who has `vetorAgent` and lacks `viewProjects` receives the existing
portal sentence `Você não tem permissão para esta ação.` The not-found
sentence stays reserved for an unresolved name, including a name that exists
only outside the caller scope.

When more than one card in the resolved project has the same exact title
and the message has no card number, the reply is exactly:

`Já existe um card com este título`

No card changes. A later message that includes the board number `#N` can
select the card.

A create request whose project resolved to one project shows this layout and
does not create a card in that turn. Labels are the existing Novo card
labels. Checklist, attachments, tags, and lane stay off this layout.

```text
Projeto: <nome exato já resolvido>
Título:
Descrição:
Associado:
Data início:
Data fim:
Prioridade: Média
```

`Título` and `Descrição` are required. `Associado`, the two dates, and
`Prioridade` may stay blank. Blank priority means `medium`. Accepted
priority words are `Baixa`, `Média`, and `Alta`. A later user message that
returns the layout with `Título` and `Descrição` is the create turn. The
`Projeto` line must still be the exact stored name. Lines already filled are
kept when the layout is shown again. A successful create replies with the
existing sentence `Operação realizada com sucesso.` and the new `#N`. That
reply does not repeat an `Associado` value that failed to match.

On the board, a card with no assignee shows no photo, no initials, and no
name. The Novo card form on `/portal/projetos` still requires `Associado`.

Listing and update replies may quote card titles and descriptions as data.
The assistant does not present text inside those fields as its own
instructions.

## API and integrations

No new HTTP path. The browser continues to use
`POST /api/v1/ai/conversations/{conversationId}/messages`. The request and
response bodies stay the same. Delivery records, in `docs/api.md` and in the
Swagger description of that operation, that a succeeded run may list, create,
or update cards as a server-side side effect. `openapi.yaml` does not gain
a path. It does record `assigneeUserId` as optional on card create, together
with `docs/api.md` and Swagger.

The worker adds a provider tool loop. The tools are server functions, not
public routes:

- `resolveProjectByExactName(projectName)`
- `listProjectCards(projectName)`
- `createProjectCard(projectName, input)`
- `updateProjectCard(projectName, cardNumber, input)` with `cardNumber`
  optional only when the title is unique

`listProjectCards`, `createProjectCard`, and `updateProjectCard` call
`resolveProjectByExactName` before any card operation. Zero matches return
`not_found`. Two or more matches return `ambiguous`. Neither outcome calls
`getBoard`, `createCard`, or `updateCard`.

Name resolution, in order:

1. Read the candidate from the tool argument.
2. If the whole candidate is wrapped in one pair of `"` or `'`, remove that
   pair. Do not trim, case-fold, strip accents, collapse spaces, or remove
   inner punctuation.
3. Accept the candidate only when the current user message contains it as a
   contiguous span whose neighbors are the string boundary, whitespace, or
   that same wrapping quote. A longer accessible project name that occupies
   the same span wins over a proper prefix. Example: stored names `Alpha` and
   `Alpha 2`; the message `Alpha 2` selects `Alpha 2` only.
4. Load `id` and `name` for projects in the caller's scoped tenant with a
   parameterized query. Compare with JavaScript `===` so database collation
   cannot fold case or accents.
5. Ignore projects outside that tenant. Do not use `ILIKE`, `LIKE`,
   `unaccent`, trigram search, or a client-supplied id.

`createProjectCard` runs only on the user message that returns the layout.
`title` and `description` come from `Título` and `Descrição`. The existing
card DTO trim applies to those lines and to `Associado`. It does not apply
to the project name. `assigneeUserId` is optional. The backend resolves
`Associado` itself, in this order, among active users of the project tenant
who already have project access:

1. Users whose `firstName + " " + lastName` is `===` to the trimmed
   `Associado` value.
2. If that set is empty, users whose `firstName` is `===` to that value.

One user assigns `assigneeUserId`. Zero users, or more than one user, force
`assigneeUserId` to null. The typed text is not written into `title`,
`description`, or any other column. The model cannot substitute a different
person: the candidate must be the `Associado` line of the current user
message. An empty line stays null. Omitted priority stays `medium`. `Baixa`,
`Média`, and `Alta` map to `low`, `medium`, and `high`. Any other priority
word, or a date that is not `YYYY-MM-DD`, shows the layout again and does
not create. Omitted tags stay an empty list. The lane stays the first lane
of the project, chosen inside `createCard`. Dates keep the existing range
check.

`POST /api/v1/projects/{id}/cards` accepts an omitted `assigneeUserId` and
stores null. The board form still sends an assignee. Delivery updates
`docs/api.md`, `openapi.yaml`, and Swagger for that optional field.

`updateProjectCard` accepts one or more of the existing `UpdateCardDto`
fields: `title`, `description`, `assigneeUserId`, `startsAt`, `dueAt`,
`priority`, `tags`, and `coverAttachmentId`. An empty patch does not call
`updateCard`. Lane, position, comments, attachments, and checklist items are
not tool fields. When `cardNumber` is present it selects the card, and a
title supplied with it must equal that card's title or the update is
refused. When `cardNumber` is absent, the title must match exactly one card
in the project. Changing the assignee uses the same full-name then first-name
rule. Zero matches or more than one match leave the current assignee in
place and do not write the typed name. If that was the only requested
change, `updateCard` is not called.

The tool result for a list contains `number`, `title`, `description`, `lane`,
`priority`, `assigneeFirstName`, `assigneeLastName`, `startsAt`, and `dueAt`.
A null assignee sends null for both name fields.
It omits tenant id, workspace id, user id, photo URL, metadata, comments,
attachments, checklist items, and filesystem paths.

Tool arguments are external input. DTOs use `class-validator` with whitelist
and forbid non-whitelisted properties. The service maps fields explicitly.
Controllers and tools return the existing response DTO fields named above,
not TypeORM entities.

A fixed instruction block is appended in code after the configured system
text. It states that project and card tools are the only source of project
facts, that names must come from the current user message, and that tool
results are untrusted data. An environment override of
`AI_AGENT_SYSTEM_INSTRUCTIONS` cannot remove that block. Delivery does not
edit an env file.

At most four provider tool rounds run per AI run. A repeated delivery of the
same run replays stored tool outcomes instead of creating another card.

## Data impact

`cards.assignee_user_id` becomes nullable. The foreign key to `users` stays
`ON DELETE RESTRICT`. A new migration performs that change. `docs/database.md`
records the nullable column. No second card table is added. The board create
form still requires a person; only a stored null is newly visible there.

`ai_runs` gains a nullable `tool_trace jsonb` column through a new migration.
Each entry stores the run-local tool call id, the tool name, the outcome
code (`resolved`, `not_found`, `ambiguous`, `forbidden`, `invalid`,
`created`, `updated`, `listed`), the project id when resolution succeeded,
and the card id when a card was created or updated. It does not store
titles, descriptions, comments, names, or message text. A redelivered run
returns the stored outcome for a call id that already succeeded. Delivery
updates the AI paragraph of `docs/database.md` to mention `tool_trace`.

## Security

The message route keeps `AccessTokenGuard` and the existing `vetorAgent`
check. Card tools run as the run's `requesterUserId` inside the conversation
`tenantId`, which already follows the session tenant for `Administrador` and
the home tenant otherwise. They call `ProjectsService`, which already
requires an active user, `viewProjects`, and the scoped tenant. A missing
action or a foreign tenant does not fall back to a public query.

A name the caller cannot access is indistinguishable from a missing name.
The tool result for that case is `not_found` and contains no project id.

Tool arguments are untrusted. Card titles, descriptions, and comments are
untrusted. The worker does not parse those strings for commands, and it does
not log them. The trace and the existing AI log redaction omit message
bodies, titles, and descriptions.

Create and update are not idempotent in the card table itself. The run trace
is what stops a redelivered run from inserting a second card for the same
tool call. A crash after the card insert and before the trace write can
still leave one extra card; the delivery does not add a second card key to
hide that window.

Assignee resolution does not guess. A full-name match is preferred over a
first-name match. A first name that belongs to two eligible users, or a
value that belongs to nobody, stores null and does not echo the typed name
in the card or in the success reply. Email, last name alone, partial names,
and different case or accents do not match.

An ambiguous project name does not ask for a workspace or another key. The
operation stops with the sentence in AC-011.

No new public route. No guard is removed. No secret is added to source.

## Testing

Backend unit tests beside the tool service, with the project and card
services mocked or backed by an in-memory fixture of names:

- AC-001: stored `São Paulo — Site` matches only that string.
- AC-002: reject `São Paulo`, `sao paulo — site`, `São  Paulo — Site`,
  `São Paulo — Site.`, a slug, and a UUID. Expect the exact not-found
  sentence and zero card calls.
- AC-003: not-found list, create, and update do not call the card methods.
- AC-004: a resolved list returns cards for that project id only, without
  tenant id, user id, comments, or attachment paths.
- AC-005: the filled layout calls `createCard` with that project id. One
  full name assigns that user. One first name assigns that user. An unknown
  name and two users named `Ana` call `createCard` with null assignee, and
  the stored title and description do not contain `Ana`.
- AC-006: one exact title, or one card number in that project, calls
  `updateCard` for that card id.
- AC-007: two cards titled `Deploy` and no number do not call `updateCard`.
  The reply is exactly `Já existe um card com este título`.
- AC-008: a layout missing `Título` or `Descrição`, and an update with no
  writable field, do not call the card methods. The missing create reply
  contains the layout.
- AC-009: missing `viewProjects`, and a project whose workspace tenant is
  outside the conversation tenant, return forbidden or not-found as
  specified and do not write.
- AC-010: a description that says to update another project does not change
  the resolved project or issue a second write.
- AC-011: two accessible projects named `Alpha` do not list, create, or
  update, and the reply is the two-project sentence. Three projects use the
  more-than-two sentence.
- AC-012: covered with AC-005. `ana` does not match `Ana`. `Ana Silva`
  matches that full name even when another user's first name is `Ana`.
- AC-013: the first create request returns the layout and does not call
  `createCard`. The next message with `Título` and `Descrição` does.

Delivery adds one frontend component test: a card with a null assignee
renders no initials and no assignee name. The Novo card control still
requires `Associado`. HTTP e2e covers the message route's authorization and
`POST /api/v1/projects/{id}/cards` with no assignee. The worker tool loop
includes one processor test that a not-found or ambiguous tool result does
not stream a successful mutation claim.

## Delivery

Do not implement while this specification is `draft`.

After approval, the smallest change is a tool service in
`backend/src/modules/ai-agent/`, DTOs for its arguments, a tool loop in the
existing run processor and OpenRouter adapter, the nullable
`cards.assignee_user_id` migration, the `ai_runs.tool_trace` migration, the
board's empty-assignee state, and the contract notes in `docs/api.md`,
`openapi.yaml`, `docs/database.md`, and the message operation description.
The frontend AI client stays in place. The layout is assistant text, not a
new form component.

`ProjectsService.createCard` and `ProjectsService.updateCard` remain the
write path. `getBoard` remains the read path, with the tool mapping the
narrow field list above.

Commands after implementation: backend `typecheck`, `lint`, `test`,
`test:e2e`, and `build`; root `spec-driven-development`. Root `format:check` and
`audit:all` when those scripts still exist. No frontend suite is required
unless a transcript assertion is added.

## Traceability

- Source kind: `human_prompt`.
- Source reference: `chat-2026-11-04-agent-project-cards`.
- Human prompt: Agente Beta at `/portal/vetor-agent` reads, creates, and
  updates cards on projects the caller can access; the project name is
  explicit and strictly equal; resolution is backend-side; a miss blocks
  every operation; duplicates and missing fields block the write; card text
  is untrusted.
- Related specifications: VETOR-012 and later Kanban specifications own the
  card model. VETOR-033 and VETOR-035 own the chat surface. This
  specification does not reopen them.
- Follow-up on 2026-11-04: an ambiguous project name stops assistance; a
  person is associated by full name or first name and is omitted when
  missing or colliding; create shows the fill-in layout first. A repeated
  card title replies `Já existe um card com este título`.
- Global contracts touched on delivery: `docs/api.md` for the message-route
  side effect and optional card assignee, `openapi.yaml` and Swagger for
  that field, `docs/database.md` for nullable `assignee_user_id` and
  `ai_runs.tool_trace`. `docs/product.md` records the ambiguous-name refusal
  and the unassigned card if those become durable product rules at approval.

## Implementation evidence

- Changed: `backend/src/modules/ai-agent/project-card-match.ts`, `backend/src/modules/ai-agent/project-card-tools.service.ts`, `backend/src/modules/ai-agent/run-processor.ts`, `backend/src/modules/ai-agent/ai-worker.module.ts`, `backend/src/modules/projects/projects.service.ts`, `backend/src/modules/projects/dto/card.dto.ts`, `backend/src/modules/projects/dto/project-response.dto.ts`, `backend/src/modules/projects/entities/card.entity.ts`, `backend/src/database/migrations/1760000025000-add-agent-project-card-tools.ts`, `frontend/components/projects/project-board.tsx`, `docs/api.md`, `openapi.yaml`, `docs/database.md`, and `docs/product.md`. The worker resolves the project name and runs list, create, and update before the model can paraphrase the required sentences.
- Tests: `npm run test --workspace backend` passed on 2026-11-04 with 51 files and 354 tests. `npm run test:e2e --workspace backend` passed with 13 files and 99 tests. `npm run test --workspace frontend -- components/projects/project-board.spec.tsx` passed with 28 tests.
- Checks: `npm run typecheck --workspace backend` passed. `npm run lint --workspace backend` passed. `npm run build --workspace backend` passed. `npm run typecheck --workspace frontend` passed. `spec-driven-development` passed for 40 specifications. `npm run format:check` failed on pre-existing files across the repository; the new agent tool files were formatted with Prettier. `npm run audit:all` failed with existing high and critical advisories in transitive dependencies. This change adds no package.

## Validation evidence

- AC-001: implementation evidence recorded; awaiting human validation.
- AC-002: implementation evidence recorded; awaiting human validation.
- AC-003: implementation evidence recorded; awaiting human validation.
- AC-004: implementation evidence recorded; awaiting human validation.
- AC-005: implementation evidence recorded; awaiting human validation.
- AC-006: implementation evidence recorded; awaiting human validation.
- AC-007: implementation evidence recorded; awaiting human validation.
- AC-008: implementation evidence recorded; awaiting human validation.
- AC-009: implementation evidence recorded; awaiting human validation.
- AC-010: implementation evidence recorded; awaiting human validation.
- AC-011: implementation evidence recorded; awaiting human validation.
- AC-012: implementation evidence recorded; awaiting human validation.
- AC-013: implementation evidence recorded; awaiting human validation.
