# Project SDD configuration

Complete this document when a project is created from the template. These
decisions configure the delivery process; they do not define product behavior.

| Decision                       | Project value                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Intake channel                 | `human_prompt`                                                                                        |
| Intake adapter owner           | Cursor agent in the human conversation (`intake` role)                                                |
| Tracking system and location   | Agent conversation, recorded as `source_reference` in `docs/specs/`                                   |
| Human approvers                | The human who submitted the prompt                                                                    |
| Specification storage location | `docs/specs/`                                                                                         |
| Automation policy              | Agent may create or update `draft` specifications from a human prompt only. No other intake channels. |
| Validation owner               | The human who approved the specification                                                              |
| Evidence storage location      | The related specification in `docs/specs/`                                                            |
| Preferred models by role       | `docs/sdd/agents.yml`                                                                                 |

## Preferred models by role

[`agents.yml`](./agents.yml) is the source of truth for the Cursor `model`
and `effort` of each SDD role. It does not change role authority in
[`roles.md`](./roles.md). An agent reads that file when starting a
role-specific chat or subagent. Do not invent a model assignment.

| Role key                | Assignment note                                          |
| ----------------------- | -------------------------------------------------------- |
| `intake`                | Declare the role in the first prompt of a dedicated chat |
| `specification`         | Dedicated chat; do not implement                         |
| `architecture_security` | Dedicated chat; do not implement or approve              |
| `human_approver`        | Never an LLM                                             |
| `frontend_delivery`     | Dedicated chat or subagent after `status: approved`      |
| `backend_delivery`      | Dedicated chat or subagent after `status: approved`      |
| `validation`            | Dedicated chat; do not change scope or approve the spec  |

### How to assign a model and a role

1. Open a new Cursor chat or Custom Agent for one SDD role.
2. Read [`agents.yml`](./agents.yml) and apply that role's `model` and
   `effort` in the Cursor model picker, or pass them when launching a
   subagent.
3. State the role in the first prompt. Example:

```text
SDD role: Backend delivery
Implement only the approved scope of docs/specs/<id>.md.
Do not change frontend or approve the specification.
```

One agent may hold more than one role only when a human assigns that
combination explicitly. A role must not approve or validate its own
deliverable.

## Configuration rules

- The only intake channel is a human prompt in an agent conversation.
- Do not create or update specifications from GitHub Issues, Kanban cards,
  webhooks, forms, or other systems.
- Record `source_kind: human_prompt` and
  `source_reference: chat-YYYY-MM-DD-<slug>`.
- The specification storage location remains versioned in the repository.
- Only humans listed as approvers may approve a specification.
- Automation may create drafts and report validation results, but it cannot
  bypass the approval gate.
- Preferred models live in [`agents.yml`](./agents.yml). They configure how
  humans and agents start role-specific sessions. They are not an intake
  adapter, an approval gate, or an automatic dispatcher.
- A project documents integration credentials outside this repository. Never
  record credentials, tokens, webhooks, or private URLs here.

## Project initialization checklist

- [x] Intake adapter selected
- [x] Approvers identified
- [x] Tracking and source-reference format documented
- [x] Automation boundaries approved
- [x] Validation owner identified
- [x] Preferred models by role documented
