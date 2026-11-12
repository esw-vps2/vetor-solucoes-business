# Intake adapter

This project uses one intake channel: a human prompt in an agent
conversation. The intake agent normalizes that prompt into a `draft`
specification under `tasks/specs/`.

Do not ingest GitHub Issues, Kanban cards, ticketing systems, forms,
webhooks, or APIs.

## Adapter contract

Before creating or updating a draft specification, the intake agent must
collect:

| Field               | Requirement                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `source_kind`       | Always `human_prompt`                                             |
| `source_reference`  | `chat-YYYY-MM-DD-<slug>` identifying the conversation             |
| Problem             | The observed user or business problem                             |
| Desired outcome     | Observable result expected after delivery                         |
| Known constraints   | Explicit exclusions, dependencies, design references, or policies |
| Acceptance criteria | Known conditions of success, when supplied by the request         |

The adapter records `source_kind` and `source_reference` in the specification
frontmatter. The original request is preserved in the conversation and in
repository history.

## Adapter limits

- An adapter may create or update only `draft` specifications.
- An adapter must not change a specification to `approved`, `implemented`, or
  `validated`.
- An adapter must not invent business requirements or security policy
  missing from the human prompt. Ask and leave those items `TBD`.
- An adapter may record senior design and technical decisions needed to
  make the draft implementable. See
  [decision-authority.md](./decision-authority.md).
- An adapter must not transfer credentials, tokens, personal data, or other
  secrets into a specification.

## Per-project setup

This project's channel, tracking location, approvers, and automation policy
are recorded in [`configuration.md`](./configuration.md). Changing the intake
channel requires an explicit update to that document.
