# Frontend agents

Index of Next.js skills and the project guide for this workspace.

## Project guide

[`AGENTS.md`](AGENTS.md) — architecture, design, accessibility, and how this
frontend fits the monorepo. Read this before installed skills.

For feature delivery, read the related approved specification in `docs/specs/`
before `docs/product.md`, `docs/design.md`, and `docs/conventions.md`. Do not
invent copy or routes when those fields are `TBD`. Decide visuals from the
consolidating design system without asking.

## Local skills

Project-specific (not from the CLI; do not overwrite on `npx skills update`):

- [`ui.md`](skills/ui.md) — consolidating visual system and accessible UI
- [`seo.md`](skills/seo.md) — metadata and indexing
- [`security.md`](skills/security.md) — frontend security
- [`testing.md`](skills/testing.md) — frontend tests

## Installed skill

[`vercel-react-best-practices`](skills/vercel-react-best-practices/SKILL.md) —
from `vercel-labs/agent-skills` (`frontend/skills-lock.json`).

Use when the task involves performance, data fetching, bundle size, Server
Components, hydration, or re-renders.

- Index: [`SKILL.md`](skills/vercel-react-best-practices/SKILL.md)
- Full guide: [`AGENTS.md`](skills/vercel-react-best-practices/AGENTS.md)
- Rule files: [`rules/`](skills/vercel-react-best-practices/rules/)

Do not apply these optimizations without a real need or without measuring
impact. The approved feature specification and global contracts win over
generic performance advice.
