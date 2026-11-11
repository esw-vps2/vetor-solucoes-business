---
id: VETOR-020
title: Cancel the portal MFA code
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-01-mfa-cancel
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Cancel the portal MFA code

## Context

After a correct portal password, `PortalCredentialFlow` stays on the MFA
step: heading `Portal Vector`, the multi-factor sentence, the `Código`
field, the countdown, and `Entrar`. The selected node is that panel. There
is no way to leave the step. The emailed code stays in
`mfa_email_challenges` until it is used, replaced, or expires.

On 2026-10-01 the requester asked for a cancel option on that step. When
they cancel, the code must be deleted.

VETOR-017 remains the authority for MFA verify, resend, the countdown, and
account block. This specification adds only cancel.

## Desired outcome

On the MFA step the visitor can cancel. Cancel deletes that code. The same
panel returns to the e-mail and password form. The deleted code cannot
sign anyone in.

## In scope

- A `Cancelar` control on the MFA step, both while time remains and at
  `00:00`.
- Choosing `Cancelar` deletes the current challenge and returns to the
  e-mail and password form on the same panel.
- A deleted code cannot be verified and cannot be resent.
- Cancel does not start a session and does not block the account.

## Out of scope

- A cancel control on the password form, password recovery, or the blocked
  account message.
- Changing the MFA sentence, the countdown, resend, the digit count, or
  the three-wrong-code block.
- Sending another e-mail when the visitor cancels.
- Leaving the portal for the leadpage.

## Acceptance criteria

- AC-001: The MFA step shows `Cancelar` beside the primary action while
  the countdown is running and when it shows `00:00`. The password form
  does not show `Cancelar`.
- AC-002: Choosing `Cancelar` deletes that challenge and shows the e-mail
  and password fields again. The `Código` field is gone. No session
  cookies are set.
- AC-003: After that delete, verify and resend for the same `challengeId`
  do not accept the code and do not send e-mail.
- AC-004: A second click while cancel is in progress does not send another
  request.
- AC-005: When cancel fails, the MFA step stays, the challenge remains,
  and the page shows `Não foi possível concluir a operação.` A rate limit
  shows `Aguarde alguns instantes antes de tentar novamente.`
- AC-006: Cancel does not set `users.status` to `blocked` and does not set
  session cookies.

## User experience

`Cancelar` sits in the same row as `Entrar` or `Pedir novo código`. The
primary action keeps the accent pill. `Cancelar` is a ghost control:
transparent background, `text-white/80`, same height and focus ring as the
pill, no arrow icon.

While the request is in progress, both controls in that row are disabled
and `Cancelar` reads `Cancelando...`.

A successful cancel clears the code field and returns to mode `login` with
the e-mail kept and the password cleared. No success toast. A failed
cancel stays on the MFA step with the existing alert styles.

## API and integrations

New public route `POST /api/v1/auth/mfa/cancel`.

| Field | Value |
| --- | --- |
| Authentication | Public. No session exists yet. |
| Body | `challengeId` UUID |
| Success | `204` and an empty body. The matching `mfa_email_challenges` row is deleted. |
| Unknown, used, or already deleted `challengeId` | `204`. No row change. |
| Invalid DTO | `400` |
| Rate limit | `429` |

The route uses the same login rate limit as verify and resend: per IP and
`challengeId`, with `AUTH_LOGIN_RATE_LIMIT_MAX` and
`AUTH_LOGIN_RATE_LIMIT_WINDOW`. It does not send e-mail, does not write
cookies, and does not change `users.status`.

Delivery updates `docs/api.md`, `openapi.yaml`, and Swagger.

## Data impact

No migration. Cancel deletes one `mfa_email_challenges` row by id. Other
challenges for that user stay.

## Security

Knowing `challengeId` is enough to delete that challenge, the same trust
boundary as verify and resend. The response does not say whether the row
existed. The raw code is not logged and is not returned. Deleting the row
makes the emailed code unusable. Cancel does not weaken the three-wrong-code
block or create a session.

## Testing

- AC-001: `frontend/components/forms/portal-login-page.spec.tsx`
- AC-002: `frontend/components/forms/portal-login-page.spec.tsx` and
  `backend/src/modules/portal/auth.service.spec.ts`
- AC-003: `backend/src/modules/portal/auth.service.spec.ts`
- AC-004: `frontend/components/forms/portal-login-page.spec.tsx`
- AC-005: `frontend/components/forms/portal-login-page.spec.tsx` and
  `backend/src/modules/portal/auth.service.spec.ts`
- AC-006: `backend/src/modules/portal/auth.service.spec.ts`

## Delivery

Do not implement while `status` is `in_review`.

When approved: add `Cancelar` on the MFA step, add
`POST /api/v1/auth/mfa/cancel`, delete the challenge row, and return to
the password form only after that delete succeeds. Update `docs/api.md`,
`openapi.yaml`, and Swagger.

Do not change verify, resend, the countdown, or account block.

## Traceability

- Source: human prompt on 2026-10-01, on the MFA panel that shows the
  multi-factor sentence, `Código`, the countdown, and `Entrar`.
- `source_kind: human_prompt`
- `source_reference: chat-2026-10-01-mfa-cancel`
- Related approved specification:
  `docs/specs/vetor-017-portal-login-page.md`.
- Current behavior: `frontend/components/forms/portal-credential-flow.tsx`,
  `backend/src/modules/portal/auth.controller.ts`.

Recorded decisions:

1. Cancel is on the MFA step only.
2. The control label is `Cancelar`.
3. After a successful cancel the same panel shows the e-mail and password
   form again.
4. The code is removed by deleting that challenge row.

## Implementation evidence

- Changed: `POST /api/v1/auth/mfa/cancel` deletes that `mfa_email_challenges` row and returns `204`, including when the id is unknown. `Cancelar` is on the MFA step while time remains and at `00:00`. A successful cancel returns the same panel to the e-mail and password form, keeps the e-mail, clears the password, and does not set session cookies. Verify, resend, the countdown, and the three-wrong-code block are unchanged. Updated `docs/api.md`, `openapi.yaml`, Swagger, `docs/design.md`, and `docs/database.md`.
- Tests: `npm run test --workspace backend` passed (35 files, 199 tests). `npm run test --workspace frontend` passed (67 files, 207 tests). `npm run test:e2e --workspace backend` passed (9 files, 73 tests). `npm run typecheck --workspace frontend` passed. `npm run lint --workspace backend` passed. `npm run lint --workspace frontend` passed with existing image warnings outside this change. `npm run typecheck --workspace backend` failed on two existing errors: `rate-limit.guard.spec.ts` and `test/session-tenant.e2e-spec.ts` cookie `join`. Neither error is in the cancel code. Live API: an unknown id returns `204` with an empty body; a real row is deleted, a second challenge for that user stays, `users.status` stays `active`, and verify and resend for the deleted id return `401` without a new row. Browser on `http://localhost:3000/portal`: the password form has no `Cancelar`; after a correct password the MFA step shows `Código`, `Entrar`, the timer, and `Cancelar`; during the request the label is `Cancelando...` and `Entrar` is disabled; after success the e-mail remains, the code field is gone, and the panel is the password form again. No challenge created in the previous five minutes remained.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
