---
name: integration-testing
description: Design and implement integration tests across the Vetor API, frontend, AI worker, infrastructure, and external providers. Use when behavior crosses process or transport boundaries and unit tests cannot prove the contract.
---

# Integration Testing

Use this skill when a change crosses a service, HTTP, WebSocket, queue, Redis, database, or external-provider boundary.

## Required inputs

- The approved specification and acceptance criteria.
- The affected service contracts in `docs/api.md`, `docs/database.md`, and `docs/conventions.md`.
- The target workspace test configuration and existing fixtures.
- A clear list of real dependencies, controlled test doubles, and prohibited production side effects.

## Process

1. Identify the boundary under test and the component that owns the business rule.
2. Test the public contract through the narrowest real transport available: HTTP, WebSocket, queue, or repository integration.
3. Use isolated test data and deterministic configuration. Never use production credentials, data, or external accounts.
4. Validate successful, invalid, unauthorized, unavailable, duplicate, timeout, and retry paths when the contract exposes them.
5. Mock only external systems whose behavior is outside the repository's control, and verify the adapter contract around the mock.
6. Keep database integration within the backend boundary. The frontend and worker must use documented application contracts rather than PostgreSQL connections.
7. Run focused tests first, then the complete relevant workspace suite and the repository checks required for the changed boundary.

## Verification

- Tests assert observable contract behavior instead of private implementation details.
- Inputs are validated at the transport boundary.
- Authentication, authorization, tenant isolation, error responses, retries, and idempotency are covered when applicable.
- Tests clean up resources, sockets, queues, temporary files, and database state.
- No test requires secrets, public debugging routes, or uncontrolled network access.

## Limitations

Do not add product routes, persistence, providers, or infrastructure only to make a test easier. If an acceptance criterion is not testable with the current contracts, record the gap and return it to specification review.
