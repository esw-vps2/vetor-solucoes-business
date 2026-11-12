---
id: VETOR-034
title: Ticket priority and attachments
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-27-ticket-priority-attachments
created_at: 2026-10-27
updated_at: 2026-10-27
---

# Ticket priority and attachments

## Context

The named human asked to add attachments and priority on the existing
`Abrir chamado` dialog, and to paste images on the ticket screen. VETOR-031
already ships tenant support tickets. This specification records the added
priority and attachment behavior. VETOR-031 no longer owns those two items.

The human confirmed the product behavior in the request: reuse the
attachment control already used by other modals, offer `Baixa` (default),
`Média`, and `Alta`, and accept pasted images on the ticket screen.

## Desired outcome

A client opening a ticket can choose a priority and attach files, including
an image pasted into the create form. Anyone who can view the ticket can
see those attachments, upload more files, and paste an image on the ticket
screen so it becomes an attachment.

## In scope

- Persist ticket priority as `low`, `medium`, or `high`. Omitted priority
  defaults to `low`.
- Show `Prioridade` on `Abrir chamado` with `Baixa`, `Média`, and `Alta`.
  `Baixa` is the default.
- Show the same `Anexar` file input used by `Novo card` on `Abrir chamado`.
- Accept the same file types, 5 MB limit, and 10-file limit already used by
  card attachments.
- After the ticket is created, upload each selected file to that ticket.
- If the ticket is stored and a later upload fails, close the dialog, show
  the existing failure feedback, and refresh the list.
- Show the priority chip on the ticket list and on the ticket screen.
- List attachments on the ticket screen and offer the same `Enviar arquivo`
  dropzone used on a card, in the light ticket surface.
- Pasting an image into the create form adds it to the pending files.
  Pasting an image on the ticket screen uploads it. Text paste is unchanged.
- Store attachment bytes with the existing tenant file storage. API
  responses expose an attachment URL and omit the filesystem path.

## Out of scope

- Deleting or replacing an attachment.
- Editing or deleting a ticket or comment.
- Sending mail when an attachment is uploaded.
- SLA, assignment, WhatsApp, or a public ticket route.
- A new file-type allowlist or a larger size limit.

## Acceptance criteria

- AC-001: Creating a ticket without priority stores `low`. `medium` and
  `high` are accepted. Any other priority is `400`.
- AC-002: `Abrir chamado` defaults the priority control to `Baixa` and sends
  the selected priority with the ticket.
- AC-003: A caller who can view the ticket can upload an allowlisted file of
  at most 5 MB, up to 10 files. The response URL is
  `/api/v1/tickets/{id}/attachments/{attachmentId}` and does not include a
  filesystem path.
- AC-004: A caller outside the ticket scope receives `403` for upload and
  download. A missing ticket or attachment is `404`. A disallowed type or
  an 11th file is `400`.
- AC-005: Pasting an image on `Abrir chamado` lists that file and uploads it
  after save. Pasting an image on the ticket screen uploads it. Non-image
  clipboard content is ignored.
- AC-006: Attachment upload does not send a ticket notice.

## User experience

`Abrir chamado` stays the white dialog from `docs/design.md`. `Prioridade`
uses the card priority select. `Anexar` uses the card file input, the same
accept list, and the helper `Cada arquivo até 5 MB.`. The ticket screen
shows the priority chip from the board and lists attachments above an
`Enviar arquivo` dropzone. UI copy stays Portuguese (Brazil).

## API and integrations

- `POST /api/v1/tickets` accepts optional `priority`.
- `POST /api/v1/tickets/{id}/attachments` accepts one multipart `file`.
- `GET /api/v1/tickets/{id}/attachments/{attachmentId}` returns the bytes.
- Ticket summaries include `priority`. Ticket details include `attachments`.
- Authentication remains the access cookie. Authorization matches ticket
  view access from VETOR-031.

## Data impact

Migration `1760000020000` adds `tickets.priority` with default `low` and
check constraint `chk_tickets_priority`, and creates `ticket_attachments`.
The ticket row cascades to its attachments. The uploader is restricted.
File bytes stay on the tenant filesystem. The stored filename is a pointer,
not the original name.

## Security

The same attachment policy as cards applies: validated MIME, magic bytes,
5 MB, 10 files, tenant-scoped storage, and no filesystem path in the DTO.
Download requires the same ticket scope as reading the ticket. No new
public route.

## Testing

- AC-001: `backend/src/modules/tickets/dto/ticket.dto.spec.ts` and
  `backend/src/modules/tickets/tickets.service.spec.ts`.
- AC-002: `frontend/components/tickets/tickets-home.spec.tsx`.
- AC-003: `tickets.service.spec.ts` and `backend/test/tickets.e2e-spec.ts`.
- AC-004: service and e2e cross-tenant `403`, invalid type `400`, and the
  eleventh file `400`.
- AC-005: `frontend/lib/tickets.spec.ts`, tickets home, and
  `frontend/components/tickets/ticket-detail.spec.tsx`.
- AC-006: service assertion that attachment upload does not send another
  notice.

## Delivery

Update the tickets module, portal ticket screens, OpenAPI, and the product,
design, API, and database contracts. Keep VETOR-031 free of attachment and
priority requirements.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-10-27-ticket-priority-attachments`
- Request: add the existing attachment control and priority `Baixa`,
  `Média`, and `Alta` to `Abrir chamado`, and paste images on the ticket
  screen.
- Confirmed human decisions:
  - Reuse the attachment component already used by other modals.
  - `Baixa` is the default priority. The other values are `Média` and `Alta`.
  - Images can be pasted on the ticket screen.
- Technical choices recorded here:
  - Priority keys match cards: `low`, `medium`, `high`.
  - Upload permission matches who can view the ticket.
  - Create stays limited to Cliente.
  - Attachment upload does not send mail.
  - There is no delete endpoint.

## Implementation evidence

- Changed: ticket priority column and `ticket_attachments`, tickets module
  upload and download, `Abrir chamado` priority and `Anexar`, ticket-screen
  paste and dropzone, and the product, design, API, database, and OpenAPI
  contracts. VETOR-031 points attachment and priority scope here.
- Tests: `npm test` passed (backend 284, frontend 309, SDD 10).
  `npm run test:e2e` passed (92). `npm run typecheck` passed.
  `npm run lint` passed with the existing frontend image warnings and no
  errors. `npm run build` passed. `spec-driven-development` passed for 34
  specifications. `npm run format:check` was not run as a gate because it
  already fails on files outside this delivery. `npm run audit:all` was not
  run.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
