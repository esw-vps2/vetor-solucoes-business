# Specification-Driven Development

The human describes the feature. The agent creates the specification, implements the approved scope, and records the evidence. The human is the only approver of product scope.

The agent acts as a senior engineer: it asks about unresolved business and security decisions and decides the remaining design and technical details. Visual changes follow the consolidated design system.

```text
human request -> agent specification -> human approval -> implementation -> human validation
```

Feature specifications live in `tasks/specs/` and follow the template at `tasks/specs/_template.md`. Product behavior may start only after a human sets `status: approved`.

## Responsibilities

| Human | Agent |
| --- | --- |
| Describe the feature and its desired outcome | Create or update a specification from the template |
| Answer business and security questions | Record proposals and leave unresolved policy as `TBD` |
| Review and approve the specification | Decide design and technical implementation details |
| Request implementation after approval | Implement only the approved scope and record evidence |
| Validate the acceptance criteria | Provide the final validation evidence |

The agent must not invent product requirements or security policy. It decides design, architecture, module placement, persistence details, tests, and other technical choices within the approved scope and records them in the specification.

## Intake

The only supported intake channel is a human prompt in an agent conversation.

| Decision | Value |
| --- | --- |
| Intake channel | `human_prompt` |
| Human approver | The human who submitted the prompt |
| Traceability | The agent conversation |
| `source_reference` | `chat-YYYY-MM-DD-<slug>` |
| Automation | Agents may create or update `draft` specifications only |

Do not create specifications from GitHub Issues, Kanban cards, webhooks, or other systems.

## Lifecycle

| Status | Meaning | Implementation |
| --- | --- | --- |
| `draft` | The specification is being written | No |
| `in_review` | The specification is ready for human review | No |
| `approved` | The human approved scope and acceptance criteria | Yes |
| `implemented` | Delivery is complete and evidence is recorded | No new scope |
| `validated` | A human confirmed the acceptance criteria | Complete |
| `superseded` | A newer specification replaces this one | No |

The detailed lifecycle, role authority, configuration, adapters, and role assignments are in `.agents/sdd/`.

## Process

1. Create or update a `draft` specification from `tasks/specs/_template.md`.
2. Resolve business and security questions with the human. Keep unresolved items as `TBD`.
3. Set `status: in_review` when the specification is ready for review.
4. Wait for the human to set `status: approved`.
5. Implement only the approved specification and record changed files, tests, and limitations.
6. Set `status: implemented` after delivery evidence is complete.
7. Wait for human validation before setting `status: validated`.

Run `npm run sdd:validate` whenever a specification changes. Do not treat `docs/product.md`, `docs/design.md`, `docs/api.md`, or `docs/database.md` as substitutes for a feature specification.

## Governance files

- Lifecycle: `.agents/sdd/lifecycle.md`
- Roles: `.agents/sdd/roles.md`
- Decision authority: `.agents/sdd/decision-authority.md`
- Adapters: `.agents/sdd/adapters.md`
- Configuration: `.agents/sdd/configuration.md`
- Role assignments: `.agents/sdd/agents.yml`
- Template: `tasks/specs/_template.md`
