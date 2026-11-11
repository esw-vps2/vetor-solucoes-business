# TEMPLATE

Full-stack monorepo with **NestJS** (backend), **Next.js** (frontend), **TypeORM**, and **PostgreSQL**.

Frontend design follows the Figma documented in [`docs/design.md`](./docs/design.md). Product scope lives in [`docs/product.md`](./docs/product.md).

## Structure

```
project/
├── AGENTS.md                          # Entry point for AI agents in the monorepo
├── .cursor/
│   └── rules/                         # Persistent Cursor rules (.mdc)
├── backend/
│   ├── skills-lock.json               # Lockfile of installed skills
│   └── .agents/
│       ├── SKILL.md                   # Index of backend skills
│       ├── AGENTS.md                  # Backend agent guide (folders, API, limits)
│       └── skills/
│           └── nestjs-best-practices/ # Installed NestJS skill
│               ├── SKILL.md
│               ├── AGENTS.md
│               └── rules/
├── frontend/
│   ├── skills-lock.json
│   └── .agents/
│       ├── SKILL.md                   # Index of frontend skills
│       ├── AGENTS.md                  # Frontend agent guide (Figma, a11y, UX)
│       └── skills/
│           ├── ui.md                  # Local skills (project-specific)
│           ├── seo.md
│           ├── security.md
│           ├── testing.md
│           └── vercel-react-best-practices/
│               ├── SKILL.md
│               ├── AGENTS.md
│               └── rules/
├── docs/                              # Product, design, API, architecture, ADRs
├── infrastructure/                    # Docker Compose, Dockerfiles, env templates
└── package.json
```

Role of each AI file:

| File                     | Where                      | Purpose                                                                         |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------- |
| `AGENTS.md`              | root                       | Orchestrates the monorepo: reading order, hierarchy, limits                     |
| `.cursor/rules/*.mdc`    | root                       | Cursor guardrails (always applied or by glob)                                   |
| `.agents/SKILL.md`       | `backend/` and `frontend/` | Layer index: which skill to use                                                 |
| `.agents/AGENTS.md`      | `backend/` and `frontend/` | Layer-specific guide (backend: API/folders; frontend: Figma, a11y, UX)         |
| `.agents/skills/<name>/` | per layer                  | Installable skill (`npx skills add`) with `SKILL.md`, `AGENTS.md`, and `rules/` |
| `skills-lock.json`       | per layer                  | Source and hash of skills installed by the CLI                                  |

## Requirements

- Node.js 22 (see `.nvmrc`)
- npm 10+
- Docker and Docker Compose v2
- Run all commands from the **monorepo root**

## Infrastructure files

| File | Role |
| --- | --- |
| `infrastructure/docker-compose.yml` | Local dev: volumes + hot reload |
| `infrastructure/dockerfile.backend.yml` | NestJS — stages `development` → `builder` → `runner` |
| `infrastructure/dockerfile.frontend.yml` | Next.js — stages `deps` → `dev` → `builder` → `runner` |
| `infrastructure/.env.backend.example` | Backend env template (copy to `.env.backend`) |
| `infrastructure/.env.frontend.example` | Frontend env template (copy to `.env.frontend`) |

## Quick start

```bash
# 1. Environment variables
cp infrastructure/.env.backend.example infrastructure/.env.backend
cp infrastructure/.env.frontend.example infrastructure/.env.frontend

# 2. Install dependencies from the lockfile
npm ci

# 3. Start stack (Postgres + apps)
npm run docker:up

# Or run apps locally against Postgres:
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Backend health: http://localhost:3001/api/v1/health
- Postgres: port `${DB_PORT:-5432}`, database `app`

```bash
npm run docker:down
npm run docker:reset   # down -v + up --build
```

`PORT` (in `.env.backend`) sets the backend port on host and container.
`FRONTEND_PORT` (in `.env.frontend`) sets the frontend port; if it changes,
update `CORS` in `.env.backend` so the allowed origin still matches.

Persistent data and logs live in `infrastructure/repository/`. Named volumes
for `node_modules` and `.next` are not overwritten by hot-reload binds.

## Environment

Never commit `.env.backend` or `.env.frontend`. Never put secrets in Docker
build args or in `NEXT_PUBLIC_*`.

| File | Variables |
| --- | --- |
| `infrastructure/.env.backend` | `PORT`, `API_PREFIX`, `CORS`, `DB_*`, `JWT_*`, `MAIL_*`, logging |
| `infrastructure/.env.frontend` | `FRONTEND_PORT`, `NEXT_PUBLIC_API_URL` |

`NEXT_PUBLIC_API_URL` is the public API origin (baked into the Next.js build).

Generate random hex values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and
`DB_PASSWORD` (do not reuse the example placeholders in shared environments):

```bash
openssl rand -hex 32
```

## Main commands

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:frontend
npm run test:e2e
npm run audit
npm run format
npm run docker:config
npm run docker:up
npm run docker:down
npm run docker:reset
```

After changing npm dependencies:

```bash
docker compose -f infrastructure/docker-compose.yml \
  --env-file infrastructure/.env.backend \
  --env-file infrastructure/.env.frontend \
  build --no-cache backend frontend
docker compose -f infrastructure/docker-compose.yml \
  --env-file infrastructure/.env.backend \
  --env-file infrastructure/.env.frontend \
  up
```

Validate Compose interpolation without starting containers:

```bash
cp infrastructure/.env.backend.example infrastructure/.env.backend
cp infrastructure/.env.frontend.example infrastructure/.env.frontend
docker compose -f infrastructure/docker-compose.yml \
  --env-file infrastructure/.env.backend \
  --env-file infrastructure/.env.frontend \
  config --quiet
```

## Production images (CI)

```bash
docker build -f infrastructure/dockerfile.backend.yml --target runner -t app-backend .
docker build -f infrastructure/dockerfile.frontend.yml --target runner \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}" \
  -t app-frontend .
```

Next.js inlines `NEXT_PUBLIC_*` at build time. Set production values before
the image build. CI should read them from GitHub Actions Variables (`vars`),
never from secrets in build args.

A dedicated production Compose file can be reintroduced when deploy exists.

## Documentation

| Document                                               | Description                                        |
| ------------------------------------------------------ | -------------------------------------------------- |
| [AGENTS.md](./AGENTS.md)                               | Entry point for AI agents (rules, skills, product) |
| [docs/product.md](./docs/product.md)                   | Product scope (source of truth)                    |
| [docs/design.md](./docs/design.md)                     | Figma and UI guidelines                            |
| [docs/architecture.md](./docs/architecture.md)         | System architecture                                |
| [docs/api.md](./docs/api.md)                           | API contracts                                      |
| [docs/database.md](./docs/database.md)                 | Data model and migrations                          |
| [docs/coding-standards.md](./docs/coding-standards.md) | Coding standards                                   |
| [docs/conventions.md](./docs/conventions.md)           | Project conventions                                |
| [docs/adr/0001-stack.md](./docs/adr/0001-stack.md)     | Stack decision record                              |

Docker, env files, and local/production images are documented in this README
(sections Infrastructure files, Quick start, Environment, Production images).

## Agent skills

Skills installed in this repository and commands to repeat the install in other projects. Catalog: [skills.sh](https://skills.sh/).

| Layer    | Skill                         | Source                                                                            | In this repo                                           |
| -------- | ----------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Backend  | `nestjs-best-practices`       | [`Kadajett/agent-nestjs-skills`](https://github.com/Kadajett/agent-nestjs-skills) | `backend/.agents/skills/nestjs-best-practices/`        |
| Frontend | `vercel-react-best-practices` | [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills)         | `frontend/.agents/skills/vercel-react-best-practices/` |

Local frontend skills (not from the CLI): `frontend/.agents/SKILL.md`, `frontend/.agents/AGENTS.md`, `ui.md`, `seo.md`, `security.md`, and `testing.md`. Copy these files if you want the same guide in another project.

### Install in another project

Run the command **inside the folder** where the skill should live (for example `backend/` or `frontend/`). The CLI creates `.agents/skills/` and `skills-lock.json` in that directory.

**Backend (NestJS):**

```bash
npx skills add https://github.com/kadajett/agent-nestjs-skills --skill nestjs-best-practices -a cursor -y
```

Equivalent shorthand:

```bash
npx skills add Kadajett/agent-nestjs-skills --skill nestjs-best-practices -a cursor -y
```

**Frontend (React / Next.js):**

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

Equivalent shorthand:

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
```

**Useful options:**

```bash
# Skip confirmation
npx skills add Kadajett/agent-nestjs-skills --skill nestjs-best-practices -y

# Available in all of the user's projects
npx skills add Kadajett/agent-nestjs-skills --skill nestjs-best-practices -g -y

# Specific agents (e.g. Cursor)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a cursor -y
```

**Maintenance:**

```bash
npx skills check    # check for updates
npx skills update   # update installed skills
```

## Notes

- Use npm workspaces from the repository root.
- Never commit `.env.backend` or `.env.frontend`; use the `.example` templates.
- Never hardcode secrets in Dockerfiles or Compose.
- Postgres data: `infrastructure/repository/postgres`
- Backend logs: `infrastructure/repository/logs`
- Frontend calls the API through `frontend/lib/api/`; it must never access the database directly.
- Do not invent product scope — update `docs/product.md` first.

# Skills by Project

## Caveman

This skill reduces the size of prompts so we can save tokens. To install it, run this command in your terminal:
  
  ```bash
  npx skills add https://github.com/juliusbrussee/caveman --skill caveman
  ```

## impeccable

Frontend design and iteration for production-grade interfaces, from concept to ship. You can modified your design with this skill.

 To install it, run this command in your terminal:
  
  ```bash
  npx skills add https://github.com/pbakaus/impeccable --skill impeccable
  ```
