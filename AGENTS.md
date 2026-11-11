# AGENTS.md — Agent guide

This repository is a reusable full-stack monorepo template. This guide links
the project contracts, rules, and skills that govern agent work.

## Project context

- `frontend/` — Next.js, React, TypeScript, and Tailwind
- `backend/` — NestJS API and domain logic
- `infrastructure/` — Docker Compose, Dockerfiles, and PostgreSQL
- `docs/` — feature specifications, global contracts, conventions, and decisions
- `.cursor/rules/` — persistent repository guidance
- `frontend/.agents/` — frontend guide and skills
- `backend/.agents/` — backend guide and skills

## Before implementation

1. Read this file.
2. For product behavior, read the relevant approved feature specification in
   [`docs/specs/`](docs/specs/) and
   [`docs/sdd/lifecycle.md`](docs/sdd/lifecycle.md) and
   [`docs/sdd/decision-authority.md`](docs/sdd/decision-authority.md). Do
   not implement a `draft` or `in_review` specification. When working in an
   SDD role, read [`docs/sdd/agents.yml`](docs/sdd/agents.yml) and use that
   role's `model` and `effort`.
3. Read only the global contract that applies to the work:
   - [`docs/product.md`](docs/product.md) for durable product decisions
   - [`docs/design.md`](docs/design.md) for shared visual decisions
   - [`docs/api.md`](docs/api.md) for the consolidated HTTP contract
   - [`openapi.yaml`](openapi.yaml) for the machine-readable HTTP contract
   - [`docs/database.md`](docs/database.md) for the shared persistent model
   - [`docs/conventions.md`](docs/conventions.md) for file placement
4. Read the matching Cursor rules and workspace skill.
5. Treat an empty or `TBD` business or security field as undecided and ask.
   Do not invent product scope or security policy. Decide missing design
   and technical how as a senior engineer, record it in the specification,
   and promote recurring visual decisions into `docs/design.md`.
6. Implement the smallest change that fulfills the approved specification,
   promote affected global decisions, and run the relevant quality checks.

## Source hierarchy

When sources conflict, use this order:

1. Explicit business or security requirement confirmed by the user
2. Approved feature specification in `docs/specs/`
3. Product, design, API, and data-model decisions in `docs/`
4. Architecture and security rules
5. Layer-specific rules
6. Skills and technical patterns

Never weaken security controls to ship a faster solution.

## Cursor rules

### Always applied

- [`architecture.mdc`](.cursor/rules/architecture.mdc) — application boundaries
- [`product.mdc`](.cursor/rules/product.mdc) — product and design contracts
- [`spec-driven-development.mdc`](.cursor/rules/spec-driven-development.mdc) — feature lifecycle and agent responsibilities
- [`security.mdc`](.cursor/rules/security.mdc) — security baseline
- [`quality-gate.mdc`](.cursor/rules/quality-gate.mdc) — tests and evidence
- [`language.mdc`](.cursor/rules/language.mdc) — English repository artifacts
- [`no-comments.mdc`](.cursor/rules/no-comments.mdc) — source-code comments
- [`workspaces.mdc`](.cursor/rules/workspaces.mdc) — npm workspace ownership
- [`readme.mdc`](.cursor/rules/readme.mdc) — human-only README

### Backend

For files in `backend/`, use:

- [`nestjs.mdc`](.cursor/rules/nestjs.mdc)
- [`nestjs_security.mdc`](.cursor/rules/nestjs_security.mdc)
- [`nestjs_testing.mdc`](.cursor/rules/nestjs_testing.mdc)
- [`typeorm.mdc`](.cursor/rules/typeorm.mdc) when the project adopts TypeORM
- [`postgres.mdc`](.cursor/rules/postgres.mdc) when work touches PostgreSQL
- [`api-contract.mdc`](.cursor/rules/api-contract.mdc)
- [`typescript-style.mdc`](.cursor/rules/typescript-style.mdc)

### Frontend

For files in `frontend/`, use:

- [`nextjs.mdc`](.cursor/rules/nextjs.mdc)
- [`nextjs_security.mdc`](.cursor/rules/nextjs_security.mdc)
- [`nextjs_testing.mdc`](.cursor/rules/nextjs_testing.mdc)
- [`api-contract.mdc`](.cursor/rules/api-contract.mdc)
- [`typescript-style.mdc`](.cursor/rules/typescript-style.mdc)

## Skills

### Frontend

Read [`frontend/.agents/SKILL.md`](frontend/.agents/SKILL.md) and, when
applicable:

- [`frontend/.agents/AGENTS.md`](frontend/.agents/AGENTS.md)
- [`frontend/.agents/skills/ui.md`](frontend/.agents/skills/ui.md)
- [`frontend/.agents/skills/seo.md`](frontend/.agents/skills/seo.md)
- [`frontend/.agents/skills/security.md`](frontend/.agents/skills/security.md)
- [`frontend/.agents/skills/testing.md`](frontend/.agents/skills/testing.md)
- [`frontend/.agents/skills/vercel-react-best-practices/SKILL.md`](frontend/.agents/skills/vercel-react-best-practices/SKILL.md)

Use the Vercel skill only when the task involves measurable performance,
rendering, data fetching, hydration, or bundle-size work.

### Backend

Read [`backend/.agents/SKILL.md`](backend/.agents/SKILL.md) and
[`backend/.agents/AGENTS.md`](backend/.agents/AGENTS.md). Then read the
relevant topic in
[`backend/.agents/skills/nestjs-best-practices/`](backend/.agents/skills/nestjs-best-practices/).

## Work by layer

### Frontend

- Keep database access in the NestJS API.
- Use Server Components by default and add client components only for browser
  behavior or interaction.
- Keep API calls in the dedicated client location from `docs/conventions.md`.
- Follow the confirmed design when one exists.

### Backend

- Keep HTTP concerns in controllers and business rules in services.
- Validate external input at the HTTP boundary.
- Use DTOs and avoid exposing persistence entities directly.
- Adopt TypeORM and migrations only when the product has a persistent model.

### Infrastructure

- Read `docs/architecture.md` and the relevant files in `infrastructure/`.
- Do not commit environment files, credentials, tokens, or private keys.
- Keep the versioned `.env.*.example` files accurate.
- Validate Docker Compose and Dockerfiles after infrastructure changes.

## Validation

Run the applicable commands after changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run sdd:validate
npm run build
npm run format:check
npm run audit:all
```

Do not report a check as passing unless it ran in the current session. Do not
create a commit or push without an explicit user request.
