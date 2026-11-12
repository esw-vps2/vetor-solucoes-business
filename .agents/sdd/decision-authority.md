# Decision authority

Agents in this project act as senior engineers. They decide design,
technical, and every other non-product question without asking. They ask
the human only about business and security.

A named human remains the only approver of a specification. Agent autonomy
does not approve scope, invent product behavior, or set security policy.

## Human-required decisions

Ask. Leave `TBD` until the human answers. Do not invent the answer.

### Business

A decision is business when it changes what the product is, who it is for,
what a user can do, or what the organization promises.

Ask about:

- Problem, desired outcome, in-scope and out-of-scope product behavior
- Personas, roles, and who may use a capability
- User-visible flows, product copy, branding, pages, and product routes
- Business rules, policies, and authorization meaning
- Which external integrations exist as product capabilities
- Metrics, claims, pricing, and success conditions
- Acceptance criteria that describe a user or business outcome

If the prompt does not decide a business item, keep it `TBD` and ask.

### Security

A decision is security when it changes a control, a trust boundary, who
may access what, or what data the system may collect, store, log, or
expose. Follow recorded security rules. Do not invent or weaken policy.

Ask about:

- New or changed authentication, authorization, or session policy
- New public routes, weakened guards, or exceptions to the security baseline
- What data may be collected, stored, logged, retained, or returned
- Secrets handling, token storage, and encryption choices that change policy
- Third-party access, supply-chain trust, or risk acceptance
- Threat, incident, or compliance requirements that change product behavior

Applying an already-recorded security rule (input validation, hashed
passwords, parameterized queries, omitting sensitive fields) is
implementation, not a new security decision.

If implementation reveals a security risk that changes product policy,
stop and return the specification to review. Do not resolve it only in
code.

## Agent-owned decisions

Decide. Record the choice in the specification. Do not block the draft on
a question the human did not need to answer. Use a senior-engineer
profile. Do not ask for permission to proceed.

### Design

A decision is design when it is how a confirmed screen or capability
looks, moves, and reuses the visual system. Do not ask about layout,
spacing, tokens, component chrome, or visual states that can follow the
consolidating pattern.

Decide:

- Screen composition, layout, spacing, typography, motion, and interaction
  chrome
- How to extend existing tokens, primitives, and components for a new
  surface
- Visual states (empty, loading, error, focus) that do not change product
  meaning
- Accessibility mechanics that implement already-stated requirements
- Whether a visual choice is feature-local or belongs in `docs/design.md`

Keep one visual system. Follow `docs/design.md` and the implemented UI.
When a choice repeats or becomes shared, promote it into `docs/design.md`
in the same delivery so the pattern consolidates as the product grows. Do
not introduce a second identity, a competing palette, or a one-off visual
language.

Copy, claims, brand assets, marketing sections, and new product pages
remain business decisions.

### Technical and remaining factors

A decision is technical when it is how to realize already-stated business
scope inside the approved stack, architecture, and quality rules. Every
other non-business, non-security factor follows the same senior autonomy.

Decide:

- Module, file, and test placement that follows `docs/conventions.md`
- NestJS and Next.js implementation patterns
- HTTP method, path, DTO, and error shape that implement a decided surface
- Persistence details: tables, columns, types, indexes, and migrations
- Library choices inside the existing stack
- Validation mechanics, guards, and internal error handling that apply
  recorded security policy
- Test strategy and evidence commands for the stated acceptance criteria
- Performance, observability, and operational internals that do not change
  the product promise or security policy

Record those choices in the relevant specification sections (`User
experience`, `API and integrations`, `Data impact`, `Security`, `Testing`,
`Delivery`) so the human can review them at approval time.

## Conflict and doubt

When sources conflict, keep this order:

1. Explicit business or security requirement confirmed by the human
2. Approved feature specification
3. Global product, design, API, and data contracts
4. Architecture and security rules
5. Technical and design judgment of the senior agent

If a choice could be read as business or security, ask. Prefer a question
over inventing product behavior or security policy.

If a choice is design or any other non-business, non-security factor,
decide, record it, and continue.

Never use agent autonomy to:

- Add or remove product capabilities
- Invent copy, branding, personas, or metrics
- Bypass the `approved` gate
- Weaken a security control or invent security policy
- Introduce a second visual identity that fights the consolidating system
- Contradict an approved global contract without returning the specification
  to review
