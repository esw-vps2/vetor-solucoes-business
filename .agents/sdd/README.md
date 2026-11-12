# Spec-Driven Development

This directory defines Spec-Driven Development for this project. It governs
feature delivery from a human prompt to a versioned specification.

Every feature follows this path:

```text
human prompt -> draft specification -> human approval -> implementation -> validation
```

The only intake channel is a human prompt in an agent conversation. The
intake agent normalizes that prompt into a specification under
`tasks/specs/`. Do not ingest GitHub Issues, Kanban cards, or other systems.

Agents ask the human about business and security decisions. They decide
design and technical how as senior engineers, and they keep one
consolidating visual system. See
[decision-authority.md](./decision-authority.md).

Read these documents in order:

1. [configuration.md](./configuration.md) — project-level process decisions
2. [agents.yml](./agents.yml) — preferred Cursor model and effort by SDD role
3. [lifecycle.md](./lifecycle.md) — states and approval gate
4. [roles.md](./roles.md) — responsibilities and authority
5. [decision-authority.md](./decision-authority.md) — human-required business and security vs senior design and technical autonomy
6. [adapters.md](./adapters.md) — prompt intake contract

Use [`tasks/specs/_template.md`](../../tasks/specs/_template.md) to create a feature
specification. Run `npm run sdd:validate` before requesting approval and after
changing a specification.
