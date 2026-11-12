---
id: VETOR-026
title: Private finance project documents
status: approved
source_kind: human_prompt
source_reference: chat-2026-10-14-finance-project-documents
created_at: 2026-10-14
updated_at: 2026-10-14
---

# Private finance project documents

## Context

VETOR-015 provides the Financeiro screen for the global
`Administrador`. The screen covers every tenant and already has a separate
contract PDF attachment. The requester needs a wider desktop composition and
a second document area for everyday business files associated with each
project.

The confirmed business decisions are:

- Financeiro is an internal VETOR surface accessed only by the global
  `Administrador`.
- The tenant filter continues to support one tenant or `Todas`.
- Documents are associated with one project and are entered from that
  project's row.
- Document storage is rooted in the VETOR tenant identifier and is
  organized below tenant and project identifiers.
- The file policy covers Word documents, PDFs, spreadsheets, presentations,
  text files, images, common audio files, and other ordinary business
  formats. Executables, scripts, HTML, and SVG are not business documents
  for this feature.
- The maximum file size is 25 MB and the maximum aggregate size is 500 MB
  per project.

## Desired outcome

The global `Administrador` can open a project document modal from any
Financeiro row, see that project's uploaded documents, download an existing
document, and upload another permitted document. The modal works after
filtering by one tenant or while all tenants are visible. No tenant user can
read or write this document area.

## In scope

- Increase the Financeiro content width to `1440px` on wide screens while
  preserving the portal gutters and mobile behavior.
- Add an `Arquivos do projeto` action to each project row.
- Open the shared accessible `Modal` for the selected project.
- List each document's original name, content type, size, creation date, and
  `Baixar` action.
- Upload one document at a time from a labelled `Enviar arquivo` control.
- Refresh the document list after a successful upload or download request.
- Reuse the Financeiro tenant filter and project identity; do not change the
  portal session tenant.
- Store file metadata with the project and its tenant while placing bytes
  below the server-resolved VETOR tenant storage root.
- Accept Word, PDF, spreadsheet, presentation, text, image, archive, and
  common audio formats up to 25 MB per file.
- Enforce a 500 MB aggregate file limit and a 200-document limit per project.
- Preserve the existing contract PDF field and its upload, download, and
  removal behavior. A successful contract PDF upload also stores that same
  PDF as a finance project document, so it appears in `Arquivos do
  projeto`. Removing or replacing the contract attachment does not remove
  project documents already stored.

## Out of scope

- Tenant-user access to Financeiro documents.
- A new public route or a new portal page.
- Replacing or merging the existing project document tree on the Kanban
  board.
- Folder upload, folder creation, rename, move, or recursive delete.
- Document editing, online preview, OCR, conversion, transcription, or
  external storage integration.
- Executables, scripts, HTML, SVG, or other formats that can be served as
  active content.
- Changing Financeiro formulas, tenant filtering semantics, project CRUD,
  or portal session handling.
- Removing a finance project document when the contract PDF attachment is
  deleted or replaced.

## Acceptance criteria

- AC-001: Only an authenticated global `Administrador` sees
  `Arquivos do projeto` in Financeiro and can access the document list,
  upload, and download endpoints. Unauthenticated callers receive `401`;
  all other profiles receive `403`. Test: finance component authorization
  test and finance document e2e authorization cases.
- AC-002: Financeiro uses a `1440px` maximum content width on wide screens
  without page-level horizontal overflow. The table remains usable on
  narrow screens with the existing horizontal table scroll and the page
  remains vertically scrollable when its content exceeds the viewport. Test:
  finance component responsive structure test.
- AC-003: Each visible project row has an `Arquivos do projeto` action. The
  action opens the shared `Modal` for that exact project without changing
  the tenant filter or portal session. Test: finance component modal and
  tenant filter test.
- AC-004: The modal lists the selected project's documents with original
  name, content type, size, creation date, and `Baixar`. An empty project
  shows `Nenhum arquivo neste projeto.`. Test: finance component document
  list and empty-state test.
- AC-005: `Enviar arquivo` accepts one permitted business file, sends it to
  the selected project, and refreshes the list after success. A file over
  25 MB, a file that would exceed the 500 MB project total, a 201st
  document, a blocked format, or a MIME/content mismatch returns `400` and
  the UI shows `Não foi possível concluir a operação.`. Test: finance
  document service unit tests, finance component upload test, and finance
  document e2e upload cases.
- AC-006: A document uploaded for one project never appears in another
  project's modal. The server resolves the VETOR storage root and never
  returns filesystem paths or accepts a client path. Test: finance document
  service isolation and storage-path unit tests.
- AC-007: Documents remain available when the tenant filter is `Todas` or a
  single tenant. Filtering changes only the visible project rows and does
  not change the portal session tenant. Test: finance component tenant
  filtering test and finance document e2e cross-tenant read case.
- AC-008: A project delete removes its finance document metadata and bytes
  with the existing project deletion flow. Test: projects service unit test
  and finance document e2e project deletion case.
- AC-009: Document controls have labelled inputs, visible focus, keyboard
  accessible modal behavior, and primary controls of at least 40px. Test:
  finance component accessibility assertions and shared modal tests.
- AC-010: Saving a contract PDF also creates a finance project document
  with the same PDF bytes and original name. That document is returned by
  the project document list and can be downloaded from `Arquivos do
  projeto`. An invalid contract PDF does not create a project document.
  Test: project finance service contract-file unit test.

## User experience

The screen continues to use the existing portal shell, Inter typography,
off-white surface, VETOR tokens, and shared `Modal`. The Financeiro content
container uses `w-full max-w-[1440px] mx-auto`; small screens retain tight
gutters and vertical page scrolling.

The table action cell contains `Editar`, `Excluir`, and
`Arquivos do projeto`. The document action opens a modal titled with the
selected project name. The modal contains the selected tenant, workspace,
and project context, a document list, a labelled `Enviar arquivo` control,
and `Baixar` controls. The native file input is visually hidden and accepts
the approved business MIME allowlist. The modal stays viewport-capped and
scrolls internally through the shared primitive.

The document list is a compact responsive list rather than a second table.
Long names wrap safely, sizes use readable units, and unsupported browser
preview behavior is avoided by using authenticated download. Existing
Financeiro success, loading, mutation, and failure messages remain the
feedback source.

## API and integrations

All routes require the existing access cookie and the global
`Administrador` authorization. Controllers return DTOs and never expose
filesystem paths.

| Method | Route | Request | Response | Errors |
| ------ | ----- | ------- | -------- | ------ |
| GET | `/api/v1/finance/projects/{projectId}/documents` | None | Document DTO array | `401`, `403`, `404` |
| POST | `/api/v1/finance/projects/{projectId}/documents` | Multipart field `file` | Created document DTO | `400`, `401`, `403`, `404` |
| GET | `/api/v1/finance/projects/{projectId}/documents/{documentId}` | None | File bytes with attachment disposition | `401`, `403`, `404` |

The list and created document DTO contain:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "originalName": "string",
  "contentType": "string",
  "byteSize": 0,
  "createdAt": "ISO-8601 timestamp"
}
```

The upload field is `file`. The server derives the project tenant and the
VETOR storage root from trusted database/session state. The client cannot
provide `tenantId`, `projectId`, a storage path, a filename pointer, or
computed totals.

File failures use the existing generic mutation copy in the frontend. The
backend keeps the existing HTTP error shape and returns `400` for invalid
type, size, mismatch, or project aggregate limits.

## Data impact

Add one TypeORM migration and one table:

| Table | Columns |
| ----- | ------- |
| `finance_project_documents` | `id` uuid, `project_id` uuid, `tenant_id` uuid, `storage_filename` varchar(255), `original_name` varchar(255), `content_type` varchar(200), `byte_size` integer, `created_by_user_id` uuid, timestamps |

`project_id` references `projects` with `ON DELETE CASCADE`.
`tenant_id` references `tenants` with `ON DELETE CASCADE`. User references
use the existing `ON DELETE RESTRICT` policy. Index both tenant and project
foreign keys. The table has no plaintext document body.

Bytes are stored below:

```text
infrastructure/repository/files/{vetorTenantId}/finance/{tenantId}/{projectId}/{documentId}
```

The path is a server-side pointer only. The browser receives the original
name and an authenticated download operation, never the pointer or an
absolute path.

The service enforces 25 MiB per file, 500 MiB total bytes per project, and
200 documents per project. Project deletion unlinks each stored document
before the existing database cascade removes the rows.

## Security

- Every list, upload, and download requires the existing access cookie.
- Only profile `Administrador` is authorized; `AdministradorTenant` and
  `Usuario` receive `403`, regardless of `enabledActions`.
- The backend checks the requested project and document relationship before
  reading or writing.
- The server resolves the VETOR tenant root and rejects all client-provided
  paths, absolute names, `..`, backslashes, and unsafe original names.
- The upload validates declared MIME, extension, size, and file content
  where practical. It rejects executables, scripts, HTML, SVG, and active
  content.
- The allowlist includes Word, PDF, spreadsheet, presentation, text,
  image, archive, and common audio MIME types:
  `application/pdf`, `application/msword`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
  `application/vnd.ms-excel`,
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
  `application/vnd.ms-powerpoint`,
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`,
  `text/plain`, `text/csv`, `text/markdown`, `application/json`,
  `application/zip`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`,
  `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/mp4`, `audio/ogg`,
  `audio/webm`, `audio/aac`, and `audio/flac`.
- Download responses use `Content-Disposition: attachment` with a
  sanitized original name and `Content-Type` from validated metadata.
- DTOs omit paths, secrets, tokens, and internal identifiers not needed by
  the UI. Upload bytes, document contents, and paths are not logged.
- The frontend is a usability layer; backend authentication,
  authorization, validation, and tenant/project isolation remain
  authoritative.

## Testing

- Frontend component tests cover the row action, modal project context,
  empty list, document list, upload success, upload failure, authenticated
  download, tenant filtering, and non-Administrador hiding.
- Backend unit tests cover the global-only authorization, project/document
  relationship, allowlist, 25 MiB limit, 500 MiB aggregate limit, 200-file
  limit, storage root, sanitized names, and delete unlink.
- Backend e2e tests cover `401`, `403`, `404`, list, upload, download,
  invalid file input, and project deletion.
- Contract tests update Swagger and OpenAPI assertions.
- Run frontend and backend `typecheck`, `lint`, `test`, and `build`, backend
  `test:e2e`, and `spec-driven-development`.

Coverage mapping:

- AC-001: `finance-home.spec.tsx`, `finance-documents.e2e-spec.ts`
- AC-002: `finance-home.spec.tsx`
- AC-003: `finance-home.spec.tsx`
- AC-004: `finance-home.spec.tsx`
- AC-005: `finance-documents.service.spec.ts`,
  `finance-home.spec.tsx`, `finance-documents.e2e-spec.ts`
- AC-006: `finance-documents.service.spec.ts`
- AC-007: `finance-home.spec.tsx`, `finance-documents.e2e-spec.ts`
- AC-008: `projects.service.spec.ts`, `finance-documents.e2e-spec.ts`
- AC-009: `finance-home.spec.tsx`, `modal.spec.tsx`
- AC-010: `project-finance.service.spec.ts`

## Delivery

The named human approved this specification in the implementation chat on
2026-10-14. Approved delivery updates:

- `frontend/components/finance/finance-home.tsx` and its tests
- `frontend/lib/api/client.ts`
- Backend projects finance controllers, services, DTOs, entity, migration,
  storage cleanup, and tests
- `docs/api.md`, `openapi.yaml`, `docs/database.md`, and `docs/design.md`

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-10-14-finance-project-documents`
- Extends VETOR-015 without changing finance formulas, contract PDFs,
  tenant filtering, or portal session behavior.
- Deliberately remains separate from the shared project document tree in
  VETOR-014 because Financeiro documents are private to the global
  Administrator.

## Implementation evidence

- Changed: Delivery files and affected global contracts will be recorded
  after implementation.
- Tests: Executed commands and coverage will be recorded after implementation.

## Validation evidence

- AC-001: Validation pending delivery.
- AC-002: Validation pending delivery.
- AC-003: Validation pending delivery.
- AC-004: Validation pending delivery.
- AC-005: Validation pending delivery.
- AC-006: Validation pending delivery.
- AC-007: Validation pending delivery.
- AC-008: Validation pending delivery.
- AC-009: Validation pending delivery.
