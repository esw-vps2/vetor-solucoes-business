---
name: database-design
description: Design or review PostgreSQL data models for the Core API and infrastructure. Use when a specification changes persistent data, entities, relationships, migrations, indexes, tenant scope, retention, or database operations.
---

# Database Design

Use this skill only for `backend/` and `infrastructure/`.

## Required inputs

- An approved specification that defines the persistent-data change.
- The affected global contracts in `docs/database.md`, `docs/api.md`, and `docs/conventions.md`.
- The PostgreSQL and TypeORM rules in `.cursor/rules/`.
- The current entities, migrations, repositories, and infrastructure configuration when they exist.

## Process

1. Confirm that persistence is part of the approved scope. Do not create entities, migrations, or database configuration while persistence is undecided.
2. Identify the owning workspace. Only the Core API may connect to PostgreSQL.
3. Model tables and entities with plural `snake_case` names, UUID identifiers, timezone-aware timestamps, explicit foreign keys, and indexes for foreign-key and access paths.
4. Require server-derived tenant context for tenant-owned records and repository operations. Never authorize from a client-provided tenant identifier.
5. Define ownership, deletion, update behavior, uniqueness, nullability, retention, sensitive fields, and migration order before implementation.
6. Keep DTOs and response contracts separate from persistence entities.
7. Review query shape, pagination, selected fields, transaction boundaries, and migration safety.
8. Record the approved data delta in the feature specification and promote durable decisions to `docs/database.md`.

## Verification

- The Core API is the only service with PostgreSQL access.
- Every tenant-owned relation has an explicit tenant-scoping strategy.
- Foreign keys, unique constraints, indexes, and delete behavior are explicit.
- Production synchronization is disabled and schema changes use reviewed migrations.
- Queries are parameterized, bounded, paginated, and select only required fields.
- Sensitive persistence fields are excluded from HTTP response DTOs.

## Limitations

Do not invent retention, deletion, backup, encryption, or compliance policy. Return unresolved decisions to specification review.
