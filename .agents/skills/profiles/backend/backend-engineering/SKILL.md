---
name: backend-engineering
description: Apply Vetor backend engineering standards to the NestJS API and AI worker. Use when designing or changing modules, controllers, services, internal contracts, integrations, validation, authorization, or backend tests.
---

# Backend Engineering

## Workspace selection

- `backend/` owns HTTP authorization, business rules, repositories, PostgreSQL persistence, tenant policy, and server-side integrations.
- `worker-proxy-agent-ia/` owns the AI worker process and its execution boundary.
- `ms-powerbi-embedded/` is a Python integration service reached through the backend contract and is not an npm workspace.

The frontend and worker use documented application contracts and must not bypass the backend persistence boundary.

## Required inputs

- A human-approved specification in `tasks/specs/` for product behavior.
- The relevant API, database, architecture, security, and convention contracts.
- The target workspace package scripts and existing module patterns.

## Process

1. Keep controllers and transport handlers focused on input mapping, authentication context, and response mapping.
2. Put business rules in services and keep repository access in the Core API.
3. Validate every external input with DTOs and appropriate transformation at the HTTP boundary.
4. Return explicit response DTOs and exclude persistence entities and sensitive fields.
5. Derive tenant context from authenticated identity and authorize every protected operation.
6. Use authenticated Core API contracts for cross-service calls and preserve correlation, trace, and tenant context.
7. Add unit tests beside behavior and integration or end-to-end tests at the affected transport boundary.
8. Update the affected API, database, or architecture contract when the approved behavior changes it.

## Verification

Run the relevant workspace commands:

```bash
npm run typecheck --workspace <workspace>
npm run lint --workspace <workspace>
npm run test --workspace <workspace>
npm run build --workspace <workspace>
```

Run `npm run test:e2e --workspace <workspace>` when HTTP or transport behavior crosses a service boundary.

## Limitations

Do not invent routes, authentication flows, integrations, persistence, or business rules. Use the approved specification and global contracts as the source of truth.
