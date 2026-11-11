# Backend agent guide

This is the NestJS workspace of the monorepo template. Apply the smallest
change that fulfills confirmed product and API decisions.

## Read first

1. The related approved specification in
   [`docs/specs/`](../../docs/specs/) for behavior, acceptance criteria,
   authentication, and integrations
2. [`docs/api.md`](../../docs/api.md) and [`openapi.yaml`](../../openapi.yaml)
   before adding or changing an endpoint. Update Swagger, `openapi.yaml`, and
   `docs/api.md` in the same change.
3. [`docs/database.md`](../../docs/database.md) when persistent data is needed
4. [`docs/conventions.md`](../../docs/conventions.md) for file placement
5. The relevant Cursor rules and
   [`nestjs-best-practices/SKILL.md`](skills/nestjs-best-practices/SKILL.md)

Do not implement a `draft` or `in_review` specification. Do not invent
product endpoints, authentication, health checks, background jobs,
persistence, or external services for an undecided business or security
scope. Ask the human about missing security policy. Decide missing
technical how as a senior engineer. See
[`docs/sdd/decision-authority.md`](../../docs/sdd/decision-authority.md).

## Workspace conventions

- Create one module per confirmed domain capability.
- Keep HTTP mapping in controllers and business rules in services.
- Validate external input with DTOs at the HTTP boundary.
- Return explicit response data and omit sensitive fields.
- Use TypeORM and migrations only after persistence is adopted.
- Read runtime configuration from environment variables.

## Testing

- This workspace uses Vitest and `vi`, including for HTTP integration tests.
- Put unit tests beside the code under test.
- Put HTTP integration tests in `backend/test/` and use `supertest`.
- The installed NestJS skill may show Jest examples; translate their concepts
  to Vitest APIs instead of adding Jest.

## Packages

Install backend dependencies only in this workspace:

```bash
npm install <package> --workspace backend
```

Do not add application dependencies to the root package.

## Completion

Follow `quality-gate.mdc`: tests in the same change, security review, and
commands actually run. Run `npm run sdd:validate` when the specification
changes. Do not create test-only or administrative routes.
