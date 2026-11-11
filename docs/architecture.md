# Architecture

## System context

```text
Browser -> Next.js frontend -> NestJS API -> Persistence when required
Browser -> Next.js /portal -> NestJS /api/v1/powerbi -> ms-powerbi-embedded -> Power BI REST
```

The frontend presents the product and consumes the backend HTTP API. The
backend owns domain behavior, validation, and integration boundaries. The
frontend never accesses the database directly.

PostgreSQL is available through Docker Compose for projects that need
persistence. TypeORM is adopted only after the product defines a persistent
model and the backend dependencies and configuration are added.

## Responsibilities

- **Frontend** — Next.js interface, accessibility, responsive behavior, and
  HTTP API consumption
- **Backend** — NestJS API, domain behavior, input validation, and
  server-side integrations
- **Infrastructure** — local Docker Compose environment, PostgreSQL, Redis
  for the Python Power BI token cache, and the `ms-powerbi-embedded` service
- **Documentation** — approved specifications, global contracts, and
  architectural decisions

## Delivery governance

This project uses Spec-Driven Development with human-prompt intake:

```text
Human prompt -> Draft specification -> Human approval -> Delivery agents -> Validation
```

A human prompt in an agent conversation is the only intake channel. Each
prompt is normalized into a versioned specification under `docs/specs/`.
Delivery agents may implement only an approved specification. Humans decide
business and security; agents decide design and technical how as senior
engineers. See [`docs/sdd/`](./sdd/) for the lifecycle, responsibilities,
decision authority, and adapter contract.

## Boundaries

- Business logic belongs in backend services.
- Feature behavior, acceptance criteria, and delivery evidence belong in an
  approved specification under `docs/specs/`.
- The consolidated HTTP contract is documented in `docs/api.md`, with
  Swagger at `/api/docs` and the versioned OpenAPI document in
  [`openapi.yaml`](../openapi.yaml).
- Shared persistent-model decisions are documented in `docs/database.md`.
- Shared visual decisions belong in `docs/design.md`. Agents extend that
  system without asking and promote recurring visual choices into it.
- Product-wide scope and integrations belong in `docs/product.md`.
- Secrets are supplied through environment configuration and never committed.

## References

- Product scope: [`product.md`](./product.md)
- SDD core: [`sdd/`](./sdd/)
- Feature specifications: [`specs/`](./specs/)
- Visual decisions: [`design.md`](./design.md)
- HTTP contract: [`api.md`](./api.md)
- OpenAPI: [`../openapi.yaml`](../openapi.yaml)
- Persistent model: [`database.md`](./database.md)
- File placement: [`conventions.md`](./conventions.md)
- Technical guidance: [`.cursor/rules/`](../.cursor/rules/)

## Architectural decisions

| Decision            | Rationale                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| npm workspaces      | Keep frontend and backend independent while sharing repository tooling     |
| Next.js App Router  | Support modern React rendering and routing                                 |
| NestJS              | Provide a modular HTTP API and dependency injection                        |
| Docker Compose      | Give local development a reproducible environment                          |
| Tenant files volume | Bind `infrastructure/repository/files` and store user photos per tenant id |
| PostgreSQL          | Provide an available relational database when persistence is required      |
| TypeORM             | Use only when the project adopts a relational persistent model             |
| Redis               | Cache Microsoft embed tokens for `ms-powerbi-embedded`                     |
| RabbitMQ            | Broker AI run commands only. It is not a second source of truth            |
| AI worker           | Independent NestJS process in `worker-proxy-agent-ia/`                     |
| Power BI Embedded   | Nest proxies selected Python routes; the browser never calls Python        |
| Figma               | Use as a visual reference when a product supplies one                      |
