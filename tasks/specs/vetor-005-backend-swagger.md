---
id: VETOR-005
title: Backend Swagger documentation and health statistics
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-17-backend-swagger
created_at: 2026-09-17
updated_at: 2026-09-17
---

# Backend Swagger documentation and health statistics

## Context

The NestJS API already publishes product endpoints under `/api/v1`, recorded
in `docs/api.md`. There is no interactive OpenAPI/Swagger surface. Developers
and testers cannot inspect or try the current contract from the running
backend without reading markdown or calling the API by hand.

The root `GET /api/v1` operation currently returns the plaintext
`Hello World!` string. The requester asked to replace that response with
solution health statistics covering every runtime dependency that this
product uses to operate.

The requester asked to configure Swagger in the backend, include mocked data
for optional testing, keep that documentation updated whenever a new
endpoint is created, version an OpenAPI document at the repository root, and
serve Swagger in development and production behind authentication.

## Desired outcome

The running backend exposes Swagger at `/api/docs` in every environment. Opening
Swagger always requires the existing portal authenticated session. Every
published NestJS HTTP operation, including the health statistics endpoint, is
documented with mocked example data. Try it out executes the real backend
operations. The repository root contains `openapi.yaml` with the same
contract. Adding a new endpoint is incomplete unless Swagger, `openapi.yaml`,
and `docs/api.md` are updated in the same change.

`GET /api/v1` returns JSON health statistics for the API process, PostgreSQL,
and SMTP. The response is `200` when every check is up and `500` when any
check is down.

## In scope

- Configure Swagger UI at `/api/docs` on the NestJS backend in development
  and production.
- Require the existing portal access-cookie authentication for Swagger UI and
  the OpenAPI document served by the backend. Unauthenticated requests receive
  `401`.
- Publish a versioned OpenAPI document at the repository root as
  `openapi.yaml`. Keep it aligned with the Swagger document served by the
  backend.
- Document every published HTTP operation:
  - `GET /api/v1` (health statistics; replaces `Hello World!`)
  - `POST /api/v1/contact`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/session`
  - `POST /api/v1/auth/password-recovery/request`
  - `POST /api/v1/auth/password-recovery/verify`
  - `POST /api/v1/auth/password-recovery/reset`
- Supply mocked example request and response data for all of those operations
  so Try it out can be used without inventing field names or shapes.
- Execute Try it out against the real backend. Contact, login, refresh,
  logout, session, and password recovery keep their current side effects.
- Replace `GET /api/v1` `Hello World!` with public JSON health statistics for
  the solution runtime dependencies in use today: API process, PostgreSQL, and
  SMTP. SMTP is verified without sending mail. Do not add unused subsystems.
- Require every later endpoint to update Swagger, `openapi.yaml`, and
  `docs/api.md` in the same delivery, through backend setup and repository
  agent/process rules.
- Update `docs/api.md` and the HTTP-contract agent rules during approved
  delivery.

## Out of scope

- Changing contact, authentication, session, or password-recovery behavior,
  payloads, cookies, or rate limits
- A standalone mock server that intercepts or fakes those operations
- Frontend UI changes, including a marketing link to Swagger
- Replacing `docs/api.md` as the durable human-readable HTTP contract
- Additional health routes such as `/health`, `/health/live`, or
  `/health/ready`
- A second Swagger-only credential, Basic Auth scheme, or API key
- Health checks for subsystems this product does not use, including Redis,
  message queues, and third-party HTTP APIs

## Acceptance criteria

- AC-001: The backend serves Swagger UI at `/api/docs` in development and
  production. The document lists every published product endpoint in this
  specification with method, path, request, response, and error status codes
  aligned to the current contract.
- AC-002: Each documented operation includes mocked example data that a tester
  can use in Swagger without inventing field names or shapes.
- AC-003: Mocked examples do not contain real credentials, production secrets,
  or live mailbox addresses. Placeholder values use non-production domains
  such as `example.com`.
- AC-004: Delivery updates the HTTP contract process so a new endpoint is not
  considered complete unless Swagger, root `openapi.yaml`, and `docs/api.md`
  are updated in the same change.
- AC-005: Swagger Try it out calls the real NestJS operations. It does not use
  a mock transport. Authenticated operations continue to use the existing
  HttpOnly cookies.
- AC-006: The repository root contains `openapi.yaml` describing the same
  operations, schemas, and examples as the backend Swagger document.
- AC-007: `GET /api/v1` returns JSON health statistics instead of the
  plaintext `Hello World!` string. The operation is public. The JSON includes
  overall `status` (`healthy` or `unhealthy`) and per-check `status` for
  `api`, `database`, and `smtp` (`up` or `down`). It does not expose secrets,
  credentials, connection strings, hostnames, stack traces, or internal
  filesystem paths.
- AC-008: `GET /api/v1` returns `200` when every check is `up` and `500` when
  any check is `down`. The `500` body still uses the health JSON shape.
- AC-009: Unauthenticated requests to `/api/docs` and to the backend-served
  OpenAPI document return `401`. Authenticated portal users with a valid
  access cookie can open Swagger. Swagger does not introduce a second
  authentication scheme.

## User experience

An operator authenticates through the existing public `POST /api/v1/auth/login`
flow, which sets the access cookie. The operator then opens `/api/docs` on the
running backend in development or production. Swagger lists every documented
operation. Try it out uses the mocked examples and submits to the live API,
including contact email delivery and portal authentication.

A client calling `GET /api/v1` without authentication receives health
statistics. When the API, PostgreSQL, and SMTP are all reachable, the status
is `200` and `healthy`. When any of those checks fails, the status is `500`
and `unhealthy`, with the failed check marked `down`.

## API and integrations

Confirmed documentation and health surface:

| Decision               | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| Swagger UI path        | `/api/docs`                                                  |
| Root OpenAPI document  | `openapi.yaml` at the repository root                        |
| Enabled environments   | Development and production                                   |
| Swagger authentication | Existing portal access cookie; `401` when missing or invalid |
| Try it out execution   | Real backend operations                                      |
| Mocked examples        | All documented endpoints                                     |
| Standalone mock server | Not used                                                     |
| `GET /api/v1`          | Public health JSON; replaces hello text                      |
| Health checks          | `api`, `database`, `smtp`                                    |
| Healthy HTTP status    | `200`                                                        |
| Unhealthy HTTP status  | `500`                                                        |

Health response body:

```json
{
  "status": "healthy",
  "checks": {
    "api": { "status": "up" },
    "database": { "status": "up" },
    "smtp": { "status": "up" }
  }
}
```

`status` is `unhealthy` when any check is `down`. `api` is `up` when the
process handled the request. `database` is `up` when PostgreSQL accepts a
connectivity check through the existing TypeORM connection. `smtp` is `up`
when the configured SMTP transport verifies without sending a message.

Existing product endpoints stay as recorded in `docs/api.md`, except
`GET /api/v1`. Swagger must not invent extra product routes.

Approved delivery must promote the Swagger URL, the authentication rule, the
root OpenAPI file, and the health contract into `docs/api.md`.

## Data impact

Swagger and `openapi.yaml` do not persist inquiries, users, sessions, or
recovery tokens.

Try it out on live endpoints follows the existing contact and portal
persistence and email rules. That is not a new data model.

Health statistics are computed at request time. They are not stored. SMTP
verification must not send contact or password-recovery email.

## Security

- Do not put secrets, private keys, production SMTP credentials, or live user
  passwords in Swagger examples, `openapi.yaml`, or source.
- Mocked examples must not enumerate real portal accounts.
- Swagger UI and the backend-served OpenAPI document require the existing
  portal access cookie in every environment. Missing or invalid credentials
  return `401`. Do not add Basic Auth, an API key, or another credential type.
- Login, contact, password-recovery request/verify/reset, and health remain
  reachable without opening Swagger, matching their current public or cookie
  rules.
- Swagger must not weaken Helmet, CORS, validation, rate limiting, or cookie
  authentication on product endpoints. Helmet must still allow the Swagger UI
  to load for an authenticated session.
- Try it out uses the existing HttpOnly session cookies. Do not document
  tokens in query strings or example `Authorization` headers.
- The public health response must omit secrets, environment values, database
  URLs, SMTP credentials, JWT secrets, user records, hostnames, and stack
  traces. Per-check results are only `up` or `down`.
- Production Swagger Try it out can send real contact email and mutate portal
  sessions. Examples must remain non-production placeholders so operators do
  not submit live credentials from the documented samples.

## Testing

The approved delivery must include:

- Backend tests that unauthenticated `/api/docs` returns `401` and that an
  authenticated portal session can load Swagger.
- Backend tests that the documented paths include every operation in this
  specification.
- Tests that `openapi.yaml` exists at the repository root and lists those
  paths.
- Tests or fixtures proving example payloads match the DTO field names and
  use `example.com` placeholders.
- Tests that `GET /api/v1` returns the health JSON shape and no longer
  returns `Hello World!`.
- Tests that all-up health returns `200` and `healthy`, and that a down
  database or SMTP check returns `500` and `unhealthy`.
- Tests that the health response omits secrets and sensitive configuration.
- Process coverage: HTTP-contract rules require Swagger, `openapi.yaml`, and
  `docs/api.md` updates with every new endpoint.
- The applicable repository validation commands:
  `npm run typecheck`, `npm run lint`, `npm run test`, `npm run sdd:validate`,
  `npm run build`, and `npm run format:check`.

Planned acceptance-test mapping:

- AC-001: backend HTTP test against authenticated `/api/docs`.
- AC-002: Swagger/OpenAPI example assertions for each documented operation.
- AC-003: example-value assertions in the backend Swagger tests.
- AC-004: the updated HTTP-contract rule, `docs/api.md`, and `openapi.yaml`.
- AC-005: Swagger configuration and Try it out documentation tests; no mock
  server module.
- AC-006: repository-root `openapi.yaml` path and operation coverage tests.
- AC-007: `backend/src/app.controller.spec.ts` and an HTTP test for
  `GET /api/v1`.
- AC-008: health unit or HTTP tests for `200`/`healthy` and `500`/`unhealthy`.
- AC-009: unauthenticated `401` tests for `/api/docs` and the served OpenAPI
  document.

## Delivery

Backend, root `openapi.yaml`, and documentation/process updates. No frontend
change is required.

After approval, delivery promotes the Swagger URL, OpenAPI file, health
contract, and Swagger authentication rule into `docs/api.md` and the agent
HTTP-contract rules.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-17-backend-swagger`
- Request: configure Swagger in the backend with mocked data for optional
  testing, and keep it updated whenever a new endpoint is created.
- Follow-up decisions from the same conversation:
  - Swagger UI path is `/api/docs`.
  - Swagger is enabled in development and production.
  - Mocked examples cover all documented endpoints.
  - Try it out executes real backend operations.
  - Version `openapi.yaml` at the repository root.
  - Document `GET /api/v1` and change it from `Hello World!` to solution
    health statistics.
  - Health checks cover every runtime dependency this solution uses: API
    process, PostgreSQL, and SMTP.
  - Unhealthy health responses use HTTP `500`.
  - Swagger always requires authentication, using the existing portal access
    cookie.
- Existing contracts consulted: `docs/api.md`, `docs/product.md`,
  `docs/architecture.md`, `docs/conventions.md`, `docs/database.md`, and
  VETOR-003.

## Implementation evidence

- Changed: `backend/src/main.ts`, `backend/src/app.controller.ts`,
  `backend/src/app.service.ts`, `backend/src/modules/mail/mail.service.ts`,
  `backend/src/modules/contact/contact.controller.ts`,
  `backend/src/modules/portal/auth.controller.ts`,
  `backend/src/modules/portal/portal.module.ts`, DTOs under
  `backend/src/modules/contact/dto/` and `backend/src/modules/portal/dto/`,
  Swagger setup under `backend/src/common/swagger/`, health types under
  `backend/src/common/health/`, `openapi.yaml`, `docs/api.md`,
  `docs/architecture.md`, `tasks/specs/_template.md`, `.cursor/rules/api-contract.mdc`,
  `.cursor/rules/architecture.mdc`, `.cursor/rules/nestjs.mdc`, `AGENTS.md`,
  `.agents/skills/profiles/backend/nestjs-best-practices/SKILL.md`, and `.agents/skills/profiles/frontend/frontend-engineering/SKILL.md`.
- Tests: `backend/src/app.controller.spec.ts`,
  `backend/src/app.service.spec.ts`,
  `backend/src/common/swagger/swagger-path.spec.ts`,
  `backend/src/common/swagger/swagger-auth.middleware.spec.ts`,
  `backend/src/modules/mail/mail.service.spec.ts`,
  `backend/test/health.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`, and
  `backend/test/openapi-contract.spec.ts`.
- Commands: `npm run typecheck` passed; `npm run lint` passed; `npm run test`
  passed (backend 24, frontend 36, SDD 10); `npm run test:e2e` passed
  (backend 6); `npm run sdd:validate` passed; `npm run build` passed;
  `npm run format:check` passed.
- Limitations: Swagger UI is reachable only after a portal login that sets
  the access cookie. Independent validation of the acceptance criteria is
  still required.

## Validation evidence

- AC-001: delivery recorded; awaiting independent validation
- AC-002: delivery recorded; awaiting independent validation
- AC-003: delivery recorded; awaiting independent validation
- AC-004: delivery recorded; awaiting independent validation
- AC-005: delivery recorded; awaiting independent validation
- AC-006: delivery recorded; awaiting independent validation
- AC-007: delivery recorded; awaiting independent validation
- AC-008: delivery recorded; awaiting independent validation
- AC-009: delivery recorded; awaiting independent validation
