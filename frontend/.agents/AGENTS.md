# Frontend agent guide

This is the Next.js workspace of the monorepo template. Build only confirmed
product behavior and preserve the application boundaries.

## Read first

1. The related approved specification in
   [`docs/specs/`](../../docs/specs/) for scope, routes, content,
   integrations, and visual acceptance criteria
2. [`docs/design.md`](../../docs/design.md) for shared visual work
3. [`docs/api.md`](../../docs/api.md) and [`openapi.yaml`](../../openapi.yaml)
   before changing an API client
4. [`docs/conventions.md`](../../docs/conventions.md) for file placement
5. Relevant Cursor rules and [`SKILL.md`](SKILL.md)

Do not implement a `draft` or `in_review` specification. Treat an empty or
`TBD` business or security decision as undecided and ask. Do not invent
product copy, branding, pages, or external integrations. Decide missing
design and technical how as a senior engineer: follow
[`docs/design.md`](../../docs/design.md), extend the consolidating visual
system without asking, and promote recurring visual decisions into that
contract. See
[`docs/sdd/decision-authority.md`](../../docs/sdd/decision-authority.md).

## Rendering and structure

- Use the Next.js App Router and Server Components by default.
- Add client components only for browser APIs, local state, effects, or
  interaction handlers.
- Keep data access behind the NestJS API. The frontend never accesses the
  database directly.
- Keep HTTP calls in the API client location defined by
  `docs/conventions.md`.
- Create components and folders only when confirmed product work needs them.

## Design and accessibility

- Follow Figma only when the approved specification or `docs/design.md`
  contains an approved reference.
- Without a Figma file, decide layout, tokens, and visual states from the
  consolidating system in `docs/design.md` and the implemented UI. Do not
  ask the human for those details.
- Keep one visual language. Reuse tokens and primitives. Promote a repeated
  visual choice into `docs/design.md` in the same delivery.
- Use semantic HTML, keyboard-accessible interactions, clear labels, and
  appropriate alternative text.
- Implement responsive behavior, PWA support, metadata, and SEO only to the
  degree required by the product.

## Security

- Never expose secrets through client code or `NEXT_PUBLIC_*` variables.
- Treat frontend validation as user experience only.
- Do not rely on hidden UI for authorization.
- Do not render untrusted HTML without documented sanitization.

## Testing and completion

- This workspace uses Vitest and React Testing Library.
- Test interactive behavior, visible feedback, and regressions when they are
  introduced.
- Run the relevant lint, typecheck, test, and build commands before finishing.
- Run `npm run sdd:validate` when the specification changes.
- Do not commit or push without explicit user authorization.
