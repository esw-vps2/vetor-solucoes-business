# Agent Skills Registry

This directory contains the skills available to agents working in the Vetor
repository. The registry is versioned at the repository root and skills are
loaded on demand.

## Registry structure

```text
.agents/skills/
├── agent-profiles.yaml
├── skills-catalog.yaml
├── workflow.yaml
├── core/
├── hybrid/
├── profiles/
└── task/
```

Every skill has its own directory and a valid `SKILL.md` file:

```text
<category>/<skill-id>/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

The optional directories are present only when a skill needs them. The
directory name is the local skill identifier.

## Registry files

Read these files before selecting or installing a skill:

| File | Responsibility |
| --- | --- |
| `agent-profiles.yaml` | Maps profiles to agents and authorized skills. |
| `skills-catalog.yaml` | Defines skill identifiers, paths, status, origins, and profiles. |
| `workflow.yaml` | Defines profile selection, skill resolution, delivery stages, and validation. |

The catalogs and workflow are authoritative for selection and loading. Do not
load every installed skill. Select one primary profile, resolve only relevant
skills, remove duplicate identifiers, and load active skills on demand.

## How to use skills

Skills are active guidance files loaded on demand. They are not application
dependencies and do not need to be installed in a workspace package.

Use a skill in one of these ways:

1. Let the project workflow select it from the task and the primary profile.
2. Name the local skill identifier explicitly in the request:

   ```text
   Use the frontend-engineering skill to design this page with a distinctive
   visual direction and intentional typography.
   ```

3. Provide the file, directory, diff, or acceptance criteria required by the
   skill. Some skills cannot infer their scope safely without those inputs.

The local identifier is the name to use in requests. For example, the local
skill `frontend-engineering` comes from the upstream `frontend-design` skill,
so `frontend-engineering` is the installed project identifier.

The normal delivery sequence for a scoped feature is:

```text
brainstorming
  -> spec-driven-development
  -> planning-and-task-breakdown
  -> sdd-implement
  -> verification-before-completion
  -> requesting-code-review
```

Use only the stages that apply. `improve-codebase-architecture` and `grill-me`
have model invocation disabled and must be requested explicitly. The
`web-design-guidelines` skill requires a file or pattern and fetches the latest
guidelines before each review.

## Installed skills

This inventory covers every physical `SKILL.md` currently installed under
`.agents/skills/`. All listed skills have active catalog entries.

### Core skills

#### `brainstorming`

- **Purpose:** Clarifies intent, constraints, alternatives, and success criteria
  before creative work or behavior changes.
- **Use it:** Start a new feature, component, workflow, or other change whose
  desired outcome still needs to be shaped.
- **Path:** `core/brainstorming`

#### `systematic-debugging`

- **Purpose:** Investigates the root cause of bugs, test failures, build
  failures, performance problems, and unexpected behavior before proposing a
  fix.
- **Use it:** Ask for it before changing code to address a technical problem.
- **Path:** `core/systematic-debugging`

#### `writing-plans`

- **Purpose:** Produces a detailed implementation plan for multi-step work,
  including files, interfaces, tasks, and tests.
- **Use it:** Use when a specification exists but the work is too large or
  complex to implement safely in one step. The project workflow normally uses
  `planning-and-task-breakdown` instead.
- **Path:** `core/writing-plans`

#### `test-driven-development`

- **Purpose:** Guides the RED, GREEN, and REFACTOR cycle: write a failing test,
  implement the smallest passing change, and then improve the design.
- **Use it:** Apply before writing production code for a feature, bug fix,
  refactoring, or behavior change.
- **Path:** `core/test-driven-development`

#### `verification-before-completion`

- **Purpose:** Requires fresh command output and evidence before claiming that
  work is complete, fixed, or passing.
- **Use it:** Apply before the final status, commit, or pull request message.
- **Path:** `core/verification-before-completion`

#### `requesting-code-review`

- **Purpose:** Defines how to prepare context and request an independent code
  review for completed work.
- **Use it:** Apply after a major task or before merging, then resolve blocking
  findings.
- **Path:** `core/requesting-code-review`

#### `security-review`

- **Purpose:** Performs a confidence-based review for exploitable
  vulnerabilities such as injection, XSS, SSRF, authentication, authorization,
  cryptography, and secret exposure.
- **Use it:** Request it explicitly with the relevant diff, files, or scope.
  Report only findings supported by the codebase context.
- **Path:** `core/security-review`

#### `skill-creator`

- **Purpose:** Creates, edits, evaluates, benchmarks, and improves agent skills
  and their triggering descriptions.
- **Use it:** Use when adding a new skill or iterating on an existing
  `SKILL.md`, including evaluation runs.
- **Path:** `core/skill-creator`

### Hybrid skills

#### `api-design`

- **Purpose:** Designs stable API, module, component-prop, and other public
  interface contracts.
- **Use it:** Apply before creating or changing REST or GraphQL endpoints,
  service boundaries, DTOs, or public interfaces.
- **Path:** `hybrid/api-design`

#### `database-design`

- **Purpose:** Designs and reviews PostgreSQL and TypeORM data models,
  migrations, indexes, tenant scope, retention, and query behavior.
- **Use it:** Use for approved persistence changes in `backend/`
  and `infrastructure/`. Keep PostgreSQL access in the Core API.
- **Path:** `hybrid/database-design`

#### `distributed-systems`

- **Purpose:** Designs microservice boundaries, communication patterns,
  distributed data flows, event-driven systems, and resilience strategies.
- **Use it:** Apply when decomposing services or changing communication,
  consistency, retry, discovery, or failure behavior across services.
- **Path:** `hybrid/distributed-systems`

#### `observability`

- **Purpose:** Adds and reviews structured logs, metrics, traces, alerts, and
  operational evidence.
- **Use it:** Apply when shipping production behavior, adding I/O or retries,
  integrating services, or improving diagnosability. Use
  `performance-optimization` for measured slowness.
- **Path:** `hybrid/observability`

#### `documentation`

- **Purpose:** Records architectural decisions, API changes, feature context,
  trade-offs, and other durable knowledge.
- **Use it:** Apply when a decision is significant, expensive to reverse, public,
  or likely to be explained repeatedly. Use it to write ADRs and update
  project documentation.
- **Path:** `hybrid/documentation`

#### `performance-optimization`

- **Purpose:** Measures, diagnoses, fixes, and verifies performance bottlenecks
  across frontend, backend, queries, databases, and delivery.
- **Use it:** Apply when requirements, monitoring, or profiling shows a
  performance problem. Measure a baseline before optimizing and verify the
  result afterward.
- **Path:** `hybrid/performance-optimization`

#### `integration-testing`

- **Purpose:** Tests contracts that cross HTTP, WebSocket, queue, Redis,
  database, worker, or external-provider boundaries.
- **Use it:** Apply when unit tests cannot prove the behavior. Use isolated
  data, controlled doubles, and the narrowest real transport available.
- **Path:** `hybrid/integration-testing`

### Backend profile skills

#### `backend-engineering`

- **Purpose:** Applies Vetor backend standards to the NestJS API and AI worker.
- **Use it:** Apply when changing NestJS modules, controllers, services,
  validation, authorization, internal contracts, integrations, or backend
  tests. Preserve PostgreSQL ownership and service boundaries.
- **Path:** `profiles/backend/backend-engineering`

#### `nestjs-best-practices`

- **Purpose:** Provides production NestJS patterns for architecture,
  dependency injection, errors, security, performance, testing, persistence,
  APIs, microservices, and deployment.
- **Use it:** Apply when writing, reviewing, or refactoring NestJS modules,
  controllers, providers, or services.
- **Path:** `profiles/backend/nestjs-best-practices`

### Frontend profile skills

#### `frontend-engineering` (upstream: `frontend-design`)

- **Purpose:** Creates distinctive, intentional interfaces through deliberate
  choices about subject matter, layout, typography, color, content, and motion.
- **Use it:** Apply when creating or reshaping a UI. Give it the product
  subject, audience, primary user goal, and any approved visual constraints.
- **Path:** `profiles/frontend/frontend-engineering`

#### `vercel-react-best-practices`

- **Purpose:** Applies React and Next.js performance guidance for waterfalls,
  bundle size, server rendering, data fetching, re-renders, rendering, and
  JavaScript execution.
- **Use it:** Apply when writing or reviewing React components, Next.js pages,
  data fetching, hydration, bundle loading, or performance-sensitive code.
- **Path:** `profiles/frontend/vercel-react-best-practices`

#### `vercel-composition-patterns`

- **Purpose:** Designs scalable React composition with compound components,
  context providers, lifted state, explicit variants, and fewer boolean props.
- **Use it:** Apply when building reusable component APIs or refactoring
  components with many modes, render props, or state-propagation problems.
- **Path:** `profiles/frontend/vercel-composition-patterns`

#### `web-design-guidelines`

- **Purpose:** Reviews UI code against the current Web Interface Guidelines,
  including usability and accessibility expectations.
- **Use it:** Provide a file or pattern, for example
  `web-design-guidelines frontend/app/**`, and use the findings to guide
  fixes. The skill fetches the current upstream guidelines before reviewing.
- **Path:** `profiles/frontend/web-design-guidelines`

### Architecture profile skills

#### `system-design`

- **Purpose:** Translates validated requirements into architecture decisions,
  component designs, interfaces, integrations, and explicit trade-offs without
  over-engineering.
- **Use it:** Apply before choosing architecture or integration patterns when
  requirements, constraints, or failure modes need to be made explicit.
- **Path:** `profiles/architecture/system-design`

#### `improve-codebase-architecture`

- **Purpose:** Finds architectural deepening opportunities, presents them in a
  visual HTML report, and guides a focused follow-up discussion.
- **Use it:** Invoke explicitly for a codebase architecture review. Provide a
  direction or pain point when available; the report is written to the
  operating system temporary directory.
- **Path:** `profiles/architecture/improve-codebase-architecture`

#### `grill-me`

- **Purpose:** Runs a relentless interview to expose gaps and sharpen an
  existing plan or design.
- **Use it:** Invoke explicitly when a plan or architecture needs adversarial
  questioning before implementation.
- **Path:** `profiles/architecture/grill-me`

#### `spec-driven-development`

- **Purpose:** Creates an approved specification before coding and guides the
  transition from requirements to plan, tasks, and implementation.
- **Use it:** Apply for new features, projects, significant changes, ambiguous
  requirements, or work that spans independently testable capabilities. Store
  specifications under `tasks/specs/`.
- **Path:** `profiles/architecture/spec-driven-development`

#### `planning-and-task-breakdown`

- **Purpose:** Converts a specification or clear requirements into ordered,
  small, verifiable tasks with dependencies and acceptance criteria.
- **Use it:** Apply after requirements are clear and before implementation.
  Store the plan in `tasks/plan.md` and the task list in `tasks/todo.md`.
- **Path:** `profiles/architecture/planning-and-task-breakdown`

### Task skills

#### `sdd-implement`

- **Purpose:** Delivers an approved specification through its approved plan and
  task breakdown, with tests, security checks, documentation, and evidence.
- **Use it:** Apply only after the specification, plan, task scope, and relevant
  contracts have human approval.
- **Path:** `task/sdd-implement`

### Catalog aliases

The catalog also exposes these identifiers as references to existing skills;
they do not represent additional physical `SKILL.md` files:

- `adr-authoring` resolves to `hybrid/documentation`.
- The task-level `skill-creator` resolves to `core/skill-creator`.

## Profiles

### Backend

Use for APIs, services, business rules, integrations, and persistence:

- `profiles/backend/backend-engineering`
- `profiles/backend/nestjs-best-practices`

### Frontend

Use for interfaces, components, user experiences, and API consumption:

- `profiles/frontend/frontend-engineering`
- `profiles/frontend/vercel-react-best-practices`
- `profiles/frontend/vercel-composition-patterns`
- `profiles/frontend/web-design-guidelines`

### Architecture

Use for solution architecture, technical decisions, and engineering
governance:

- `profiles/architecture/system-design`
- `profiles/architecture/improve-codebase-architecture`
- `profiles/architecture/grill-me`
- `profiles/architecture/spec-driven-development`
- `profiles/architecture/planning-and-task-breakdown`

The generic community `writing-plans` skill remains installed for explicit
use, but it is not selected by project profiles. The specification workflow
uses `planning-and-task-breakdown` so all project plans stay in `tasks/`.

## Specification-driven workflow

Use the installed skills as a sequence:

1. `profiles/architecture/spec-driven-development` clarifies requirements,
   writes the specification, and stops for human approval.
2. `profiles/architecture/planning-and-task-breakdown` creates
   `tasks/plan.md` and `tasks/todo.md`.
3. `task/sdd-implement` delivers approved tasks.
4. Core verification, testing, security, documentation, and review skills
   provide task-specific checks.

Store persistent work artifacts in:

```text
tasks/
├── specs/
│   └── <feature-slug>.md
├── plan.md
└── todo.md
```

Do not create a second specification, planning, or workflow registry in
another directory.

## Skill categories

### Core

Core skills are shared across engineering profiles:

- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`
- `requesting-code-review`
- `security-review`
- `skill-creator`

### Hybrid

Hybrid skills are selected in addition to a primary profile:

- `api-design`
- `database-design`
- `distributed-systems`
- `observability`
- `documentation`
- `performance-optimization`
- `integration-testing`

### Task

Task skills are selected for a specific lifecycle phase:

- `sdd-implement`

## Installation and maintenance

Install external skills in the repository scope and target Cursor:

```bash
npx skills add owner/repository --skill upstream-skill-name --agent cursor --yes
```

Before installation:

1. Confirm the repository, upstream skill name, license, and compatibility.
2. Inspect the complete `SKILL.md` and auxiliary files.
3. Review scripts, commands, dependencies, and external URLs.
4. Confirm the local category and identifier in `skills-catalog.yaml`.
5. Avoid replacing an existing local skill without an explicit decision.

After installation:

1. Place the skill under the catalogued `.agents/skills/` path.
2. Preserve its references, scripts, and assets.
3. Register its source and upstream identifier in `skills-catalog.yaml`.
4. Confirm the profile allows the skill.
5. Verify that the catalog status and filesystem contents agree.

The catalog uses these statuses:

| Status | Meaning |
| --- | --- |
| `planned` | Referenced by the workflow but not implemented or verified. |
| `active` | Contains a maintained `SKILL.md` and can be loaded. |
| `deprecated` | Must not be selected for new work. |

Use `npx skills list --agent cursor` to inspect CLI visibility when the CLI is
available. Do not install skills globally.

## Validation

For a changed registry or profile:

```bash
npm run format:check
git status --short
```

Confirm that:

- every active catalog path contains `SKILL.md`;
- every profile identifier resolves to an active catalog entry;
- every catalog reference resolves to an existing skill;
- no duplicate skill identifier or canonical path exists;
- no credentials, tokens, private URLs, or secrets are recorded;
- the selected skills match the task profile and scope.

The registry is the only versioned source for agent skills in this repository.
