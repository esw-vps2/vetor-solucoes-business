---
id: VETOR-003
title: Leadpage contact capture and Vector Portal entry
status: draft
source_kind: human_prompt
source_reference: chat-2026-09-17-leadpage-contact-and-vector-portal
created_at: 2026-09-17
updated_at: 2026-09-17
---

# Leadpage contact capture and Vector Portal entry

## Context

The public leadpage currently displays the approved Medical Bills project
image and uses the header `Fale conosco` action as an in-page contact link.
The request changes that contact entry point, adds a separate `Portal Vector`
entry point, replaces the Medical Bills image with the supplied attachment, and
introduces email and portal-access behavior.

The DOM paths and pixel coordinates in the intake prompt identify the current
elements to change. They are intake evidence, not durable implementation
contracts.

The request also requires configurable values to be supplied through
environment variables so that a future administration panel can replace that
configuration. The administration panel itself is not part of this feature.

## Desired outcome

Visitors can:

- See the supplied image in the Medical Bills project card.
- Open a contact modal from the header, provide the requested project details,
  and send them to a configured recipient.
- See a reusable VETOR email layout with the VETOR logo in the emails sent by
  this product.
- Open the Vector Portal entry modal, provide access credentials, recover a
  password, and reach the Vector Portal after successful authentication with a
  welcome message.

Portal access is authenticated and authorized by the backend using
Attribute-Based Access Control (ABAC), considering user, resource, action, and
context attributes. The portal is multitenant. Each user's email is associated
with a tenant identifier, while a user with the `Administrador` profile can
access all tenants. The proposed internal portal route is `/portal`. The
portal page is the authenticated landing page and the destination after a
successful login. The login flow authenticates with email and password. The
issued JWT and session payload include the user's `tenantId`, because
uniqueness remains defined by `tenant_id + email`.

Access uses a 15-minute access token and a seven-day refresh token. Refresh
tokens are rotated automatically while the user is active, using secure
HttpOnly cookies. Password recovery uses a single-use token that expires after
15 minutes. These values are configured through environment variables.

## In scope

- Replace the current Medical Bills project image with the image supplied in
  the human prompt.
- Change the header `Fale conosco` action from an in-page link to a modal
  containing these fields:
  - `Nome do Cliente`
  - `Email do Cliente`
  - `Descrição do Projeto`
- Submit the contact form through a backend-controlled operation that sends the
  submitted values to a recipient configured by an environment variable.
- Create a reusable email layout containing the VETOR logo and use it as the
  default layout for emails sent by the product.
- Add a `Portal Vector` button next to the existing header contact action.
- Open a portal-access modal when `Portal Vector` is selected.
- Provide credential inputs and a password-recovery option in the portal-access
  flow.
- Redirect an authenticated user to the Vector Portal and show a welcome
  message after successful authentication.
- Create the internal `/portal` page as the Vector Portal access gateway and
  authenticated landing page.
- Resolve the tenant identifier from the authenticated user and return it in
  the JWT and session payload.
- Refresh an active session automatically without requiring the user to
  authenticate again while the refresh session remains valid.
- Provide a password-recovery modal flow that accepts an email, sends a
  single-use token, validates the token in the modal, accepts and confirms a
  new password, and sends a password-change confirmation email.
- Persist the portal identity and tenant association data in PostgreSQL. The
  recommended model is recorded in the Data impact section.
- Enforce portal authorization in the backend with ABAC based on the user,
  resource, action, and context.
- Keep configurable feature values out of application source code and expose
  them through the environment configuration recorded in this specification.
- Use Portuguese (Brazil) for the user interface and product emails.
- Add or update the affected API, data, design, and security contracts during
  an approved delivery when the final decisions require those changes.

## Out of scope

- The internal features, screens, and business operations of the Vector Portal
  beyond the access flow described here.
- An administration panel for changing environment-backed configuration.
- Internal Vector Portal business features beyond authentication, tenant
  access, session handling, and password recovery.
- Persisting contact inquiries in a database, CRM, analytics system, or
  messaging platform. The existing product contract does not approve stored
  lead capture.
- Replacing other project images or changing project copy and claims.
- Changing contact actions other than the header `Fale conosco` action unless
  a later decision adds them.
- New public routes or portal capabilities not defined in this specification.

## Acceptance criteria

- AC-001: The Medical Bills project card displays the supplied attachment in
  place of the current project image and keeps the project image alternative
  text aligned with the existing project label.
- AC-002: Selecting the header `Fale conosco` action opens a modal instead of
  navigating directly to the contact anchor, and the modal exposes the three
  requested fields with the exact labels recorded in this specification.
- AC-003: A submitted contact form is validated at the backend and its values
  are sent to the recipient configured by the `FORM_CONTACT` environment
  variable. The first delivery supports one recipient. The recipient is not
  hardcoded and is not exposed through a `NEXT_PUBLIC_*` variable.
- AC-004: Contact email output uses the reusable VETOR email layout and
  includes the existing VETOR website logo, a footer, and Portuguese content.
  All transactional emails use the same layout, including contact
  notifications, password recovery, and password-change confirmation.
- AC-005: The header displays a `Portal Vector` button adjacent to the existing
  header contact action.
- AC-006: Selecting `Portal Vector` opens a modal with email, password, and a
  password-recovery option. The visitor does not enter a tenant identifier.
- AC-007: After successful portal authentication, the user is redirected to
  `/portal` and receives the Portuguese message `Bem-vindo ao Portal Vector.`
- AC-008: Portal authorization is enforced by the backend using ABAC decisions
  that can evaluate user, resource, action, and context attributes. The
  tenant identifier is part of the tenant context, and the `Administrador`
  profile can access all tenants. Non-administrator users are limited to their
  tenant.
- AC-009: Every value classified as configurable for this feature is supplied
  through the environment configuration recorded in this specification, and
  no administration panel is introduced in this feature.
- AC-010: The contact and portal modals preserve the existing leadpage
  responsive, keyboard, focus, semantic, and reduced-motion requirements.
- AC-011: An active authenticated user receives an automatic access-token
  refresh while the refresh session remains valid and does not need to
  authenticate again during normal use.
- AC-012: Password recovery accepts the user's email, sends a token, accepts
  the token in the modal for up to 15 minutes, then exposes password and
  password-confirmation fields. A successful change invalidates the token and
  sends a Portuguese confirmation email.
- AC-013: Portal users are stored in PostgreSQL with a unique
  `tenant_id + email` constraint. No automated purge is configured for portal
  records or email and audit records.

## User experience

### Contact flow

1. The visitor selects `Fale conosco` in the header.
2. A contact modal opens with the fields `Nome do Cliente`, `Email do
Cliente`, and `Descrição do Projeto`.
3. The visitor submits the form.
4. The backend sends the submitted information to the configured recipient.
5. The interface shows `Mensagem enviada com sucesso.` after delivery. It
   shows `Não foi possível enviar sua mensagem.` for a delivery failure and
   validates required fields and email format before submission.

### Portal flow

1. The visitor selects `Portal Vector` beside the existing header contact
   action.
2. The portal page opens the access modal with `E-mail`, `Senha`, and the
   `Esqueci minha senha` action.
3. The visitor authenticates. The backend evaluates the user's tenant
   membership and profile before granting access, and the JWT includes
   `tenantId`.
4. On successful authentication, the user is redirected to `/portal` and
   receives `Bem-vindo ao Portal Vector.`
5. A user with the `Administrador` profile can access all tenants. Other users
   can access only their associated tenant.
6. When the access token is near expiration, the client refreshes the session
   automatically through the backend.

### Password-recovery flow

1. The visitor selects `Esqueci minha senha` and enters an email address.
2. The backend sends a generic response and, when appropriate, sends a
   single-use token to the email address.
3. The visitor enters the token in the modal. The token expires after the
   configured 15-minute period.
4. When the token is valid, the modal exposes `Nova senha` and `Repetir senha`.
5. After a successful reset, the token is invalidated and the backend sends
   `Sua senha foi alterada com sucesso.` by email.

Both modals must follow the existing leadpage accessibility and responsive
contracts. The modals close with Escape, close controls, or an overlay
selection, return focus to the element that opened them, and use a full-screen
mobile presentation when the viewport cannot accommodate the desktop dialog.
The portal action appears in the mobile navigation when the desktop header
actions are hidden.

## API and integrations

The feature uses the backend API prefix `/api/v1`.

- Contact submission uses `POST /api/v1/contact` with
  `customerName`, `customerEmail`, and `projectDescription`. A successful
  delivery returns `204 No Content`. Invalid input returns `400`, rate limits
  return `429`, and delivery failures return a generic `503` response without
  exposing SMTP details.
- Contact email delivery uses the existing SMTP configuration:
  `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, and
  `MAIL_SECURE`. The recipient is the single address in `FORM_CONTACT`.
  `MAIL_FROM` is the sender, and the validated customer email is the
  `reply-to`. The subject is `Novo contato pelo site VETOR`.
- The shared email template uses
  `frontend/public/brand/logo_vetor.png`, a VETOR footer, Portuguese (Brazil)
  content, responsive table-based HTML, and a text-only fallback. It is used
  for contact notifications, password-recovery tokens, password-change
  confirmations, and future transactional emails.
- Portal authentication uses:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/session`
  - `POST /api/v1/auth/password-recovery/request`
  - `POST /api/v1/auth/password-recovery/verify`
  - `POST /api/v1/auth/password-recovery/reset`
- The login request includes the email and password. Successful
  authentication issues a 15-minute access token and a seven-day refresh
  token. The access token, refresh token, and session payload include the
  user's `tenantId`. Refresh tokens are rotated and stored only in secure, HttpOnly,
  SameSite cookies. Access tokens are never stored in `localStorage` or
  `sessionStorage`.
- Password-recovery tokens are cryptographically random, stored hashed, sent
  by email, accepted in the modal body rather than a URL, valid for 15
  minutes, and invalidated after one successful reset. The expiry is
  configured by `PASSWORD_RESET_TOKEN_EXPIRES_IN=15m`.
- ABAC evaluation runs in the backend policy service. It evaluates subject
  attributes (`user_id`, `profile`, and tenant membership), resource
  attributes (`resource_type`, `resource_id`, and `tenant_id`), action
  attributes (`read`, `write`, and `delete`), and context attributes
  (`tenant_id` and authenticated session). The default decision is deny.
  The `Administrador` profile receives all-tenant scope; other profiles
  receive only their tenant scope. Initial policies are versioned backend
  security rules rather than environment variables or an administration
  panel.

Private configuration and secrets must remain backend-only. The approved
delivery must update `docs/api.md` when it introduces a published HTTP
contract and must not add undocumented external integrations.

## Data impact

- Contact form values are transmitted to the configured email recipient.
- No persisted lead record is approved; the existing product contract
  continues to prohibit stored lead capture unless a later approved
  specification changes it.
- Portal data uses the following PostgreSQL model:
  - `tenants`: tenant identity and lifecycle state.
  - `users`: `tenant_id`, `email`, `password_hash`, `profile`, account state,
    and timestamps, with a unique constraint on `tenant_id + email`.
  - `refresh_sessions`: rotated refresh-token hashes, user reference,
    expiration, revocation, and last-use timestamps.
  - `password_reset_tokens`: hashed single-use tokens, user reference,
    expiration, used timestamp, and creation timestamp.
  - `security_audit_events`: authentication, password-recovery, session, and
    authorization events without passwords or raw tokens.
- A user's home tenant is stored in `users.tenant_id`. The ABAC policy grants
  the `Administrador` profile access to all tenants without duplicating the
  user's account for every tenant.
- No automated purge is configured for tenants, users, sessions, recovery
  records, email delivery logs, or security audit events. Expired or used
  recovery tokens remain unusable even if their hashed records are retained.
- Sensitive credentials, recovery tokens, and unnecessary personal data must
  not be returned to the browser or written to application logs.

## Security

- Authentication and authorization must be enforced by the backend. Frontend
  modal state and redirects are user-experience behavior only.
- Portal authorization must use ABAC concepts for the user, resource, action,
  and context. The tenant identifier is part of the context, and the
  `Administrador` profile can access all tenants. The policy uses the
  attribute definitions and backend policy service recorded in this
  specification, with deny as the default and no administration panel in this
  delivery.
- Contact, authentication, and password-recovery inputs must be validated at
  the backend boundary with DTOs and `class-validator`.
- Public contact, authentication, and password-recovery operations are
  rate-limited with these initial limits:
  - Contact submission: five requests per IP in 15 minutes.
  - Login: five failed attempts per IP and tenant/email pair in 15 minutes.
  - Recovery request: three requests per IP and email in 15 minutes.
  - Recovery-token verification: five attempts per IP and recovery flow in
    15 minutes.
- Rate-limit responses are generic, do not reveal whether an account exists,
  and are configured through environment variables.
- Secrets, credentials, recovery tokens, and private email configuration must
  not be exposed in frontend bundles, `NEXT_PUBLIC_*` variables, URLs, logs,
  or unnecessary API responses.
- Password credentials persisted by the backend must be hashed with bcrypt at
  a cost of at least 10.
- The post-authentication destination must be controlled by the approved
  portal configuration and must not accept an arbitrary user-controlled
  redirect.
- The access token expires after 15 minutes and the refresh token expires
  after seven days. Refresh tokens rotate on use and are revoked after
  password reset or logout.
- Passwords require at least 12 characters and are hashed with bcrypt at a
  cost of at least 10. Passwords, raw reset tokens, and refresh tokens are
  never logged.
- Recovery and login responses use generic messages to prevent account
  enumeration. Password-reset tokens are hashed, single-use, and expire after
  15 minutes.
- Authentication, recovery, session, authorization-denied, and configuration
  changes produce security audit events without sensitive values.
- Production responses use a restrictive Content Security Policy,
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `frame-ancestors 'none'`. No security control is weakened for the modal
  flow.

## Testing

The approved delivery must include:

- Frontend component tests for image replacement, modal opening, exact form
  fields, submission feedback, portal entry, and recovery entry.
- Backend unit and HTTP tests for input validation, recipient configuration,
  email-template selection, authentication, recovery, and ABAC decisions.
- Security tests for unauthenticated access, unauthorized attributes,
  invalid input, rate limiting, expired recovery state, protected redirects,
  and sensitive-data exposure.
- Email rendering or integration tests for the reusable VETOR layout.
- The applicable repository validation commands:
  `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`,
  `spec-driven-development`, `npm run build`, and `npm run format:check`.

Planned acceptance-test mapping:

- AC-001: frontend component or visual regression test.
- AC-002: frontend interaction test.
- AC-003: backend validation and email-delivery integration test.
- AC-004: email-template rendering test.
- AC-005: frontend component test.
- AC-006: frontend interaction and backend authentication-flow tests.
- AC-007: backend authentication test plus frontend redirect and welcome test.
- AC-008: backend ABAC unit and HTTP authorization tests.
- AC-009: configuration and secret-exposure tests.
- AC-010: frontend accessibility and responsive behavior tests.
- AC-011: backend refresh-token and frontend automatic-refresh tests.
- AC-012: backend password-recovery integration test and frontend modal-flow
  test.
- AC-013: database constraint, persistence, retention, and audit-event tests.

## Delivery

This specification remains a draft for human review. Implementation is not
authorized until a named human approves the scope. After approval, delivery
is expected to span the frontend and backend workspaces, SMTP configuration,
PostgreSQL persistence, and the affected API, data, product, and design
contracts. The administration panel and portal business features remain
outside this delivery.

Operational provisioning of the first tenant and portal user is intentionally
not exposed as a public route. It must be performed through the deployment's
approved database or administration process before a user can authenticate.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-17-leadpage-contact-and-vector-portal`
- Request: replace the Medical Bills project image with the supplied
  attachment; add a modal contact form that emails a configured recipient;
  create a VETOR email layout; add Portal Vector login and password recovery;
  redirect successful users with a welcome message; use ABAC; and keep
  configurable values in environment variables.
- Follow-up decisions: use `FORM_CONTACT` for the contact recipient; use the
  existing website logo, a footer, and Portuguese (Brazil) for emails; do not
  persist contact inquiries; use email as the portal identifier; associate
  users with tenants; grant the `Administrador` profile access to all tenants;
  use the internal `/portal` route; persist portal identity data in
  PostgreSQL; use 15-minute access tokens, seven-day refresh tokens, and
  15-minute password-recovery tokens; and refresh active sessions
  automatically.
- Remaining choices were filled with market-standard proposals in the
  Decisions recorded for validation section.
- Current target evidence: the prompt supplied DOM paths and pixel positions
  for the Medical Bills image and the header contact action.
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, and `docs/conventions.md`.
- Decisions recorded in this draft require human review before approval.

## Decisions recorded for validation

- The contact recipient environment variable is `FORM_CONTACT` and accepts one
  email address in the first delivery.
- Contact email uses SMTP, `MAIL_FROM` as sender, the validated customer email
  as `reply-to`, and the subject `Novo contato pelo site VETOR`.
- Password-recovery email uses the subject `Recuperação de senha do Portal
Vector`; password-change confirmation uses `Senha alterada com sucesso -
Portal Vector`.
- The email template uses the existing VETOR website logo, includes a footer,
  and uses Portuguese (Brazil). The approved logo asset is
  `frontend/public/brand/logo_vetor.png`. The footer contains
  `VETOR — Business & Technology` and `contato@vetor.tech`. The template uses
  responsive table-based HTML and a text-only fallback.
- The default template applies to contact notifications, password-recovery
  emails, password-change confirmations, and future transactional emails.
- The contact form sends email only and does not persist inquiry data.
- The portal uses the internal `/portal` page. Its access modal includes
  email and password. The backend looks up the unique `tenant_id + email`
  account from the authenticated user and returns `tenantId` in the JWT.
- Portal identity, email-to-tenant associations, and password credentials are
  persisted in PostgreSQL using the model recorded in Data impact.
- Password recovery uses a 15-minute single-use token, generic
  anti-enumeration responses, token entry in the modal, password confirmation,
  session revocation after reset, and a confirmation email.
- Access tokens expire in 15 minutes. Refresh tokens expire in seven days,
  rotate on use, and refresh active sessions automatically through secure
  HttpOnly cookies.
- ABAC uses subject, resource, action, and context attributes. The default is
  deny; `Administrador` receives all-tenant scope; other profiles receive
  their tenant scope. Initial policies are versioned backend security rules,
  not environment values or an administration panel.
- Proposed environment configuration for validation:
  - `FORM_CONTACT`: contact email recipient.
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, and
    `MAIL_SECURE`: email transport and sender configuration.
  - `PORTAL_ROUTE=/portal`: internal Vector Portal route.
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`,
    `JWT_ACCESS_EXPIRES_SECONDS`, and `JWT_REFRESH_EXPIRES_IN`: authentication
    and session configuration, with `15m`, `900`, and `7d` as the chosen
    access values.
  - `PASSWORD_RESET_TOKEN_EXPIRES_IN=15m`: password-recovery token expiry.
  - `CONTACT_RATE_LIMIT_MAX=5` and `CONTACT_RATE_LIMIT_WINDOW=15m`.
  - `AUTH_LOGIN_RATE_LIMIT_MAX=5` and `AUTH_LOGIN_RATE_LIMIT_WINDOW=15m`.
  - `PASSWORD_RESET_RATE_LIMIT_MAX=3` and
    `PASSWORD_RESET_RATE_LIMIT_WINDOW=15m`.
  - `PASSWORD_RESET_VERIFY_RATE_LIMIT_MAX=5` and
    `PASSWORD_RESET_VERIFY_RATE_LIMIT_WINDOW=15m`.
- The welcome message is `Bem-vindo ao Portal Vector.`. Modal labels are
  `E-mail`, `Senha`, `Nova senha`, and `Repetir senha`. Modals close with
  Escape, an explicit close control, or an overlay selection; focus returns to
  the trigger; and mobile uses a full-screen presentation.

## Implementation evidence

- Changed: no feature implementation or approval was performed by this
  specification audit. Existing worktree implementation changes are not
  treated as draft approval or acceptance evidence.
- Tests: `spec-driven-development`, `npm run format:check`, and `npm run lint`
  are the applicable audit gates; feature acceptance remains pending human
  approval.

## Validation evidence

- AC-001: not validated; implementation is blocked pending human approval.
- AC-002: not validated; implementation is blocked pending human approval.
- AC-003: not validated; implementation is blocked pending human approval.
- AC-004: not validated; implementation is blocked pending human approval.
- AC-005: not validated; implementation is blocked pending human approval.
- AC-006: not validated; implementation is blocked pending human approval.
- AC-007: not validated; implementation is blocked pending human approval.
- AC-008: not validated; implementation is blocked pending human approval.
- AC-009: not validated; implementation is blocked pending human approval.
- AC-010: not validated; implementation is blocked pending human approval.
- AC-011: not validated; implementation is blocked pending human approval.
- AC-012: not validated; implementation is blocked pending human approval.
- AC-013: not validated; implementation is blocked pending human approval.
