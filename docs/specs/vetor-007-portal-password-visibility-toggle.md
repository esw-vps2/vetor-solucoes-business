---
id: VETOR-007
title: Toggle password visibility on frontend password fields
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-18-portal-password-visibility-toggle
created_at: 2026-09-18
updated_at: 2026-09-18
---

# Toggle password visibility on frontend password fields

## Context

The requester selected the portal access modal password field and asked for a
show-or-hide control. Follow-up answers extend that control to other password
fields as well. Delivery is frontend only.

Existing password fields in the frontend at the time of this specification
are in the portal access modal: login password, new password, and repeat
password.

## Desired outcome

Every frontend password field has an eye-icon toggle. The field starts
hidden. Clicking the icon opens the eye and exposes the password. Closing it
shows the password with asterisks. The control has no text, only the icon.
Click is the required interaction.

## In scope

- Add a show-or-hide password toggle on every frontend password field,
  including the portal access modal login password, new password, and repeat
  password fields, and any other frontend password field.
- Use an eye icon with no visible text.
- When the user clicks, the eye opens and the password is visible.
- When the user closes it, the password is shown with asterisks.
- Default state when the field is shown: password hidden.
- Frontend only.

## Out of scope

- Backend, API, HTTP contract, Swagger, `openapi.yaml`, and `docs/api.md`
- Persistent model and `docs/database.md`
- Keyboard-only extra behavior beyond click
- Visible text, labels, or captions on the toggle

## Acceptance criteria

- AC-001: Every frontend password field has a toggle that uses an eye icon
  and has no visible text.
- AC-002: Clicking the toggle opens the eye and exposes the password.
- AC-003: Closing the toggle shows the password with asterisks.
- AC-004: When a password field is shown, the password starts hidden.
- AC-005: Delivery changes only the frontend. Backend, API, and persistence
  do not change.

## User experience

The control is icon-only: an eye, with no visible text. Open eye: password
visible. Closed: password shown as asterisks. Initial state is hidden. The
required interaction is click. Exact graphic files beyond that eye behavior
were not specified.

## API and integrations

No HTTP contract change. Approved delivery must not update Swagger,
`openapi.yaml`, or `docs/api.md` for this feature.

## Data impact

No persistent-model change.

## Security

No additional security rule was supplied. Existing project security rules
apply. This feature is a frontend visibility toggle for values the user
already typed. It does not change authentication, authorization, or password
storage.

## Testing

Frontend workspace tests after approved delivery:

- AC-001: component tests that each frontend password field has an icon-only
  eye toggle
- AC-002: component tests that a click exposes the password and opens the eye
- AC-003: component tests that closing the toggle hides the password with
  asterisks
- AC-004: component tests that the default state is hidden
- AC-005: delivery stays in the frontend workspace; run
  `npm run typecheck --workspace frontend`,
  `npm run lint --workspace frontend`,
  `npm run test --workspace frontend`, and
  `npm run build --workspace frontend`

## Delivery

Frontend workspace only. Implementation starts only after a named human sets
`status: approved`. Do not change backend, API, or database files.

## Traceability

- Request: `source_kind: human_prompt`,
  `source_reference: chat-2026-09-18-portal-password-visibility-toggle`
- Follow-up: apply to other password fields; default hidden; icon only, no
  text; frontend only; click only

## Implementation evidence

- Changed: `frontend/components/forms/password-input.tsx`,
  `frontend/components/forms/password-input.spec.tsx`,
  `frontend/components/forms/portal-access-modal.tsx`,
  `frontend/components/forms/portal-access-modal.spec.tsx`. No backend, API,
  or database files.
- Tests: `frontend/components/forms/password-input.spec.tsx` and
  `frontend/components/forms/portal-access-modal.spec.tsx`. Commands:
  `npm run typecheck --workspace frontend` passed; `npm run lint --workspace frontend`
  passed; `npm run test --workspace frontend` passed (45 tests);
  `npm run build --workspace frontend` passed; `npm run sdd:validate` passed.

## Validation evidence

- AC-001: Not recorded. Human validation has not started.
- AC-002: Not recorded. Human validation has not started.
- AC-003: Not recorded. Human validation has not started.
- AC-004: Not recorded. Human validation has not started.
- AC-005: Not recorded. Human validation has not started.
