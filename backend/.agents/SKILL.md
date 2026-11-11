# Backend agents

Index of NestJS skills and the project guide for this workspace.

## Project guide

[`AGENTS.md`](AGENTS.md) — folders, API contract, product limits, and how
this backend fits the monorepo. Read this before the installed skill.

## Installed skill

[`nestjs-best-practices`](skills/nestjs-best-practices/SKILL.md) — from
`Kadajett/agent-nestjs-skills` (`backend/skills-lock.json`).

Use when writing, reviewing, or refactoring NestJS code (modules, DI,
security, performance, tests).

Rule files: [`skills/nestjs-best-practices/rules/`](skills/nestjs-best-practices/rules/)

This install has no `AGENTS.md` inside the skill folder. Use `SKILL.md` as
the index and open individual files under `rules/` as needed.

## Testing adapter

This workspace uses Vitest. Use `vi` for mocks, spies, and timers. Treat Jest
examples in the installed skill as conceptual examples and adapt them to the
configured test runner instead of adding Jest.

Do not apply skill topics that the approved feature specification and global
contracts did not ask for (microservices, queues, extra auth). The approved
specification, `docs/product.md`, and `docs/api.md` win.
