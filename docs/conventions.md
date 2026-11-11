# Project conventions

This document is the source of truth for folder placement in the monorepo.
Approved feature behavior belongs in `docs/specs/`. Durable product, design,
API, and data-model decisions belong in their matching contracts under
`docs/`.

## Spec-Driven Development

```text
docs/
├── sdd/
│   ├── adapters.md
│   ├── agents.yml
│   ├── configuration.md
│   ├── lifecycle.md
│   └── roles.md
└── specs/
    ├── _template.md
    └── <feature-slug>.md
```

- Copy `docs/specs/_template.md` to create a feature specification.
- Use lowercase kebab-case file names, prefixed with the specification id,
  such as `vetor-001-create-profile.md`.
- Do not edit a specification outside its lifecycle state.
- Intake is a human prompt only. Do not add GitHub, Kanban, webhook, or other
  input-platform adapters unless `docs/sdd/configuration.md` is updated.

## Canonical folder structure

### Backend

```text
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   ├── config/
│   └── modules/
│       └── <feature>/
│           ├── <feature>.module.ts
│           ├── <feature>.controller.ts
│           ├── <feature>.service.ts
│           ├── dto/
│           └── entities/
└── test/
```

Add feature folders only when the product scope requires them.

### Frontend

```text
frontend/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── sections/
│   └── forms/
├── hooks/
├── lib/
│   ├── api/
│   ├── data/
│   └── utils.ts
├── public/
│   ├── brand/
│   └── icons/
└── types/
```

Create folders only when they support confirmed product work.

## Root configuration

The root owns shared configuration:

- `package.json` and `package-lock.json`
- `.prettierrc`, `.editorconfig`, and `.nvmrc`
- `.github/workflows/` for repository automation
- `.cursor/rules/` for persistent agent guidance

## Environment variables

- `infrastructure/.env.database`, `infrastructure/.env.backend`,
  `infrastructure/.env.frontend`, and `infrastructure/.env.powerbi` are local
  Docker Compose configuration and must not be committed.
- The matching `.env.*.example` files are versioned templates.
- PostgreSQL discrete values live in `.env.database` (`POSTGRES_HOST`,
  `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). The
  backend connection string is `DATABASE_URL` in `.env.backend`.
- Nest talks to `ms-powerbi-embedded` with `POWERBI_EMBEDDED_URL`,
  `POWERBI_EMBEDDED_API_KEY`, and `POWERBI_EMBEDDED_TIMEOUT`. Python Azure,
  Redis, and `API_KEY` values live in `.env.powerbi`.
- `PORT` configures the backend and `FRONTEND_PORT` configures the frontend
  under Docker Compose.
- `NEXT_PUBLIC_*` values are public browser values and must never contain
  secrets.
- `CORS` must match the allowed frontend origin when the API enables CORS.
- Database variables are used when the backend adopts persistence.

## Branches

- `main` — stable branch
- `feature/<slug>` — product work
- `fix/<slug>` — defect correction
- `chore/<slug>` — maintenance, tooling, or documentation

An issue number may be added to a branch name when the repository uses issue
tracking, but it is not required by this template.

## Agent skills

- Frontend: `frontend/.agents/`
- Backend: `backend/.agents/`

## Documented flows

Add a document under `docs/flows/` only when the project has a confirmed,
non-trivial process that benefits from a shared description.
