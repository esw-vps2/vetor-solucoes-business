# Specification lifecycle

## States

| Status        | Meaning                                                            | Implementation allowed |
| ------------- | ------------------------------------------------------------------ | ---------------------- |
| `draft`       | Specification is being written or refined.                         | No                     |
| `in_review`   | Specification is ready for human review.                           | No                     |
| `approved`    | A human approved the scope and acceptance criteria.                | Yes                    |
| `implemented` | Delivery work is complete and evidence is recorded.                | No new scope           |
| `validated`   | A reviewer confirmed the implementation against the specification. | Complete               |
| `superseded`  | A newer specification replaces this one.                           | No                     |

## Transitions

```text
draft -> in_review -> approved -> implemented -> validated
  |         |             |
  +---------+-------------+-> superseded
```

Only a named human approver may change a specification from `in_review` to
`approved`. An intake adapter, specification agent, implementation agent, or
validator must never approve its own work.

## Approval gate

Agents may investigate a request while its specification is a `draft` or
`in_review`. They must not add or alter product behavior until the related
specification has `status: approved`.

If implementation reveals an unrecorded business requirement, product
ambiguity, security risk that changes product policy, or a conflict with a
global contract, stop the affected work and return the specification to
`draft` or `in_review`. Do not resolve a business or security question only
in code, a prompt, or an agent message.

If implementation reveals missing design or technical how that does not
change product behavior or security policy, the delivery agent decides it
as a senior engineer, records the choice in the specification, promotes a
recurring visual decision into `docs/design.md` when it belongs in the
shared system, and continues. See
[decision-authority.md](./decision-authority.md).

## Completion

An approved specification moves to `implemented` only after it contains:

- at least one `Changed:` entry that links changed code and affected global
  contracts;
- at least one `Tests:` entry with executed test evidence;
- the commands run and their outcomes;
- unresolved limitations, if any.

A human reviewer changes it to `validated` only after confirming that the
recorded evidence satisfies the approved acceptance criteria. The validation
evidence must contain one `AC-###: passed` entry for every acceptance
criterion.
