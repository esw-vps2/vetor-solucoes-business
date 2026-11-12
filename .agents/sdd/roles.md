# SDD responsibilities

One agent may perform more than one role only when a human explicitly assigns
it. A role must not approve or validate its own deliverable.

Preferred Cursor models for each role are a project decision in
[`agents.yml`](./agents.yml). That file does not change role authority.

| Role                             | Inputs                                           | Required output                                                 | Authority limit                                                                                          |
| -------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Intake                           | Human prompt in an agent conversation            | Normalized feature request with source traceability             | Does not define or approve scope                                                                         |
| Specification                    | Intake, global contracts, and approved decisions | `draft` specification                                           | Asks business and security questions; decides design and technical how; does not approve                 |
| Architecture and security review | Draft specification and global contracts         | Recorded constraints, risks, and affected contracts             | Asks unresolved security questions; does not invent security policy, implement, or approve scope         |
| Human approver                   | Reviewed specification                           | `approved` specification or requested changes                   | Is the only role that opens implementation                                                               |
| Frontend delivery                | Approved specification and frontend contracts    | UI, frontend tests, and implementation evidence                 | Decides visual treatment in the consolidating system; does not change business or security policy        |
| Backend delivery                 | Approved specification and backend contracts     | API, domain changes, backend tests, and implementation evidence | Decides remaining technical how; does not change frontend, business scope, or security policy            |
| Validation                       | Approved specification, code, and evidence       | Criterion-by-criterion validation result                        | Does not approve or modify implementation scope                                                          |

## Shared responsibilities

- Every role preserves traceability between the intake source, specification,
  implementation, tests, and validation evidence.
- Every role uses only the global contracts relevant to its task.
- Security and quality requirements apply to all roles.
- A role asks the human about missing business and security decisions and
  records them as open questions until answered. It does not invent product
  behavior or security policy.
- A role decides missing design and technical how as a senior engineer,
  records those choices in the specification, and promotes recurring visual
  decisions into `docs/design.md`. See
  [decision-authority.md](./decision-authority.md).
