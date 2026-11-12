# Specification-Driven Development

The human describes the feature. The agent creates the specification, implements the approved scope, and records the evidence. The human is the only approver of product scope.

The agent acts as a senior engineer: it asks about unresolved business and security decisions and decides the remaining design and technical details. Visual changes follow the consolidated design system.

```text
human request -> agent specification -> human approval -> implementation -> human validation
```

Feature specifications live in `tasks/specs/` and follow the template at `tasks/specs/_template.md`. Plans live in `tasks/plan/` and task lists live in `tasks/todo/`. Product behavior may start only after a human sets `status: approved`.

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

The installed `spec-driven-development` skill defines the lifecycle, approval
gate, and role responsibilities. Repository-specific constraints are in
`AGENTS.md`, `.cursor/rules/`, and the durable contracts under `docs/`.

## Process

1. Create or update a `draft` specification from `tasks/specs/_template.md`.
2. Resolve business and security questions with the human. Keep unresolved items as `TBD`.
3. Set `status: in_review` when the specification is ready for review.
4. Wait for the human to set `status: approved`.
5. Implement only the approved specification and record changed files, tests, and limitations.
6. Set `status: implemented` after delivery evidence is complete.
7. Wait for human validation before setting `status: validated`.

Use the installed SDD, planning, implementation, and verification skills
through their documented workflow. Do not treat `docs/product.md`,
`docs/design.md`, `docs/api.md`, or `docs/database.md` as substitutes for a
feature specification.

## Governance files

- Process skill: `.agents/skills/profiles/architecture/spec-driven-development/SKILL.md`
- Planning skill: `.agents/skills/profiles/architecture/planning-and-task-breakdown/SKILL.md`
- Implementation skill: `.agents/skills/task/sdd-implement/SKILL.md`
- Project rules: `.cursor/rules/spec-driven-development.mdc`
- Template: `tasks/specs/_template.md`
