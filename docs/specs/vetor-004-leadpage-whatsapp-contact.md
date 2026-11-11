---
id: VETOR-004
title: Leadpage WhatsApp contact widget
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-17-whatsapp-contact-widget
created_at: 2026-09-17
updated_at: 2026-09-17
---

# Leadpage WhatsApp contact widget

## Context

The public leadpage already offers contact through the header `Fale conosco`
modal from VETOR-003. The requester asked for a visible WhatsApp entry point:
a WhatsApp icon with a robot character speaking that VETOR is ready to help.
The destination number must come from an environment variable so operations
can change the receiving number without changing source code.

VETOR-002 listed WhatsApp as out of scope for that restyle. This specification
adds WhatsApp click-to-chat on the public leadpage.

## Desired outcome

Visitors on the public leadpage see a persistent WhatsApp contact control. The
control shows a robot that presents the Portuguese speech
`Estou pronto para lhe atender.` Selecting the control opens WhatsApp with the
number configured in the environment. No number is hardcoded in application
source. The control does not display a WhatsApp brand mark.

## In scope

- Add a public WhatsApp contact widget on the leadpage route `/`.
- Present a robot character with the speech bubble
  `Estou pronto para lhe atender.` Do not render a WhatsApp brand mark.
- Open the visitor's WhatsApp conversation using the official click-to-chat
  URL and the number from the environment variable
  `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Keep the number out of source code. Record only a placeholder in
  `infrastructure/.env.frontend.example`.
- Honor existing leadpage accessibility, keyboard, focus, and
  `prefers-reduced-motion` requirements.
- Update `docs/product.md`, `docs/design.md`, and the frontend environment
  example during approved delivery.

## Out of scope

- WhatsApp Business API, webhooks, bots, or automated replies
- Persisting WhatsApp conversations, leads, or chat history
- Changing the header contact modal, portal authentication, or SMTP contact
- Showing the widget on `/portal` unless a later approved specification adds
  it
- A second icon library or third-party chat widget
- Publishing social profile URLs beyond this WhatsApp click-to-chat action

## Acceptance criteria

- AC-001: The leadpage `/` shows a WhatsApp contact control that includes a
  robot character and the exact speech `Estou pronto para lhe atender.` It
  does not render a WhatsApp brand mark.
- AC-002: Selecting the control opens WhatsApp click-to-chat for the number
  configured in `NEXT_PUBLIC_WHATSAPP_NUMBER`. The number is not hardcoded in
  source.
- AC-003: The control remains usable on mobile and desktop, is keyboard
  reachable, has an accessible name, and respects `prefers-reduced-motion`.
- AC-004: If `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty, the widget is not
  rendered.
- AC-005: The widget does not persist messages, does not call the NestJS API,
  and does not store the number in `localStorage` or `sessionStorage`.

## User experience

1. A visitor on `/` sees a fixed WhatsApp widget in the lower-right corner,
   above the page gutter and below the header stacking context.
2. A robot character appears with a speech bubble that says
   `Estou pronto para lhe atender.`
3. The visitor activates the control with a pointer or keyboard.
4. WhatsApp opens in a new browsing context through
   `https://wa.me/<digits>`, using only digits from the environment variable
   (country code plus subscriber number, no `+`, spaces, or punctuation).
5. The existing `Fale conosco` modal remains available as a separate contact
   path.

On viewports that cannot keep the bubble and robot side by side, the speech
remains readable and the tap target stays at least 44px. Decorative motion
stops when `prefers-reduced-motion` is set. The control uses `rel` values
`noopener noreferrer` when it opens a new context.

## API and integrations

No NestJS endpoint is added. The frontend does not call the backend for this
feature.

The integration is WhatsApp click-to-chat:

- URL: `https://wa.me/{NEXT_PUBLIC_WHATSAPP_NUMBER}`
- Transport: visitor's WhatsApp application or WhatsApp Web
- Configuration: frontend environment only

Proposed environment variable:

| Name                          | Workspace | Purpose                                         |
| ----------------------------- | --------- | ----------------------------------------------- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | frontend  | Public destination number in digits, E.164-like |

The value is public because the browser must build the link. It is a published
contact number, not a secret, token, or private key. Do not put credentials
in this variable.

Example placeholder only: `5511999999999`.

No prefilled `text` query parameter is included unless a later decision adds
one. The visible speech stays on the page; the WhatsApp thread starts empty.

## Data impact

None. The product does not persist WhatsApp numbers, visitor identity, or
message bodies for this feature.

## Security

- Treat `NEXT_PUBLIC_WHATSAPP_NUMBER` as a public contact value. Never place
  tokens, API keys, or private WhatsApp Business credentials in
  `NEXT_PUBLIC_*`.
- Accept only digits in the configured number. Strip or reject `+`, spaces,
  dashes, and letters before building the URL so the link cannot become an
  open redirect or arbitrary URL.
- Open the destination only on the `wa.me` host. Do not accept a full URL
  from the environment.
- The frontend does not send the number to the NestJS API and does not log
  it beyond normal public HTML.
- The widget is a public marketing control. It is not an authentication or
  authorization surface.

## Testing

The approved delivery must include:

- Frontend component tests for presence of the robot and exact speech copy,
  and for the absence of a WhatsApp brand mark.
- Tests that the rendered link uses `https://wa.me/` plus the configured
  digits.
- Tests that an empty environment value hides the widget.
- Tests for accessible name and keyboard activation.
- The applicable repository validation commands:
  `npm run typecheck`, `npm run lint`, `npm run test`, `npm run sdd:validate`,
  `npm run build`, and `npm run format:check`.

Planned acceptance-test mapping:

- AC-001: `frontend/components/layout/whatsapp-contact.spec.tsx` and
  `frontend/app/page.spec.tsx`.
- AC-002: `frontend/lib/whatsapp.spec.ts` and the rendered-link tests in
  `frontend/components/layout/whatsapp-contact.spec.tsx`.
- AC-003: accessible-name, keyboard focus, and reduced-motion class tests in
  `frontend/components/layout/whatsapp-contact.spec.tsx`.
- AC-004: empty-value tests in `frontend/components/layout/whatsapp-contact.spec.tsx`
  and `frontend/app/page.spec.tsx`.
- AC-005: no-fetch and no-storage test in
  `frontend/components/layout/whatsapp-contact.spec.tsx`, plus
  `frontend/app/portal/page.spec.tsx` asserting the widget is absent on `/portal`.

## Delivery

Frontend-only delivery on `/`: `WhatsAppContact`, digit-only `wa.me` URL
construction, `infrastructure/.env.frontend.example`, and promotions to
`docs/product.md` and `docs/design.md`. No backend, database, or SMTP change
was required.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-17-whatsapp-contact-widget`
- Request: add a WhatsApp icon with a robot speaking that it is ready to
  help; keep the receiving number in an environment variable chosen in this
  specification.
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/conventions.md`, and VETOR-002 / VETOR-003.
- Decisions recorded for validation:
  - Widget lives on `/` only.
  - Copy is `Estou pronto para lhe atender.`
  - Variable name is `NEXT_PUBLIC_WHATSAPP_NUMBER`.
  - Click-to-chat uses `https://wa.me/{digits}` with no prefilled message.
  - Empty configuration hides the widget.
  - Lower-right floating placement.
  - Human follow-up: remove the WhatsApp brand mark SVG; keep the robot and
    speech as the visible control.

## Implementation evidence

- Changed: `frontend/components/layout/whatsapp-contact.tsx`,
  `frontend/lib/whatsapp.ts`, `frontend/app/page.tsx`,
  `frontend/app/globals.css`, `docs/product.md`, `docs/design.md`,
  `infrastructure/.env.frontend.example`, `infrastructure/docker-compose.yml`,
  `infrastructure/dockerfile.frontend.yml`, and
  `.github/workflows/images.yml`.
- Tests: `frontend/components/layout/whatsapp-contact.spec.tsx`,
  `frontend/lib/whatsapp.spec.ts`, `frontend/app/page.spec.tsx`, and
  `frontend/app/portal/page.spec.tsx`.
- Commands: `npm run typecheck` passed; `npm run lint` passed; `npm run test`
  passed (backend 11, frontend 36, SDD 10); `npm run sdd:validate` passed;
  `npm run build` passed; `npm run format:check` passed.
- Limitations: the widget is hidden until `NEXT_PUBLIC_WHATSAPP_NUMBER` is set
  in the running frontend environment. Production images need the matching
  Docker build argument. Independent validation of the acceptance criteria is
  still required.

## Validation evidence

- AC-001: delivery recorded; awaiting independent validation.
- AC-002: delivery recorded; awaiting independent validation.
- AC-003: delivery recorded; awaiting independent validation.
- AC-004: delivery recorded; awaiting independent validation.
- AC-005: delivery recorded; awaiting independent validation.
