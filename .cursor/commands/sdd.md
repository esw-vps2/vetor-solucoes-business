# /sdd — Create a specification

Create a preliminary specification for the requested feature. Do not implement code or approve the specification.

## Read first

Read the project SDD governance in `.agents/sdd/`:

- `.agents/sdd/README.md`
- `.agents/sdd/configuration.md`
- `.agents/sdd/lifecycle.md`
- `.agents/sdd/decision-authority.md`
- `.agents/sdd/roles.md`
- `.agents/sdd/agents.yml` when a role-specific session is involved
- `.agents/sdd/adapters.md` when intake behavior is relevant
- `tasks/specs/_template.md`

These files define the SDD process. Do not create a parallel workflow.

## Rules

- Analyze the relevant code, contracts, and existing patterns.
- Do not implement code.
- Do not invent business requirements or security policy.
- Record missing business or security decisions as `TBD` and ask focused questions.
- Decide design and technical details as a senior engineer and record the proposals.
- Set `source_kind: human_prompt` and `source_reference: chat-YYYY-MM-DD-<slug>`.
- Include the requested outcome, scope, non-goals, and known acceptance criteria.

## Status

Follow the lifecycle in `.agents/sdd/lifecycle.md`. The human alone may set `status: approved`.

## Output

Use `tasks/specs/_template.md` and save the specification in `tasks/specs/` with the repository naming convention. Report the created path, proposed technical decisions, and unresolved questions.

## Request

$ARGUMENTS
