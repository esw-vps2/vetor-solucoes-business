# AGENTS.md — Agent guide

This repository is a reusable full-stack monorepo template. This guide links
the project contracts, rules, and skills that govern agent work.

## Project context

- `frontend/` — Next.js, React, TypeScript, and Tailwind application
- `backend/` — NestJS API, domain logic, authorization, repositories, and persistence
- `worker-proxy-agent-ia/` — NestJS AI worker process
- `ms-powerbi-embedded/` — Python Power BI integration service
- `infrastructure/` — Docker Compose, Dockerfiles, and PostgreSQL
- `docs/` — global contracts, conventions, and durable decisions
- `tasks/` — feature specifications, plans, and task lists
- `.cursor/rules/` — persistent repository guidance
- `.agents/skills/` — canonical repository skill registry, catalogs, and profiles

## Before implementation

1. Read this file.
2. For product behavior, read the relevant approved specification in
   [`tasks/specs/`](tasks/specs/), the applicable SDD rules in
   [`.cursor/rules/spec-driven-development.mdc`](.cursor/rules/spec-driven-development.mdc), and the installed
   [`spec-driven-development`](.agents/skills/profiles/architecture/spec-driven-development/SKILL.md)
   skill. Do not implement a `draft` or `in_review` specification.
3. Read only the global contract that applies to the work:
   - [`docs/product.md`](docs/product.md) for durable product decisions
   - [`docs/design.md`](docs/design.md) for shared visual decisions
   - [`docs/api.md`](docs/api.md) for the consolidated HTTP contract
   - [`docs/database.md`](docs/database.md) for the shared persistent model
   - [`docs/conventions.md`](docs/conventions.md) for file placement
4. Read the matching Cursor rules and the selected root skill(s) from
   [`.agents/skills/`](.agents/skills/).
5. Treat an empty or `TBD` business or security field as undecided and return
   it to specification review instead of inventing scope or policy.
6. Implement the smallest change that fulfills the approved specification,
   promote affected global decisions, and run the relevant quality checks.

## Source hierarchy

When sources conflict, use this order:

1. Explicit requirement confirmed by the user
2. Approved specification in `tasks/specs/`
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

For files in `worker-proxy-agent-ia/`, also use:

- [`nestjs.mdc`](.cursor/rules/nestjs.mdc)
- [`nestjs_security.mdc`](.cursor/rules/nestjs_security.mdc)
- [`nestjs_testing.mdc`](.cursor/rules/nestjs_testing.mdc)
- [`api-contract.mdc`](.cursor/rules/api-contract.mdc)
- [`typescript-style.mdc`](.cursor/rules/typescript-style.mdc)

Apply [`typeorm.mdc`](.cursor/rules/typeorm.mdc) and
[`postgres.mdc`](.cursor/rules/postgres.mdc) only when the backend persistence
model requires them.

### Frontend

For files in `frontend/`, use:

- [`nextjs.mdc`](.cursor/rules/nextjs.mdc)
- [`nextjs_security.mdc`](.cursor/rules/nextjs_security.mdc)
- [`nextjs_testing.mdc`](.cursor/rules/nextjs_testing.mdc)
- [`api-contract.mdc`](.cursor/rules/api-contract.mdc) for files in `frontend/lib/api/`
- [`typescript-style.mdc`](.cursor/rules/typescript-style.mdc)

## Skills

The canonical skill registry is [`.agents/skills/`](.agents/skills/), with
external CLI-installed skills locked in [`skills-lock.json`](skills-lock.json).
Before selecting skills, read
[`skills-catalog.yaml`](.agents/skills/skills-catalog.yaml),
[`agent-profiles.yaml`](.agents/skills/agent-profiles.yaml), and
[`workflow.yaml`](.agents/skills/workflow.yaml). Skills are loaded on demand
after the primary profile is selected.

For specification-driven work, use:

- [`spec-driven-development`](.agents/skills/profiles/architecture/spec-driven-development/SKILL.md)
- [`planning-and-task-breakdown`](.agents/skills/profiles/architecture/planning-and-task-breakdown/SKILL.md)
- [`sdd-implement`](.agents/skills/task/sdd-implement/SKILL.md)

Persist specifications in `tasks/specs/`, plans in `tasks/plan/`, and task
lists in `tasks/todo/`. Do not save those files directly in `tasks/`.

### Frontend

For frontend work, select the `frontend` profile and read the relevant skills:

- [`frontend-engineering`](.agents/skills/profiles/frontend/frontend-engineering/SKILL.md)
- [`vercel-react-best-practices`](.agents/skills/profiles/frontend/vercel-react-best-practices/SKILL.md)
- [`vercel-composition-patterns`](.agents/skills/profiles/frontend/vercel-composition-patterns/SKILL.md)
- [`web-design-guidelines`](.agents/skills/profiles/frontend/web-design-guidelines/SKILL.md)

Use the Vercel skill only when the task involves measurable performance,
rendering, data fetching, hydration, or bundle-size work.

### Backend

For backend and worker work, select the `backend` profile and read the relevant
skills:

- [`backend-engineering`](.agents/skills/profiles/backend/backend-engineering/SKILL.md)
- [`nestjs-best-practices`](.agents/skills/profiles/backend/nestjs-best-practices/SKILL.md)

Select shared skills from `.agents/skills/core/`, `.agents/skills/hybrid/`, and
`.agents/skills/task/` only when their task triggers apply.

## Work by layer

### Frontend

- Keep database access in the NestJS API.
- Use Server Components by default and add client components only for browser
  behavior or interaction.
- Keep API calls in the dedicated client location from `docs/conventions.md`.
- Follow the confirmed design when one exists.

### Backend

- Keep Core API HTTP concerns in controllers and business rules in services.
- Validate external input at the HTTP boundary.
- Use DTOs and avoid exposing persistence entities directly.
- Adopt TypeORM and migrations only when the product has a persistent model.

### Worker

- Keep AI worker process concerns separate from backend domain rules.
- Use the documented worker contract and preserve the backend ownership of
  product persistence.

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
npm run build
npm run format:check
npm run audit:all
```

Do not report a check as passing unless it ran in the current session. Do not
create a commit or push without an explicit user request.
