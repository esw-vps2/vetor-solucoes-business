# ADR 0001: Full-stack monorepo template

## Status

Accepted

## Context

This repository is a reusable application base. It needs independent frontend
and backend workspaces, reproducible local infrastructure, and concise
guidance for human and agent contributors.

## Decision

Use npm workspaces with:

- `frontend/` for Next.js App Router, React, TypeScript, and Tailwind
- `backend/` for NestJS HTTP APIs and domain logic
- `infrastructure/` for Docker Compose, PostgreSQL, and Dockerfiles
- `.cursor/rules/` for repository guidance
- `.agents/skills/` for shared and layer-specific skills
- `docs/` for approved product, design, API, data-model, and architectural
  decisions

PostgreSQL is available locally for products that need persistence. TypeORM,
authentication, PWA capabilities, external integrations, and UI libraries are
adopted only after a confirmed product decision.

## Consequences

- Root commands validate both application workspaces.
- The frontend and database remain isolated by the backend HTTP API.
- Product and visual scope are not invented from starter code.
- New capabilities update their relevant documentation and tests.
