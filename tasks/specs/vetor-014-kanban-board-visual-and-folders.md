---
id: VETOR-014
title: Kanban board visual impact and folder attachments
status: implemented
source_kind: human_prompt
source_reference: chat-2026-09-21-kanban-board-visual-folders
created_at: 2026-09-21
updated_at: 2026-09-21
---

# Kanban board visual impact and folder attachments

## Context

The requester asked to improve the Kanban board design so it uses more
color, feels closer to a Trello board (attached screenshot), keeps rounded
cards, improves remaining aspects, creates impact when the client opens
the board, and allows attaching files and folders.

Original request (Portuguese, preserved):

> Melhore o desgin do board, coloque mais cores para chamar atenção. Uso
> como exemplo o board do trello conforme anexo. Manter os cards
> arredondados, e melhores os demais aspectos. Precisamos criar impacto
> qunando o cliente acessar. Tambem é importante que possa anexar arquivos
> e pastas.

Follow-up answers (2026-09-21):

1. Colors and visual system: choose as a senior designer.
2. Impact: an entrance effect when the client opens the board.
3. Trello reference elements: all listed board elements (photographic
   background, colored labels, due-date urgency, assignee photo,
   comment/attachment counts, checklist, card cover).
4. Visual work is only `/portal/projetos/{id}`, not the workspace home.
5. Drag-and-drop is in scope.
6. Folders are a **project** folder (upload a folder or files for that
   project), not a card-scoped tree.
7. Keep 5 MB per file and 10 files per card. Add a wider allowlist of
   types. The same per-file size applies inside a project folder.
8. Project folder tree: maximum 500 MB total.
9. Folder/file actions: download one file, download whole folder,
   rename, move, delete file, delete folder.
10. Any actor with board access may attach; persist who attached.
11. All new UI copy is Portuguese (Brazil). Exact strings are recorded
    below as the senior-designer choice.
12. Board background image: only `AdministradorTenant` may set or
    remove it (per project). `Administrador` (Global) receives `403` on
    those writes.

Follow-up on the implemented board (2026-09-21):

13. Card detail is a modal, not an inline panel below the board.
14. Card face shows `#number` and title at the top (under the cover
    when a cover exists).
15. Remove `Mover` / `Subir` / `Descer` from the card face; drag-and-drop
    is the move interaction.
16. In the card modal, `#number` sits beside the title on one row.
17. Each comment shows author plus creation date and time
    (`America/Sao_Paulo`).
18. Card face has `Editar` beside `Excluir`; `Editar` opens the modal.
19. Card attachment upload uses a labelled control (`Enviar arquivo`),
    not a raw native file input.
20. Remove the board canvas navy scrim (`bg-navy/40`); it washed out the
    background.
21. Lanes use a raised 3D surface (layered shadow and inset highlight)
    so they read as volumes against the canvas.
22. In the card modal, the control that opens the field form is `Editar`
    (not `Salvar`).
23. The modal has a `Salvar` control that closes the dialog.
24. The card description sits in a labelled `Solicitação` box.
25. In the modal header, `#number` uses the same type size as the title.
26. The `Solicitação` box shows the card creation date and time
    (`America/Sao_Paulo`). The due value in the modal uses the same
    date-and-time format.
27. In `CardForm`, `Cancelar` uses the same accent treatment as `Salvar`.
28. Each checklist item has `Editar`; after that control, the body is an
    editable field and `Salvar` persists `PATCH` `{ body }`.
29. The card modal does not show the `Capa` section (`Definir capa` /
    `Remover capa`). Cover still renders on the card face when set.
30. The comments section heading is `Comentários`; the submit control
    stays `Comentar`.
31. Modal `Editar` (open the field form) uses the accent treatment used
    by `Salvar` and `Comentar`.
32. Modal metadata labels are `Criado:`, `Associado:`, `Data e hora:`
    (due), `Prioridade:`, and `Tags:`.
33. On the card face, `#number` and the title sit on one row at the same
    type size as the modal (`text-xl font-semibold`). Remaining face
    fields use `Tags`, `Data e hora`, `Checklist`, `Comentários`,
    `Anexos`, `Prioridade`, and `Associado`.
34. Card-face `Editar` uses the accent treatment used by `Salvar` and
    modal `Editar`.
35. In `Arquivos do projeto`, the selected toolbar control (`Enviar
arquivo`, `Enviar pasta`, or `Nova pasta`) uses accent; the others
    stay outlined. The selected control has `aria-current="true"`.
36. The portal board remains usable on mobile and tablet: tighter main
    gutters, no page-level horizontal scroll, lane width
    `min(280px, 100vw - 4.5rem)` below `md`, horizontal lane scroll,
    vertical scroll inside each lane, files panel stacked with a capped
    height below `lg`, and 40px minimum touch targets on primary board
    controls.
37. The shared `Modal` stays inside the viewport: overlay
    `overflow-hidden`, dialog `max-h-dvh` / `md:max-h-[calc(100dvh-4rem)]`
    with internal `overflow-y-auto`. Tall card detail does not extend
    past the screen.
38. Card `Enviar arquivo` accepts more than one file in one picker
    (`multiple`). Each file is still at most 5 MB (allowlist unchanged).
    Hint copy is `Cada arquivo até 5 MB.` The existing maximum of 10
    attachments per card still applies; selecting more files than
    remaining slots is rejected with the invalid-file copy. The API
    stays one POST per file.

The named human approver invoked `/goal` on this specification on
2026-09-21 and thereby approved it for delivery. The same human then
confirmed items 13–31 on the live board.

VETOR-012 (`implemented`) already delivers the board with six fixed
lanes, rounded cards, `Mover` / `Subir` / `Descer` (no drag-and-drop),
comments, and card attachments limited to JPEG, PNG, and PDF. This
specification **supersedes** VETOR-012 only where recorded: board
visuals, drag-and-drop, card-face `Mover` / `Subir` / `Descer`, card
detail as a modal, card file types, card attachment author, checklist,
cover, and project documents. Lanes, routes, profiles,
`enabledActions`, tenant picker, and comment rules stay.

The attached Trello screenshot is a composition reference. Do not ship
Trello or Atlassian trademarks, logo, chrome (`Share`, `Filter`,
`Power-Ups`), or the attached photograph as a product asset.

Approved delivery promotes board tokens into `docs/design.md` and
updates `docs/api.md`, `openapi.yaml`, Swagger, and `docs/database.md`.

UI language is Portuguese (Brazil). This specification body is English.

## Desired outcome

An authorized portal user opens `/portal/projetos/{id}` and sees a
colorful Trello-like VETOR board: frosted lanes on a project background,
rounded cards with labels, due-date urgency, assignee photo, counts,
checklist progress, and optional cover, plus an entrance effect. They
drag cards between lanes when they have `moveCards`. They attach one or
more files on a card (5 MB each, max 10). They upload files or a
folder into that project's document tree (500 MB total) and can
download, rename, move, and delete. The uploader is stored and shown.
Only Administrador Tenant changes the board background.

## In scope

- Visual redesign of `/portal/projetos/{id}` (`ProjectBoardView`) only.
- Senior-designer color system recorded below (VETOR tokens plus board
  accents). Rounded cards kept.
- Entrance effect on board open (`framer-motion`, reduced-motion safe).
- Photographic (or uploaded) per-project background; default gradient
  until Administrador Tenant sets an image.
- Card face: colored label chips, due-date urgency, assignee photo,
  comment count, attachment count, checklist progress, optional cover.
- Checklist on the card (create, toggle, edit, delete items).
- Drag-and-drop of cards across lanes and to a position in a lane.
  Do not show `Mover` / `Subir` / `Descer` on the card face.
- Card detail opens in the shared portal `Modal`.
- Card files: wider MIME allowlist; still 5 MB each; still maximum 10
  per card; the card picker accepts multiple files in one selection;
  persist and display who attached; delete allowed.
- Project document tree on the board: files and folders for that
  project; 5 MB per file; 500 MB total; download file, download folder
  as zip, rename, move, delete file, delete folder; persist who
  attached.
- `GET /api/v1/projects/{id}` grows board fields needed by this UI.
- New project-document and background HTTP as recorded.
- On approved delivery: `docs/design.md`, `docs/api.md`,
  `openapi.yaml`, Swagger, `docs/database.md`.

## Out of scope

- Re-approving this specification after delivery starts
- Trello, Jira, Linear, or any external Kanban product, API, import, or
  Power-Ups
- Copying Trello / Atlassian trademarks, logo, chrome, or the attached
  photograph
- Restyling `/portal/projetos` workspace/project home
- Leadpage, native apps, offline PWA shell, billing
- Power BI catalog or Relatórios
- Changing workspace/project CRUD, profiles, `enabledActions`, tenant
  picker, or the six stored lane keys and pt-BR lane labels
- New portal routes (the file panel lives on the existing board)
- Icon library (Lucide, Radix, shadcn) or a drag-and-drop library
- Custom lane titles, filters, board search, Share, Automation
- Executables, HTML, SVG, and script uploads

## Acceptance criteria

- AC-001: Cards on `/portal/projetos/{id}` remain rounded (`rounded-2xl`
  or 16px equivalent, not square).
- AC-002: Lanes, labels, priority, due badges, and lane accents use the
  recorded board color tokens (not the current near-monochrome treatment).
- AC-003: Opening the board plays the recorded entrance effect. With
  `prefers-reduced-motion`, the board appears with no stagger or
  decorative motion.
- AC-004: Card file attach accepts the recorded MIME allowlist, rejects
  other types, keeps 5 MB per file and maximum 10 files per card, stores
  `createdByUserId`, and shows who attached.
- AC-005: An actor with `viewProjects` (or implying profile) uploads
  files or a folder into the project document tree (5 MB per file, 500 MB
  tree), and can download a file, download a folder as zip, rename,
  move, and delete file or folder. Uploader is stored and shown.
- AC-006: The board stays inside the VETOR portal shell (navy sidebar,
  Inter). No Trello wordmark or Atlassian chrome.
- AC-007: Unauthenticated callers of new or changed routes receive
  `401`. Callers without the recorded permission receive `403`.
  Frontend hiding is UX only.
- AC-008: Card face shows colored tags, due-date urgency (overdue /
  today / future in `America/Sao_Paulo`), assignee photo when the
  assignee has a photo, comment count when greater than zero,
  attachment count when greater than zero, checklist `done/total` when
  the card has items, and cover image when set.
- AC-009: An actor with `moveCards` drags a card to another lane or to
  a new index in a lane; lane and position persist. Without
  `moveCards`, drag is disabled and `POST .../place` is `403`. The card
  face does not show `Mover`, `Subir`, or `Descer`.
- AC-010: Checklist items persist on the card; actors with card access
  create, toggle, edit, and delete items within the recorded limits.
- AC-011: Only `AdministradorTenant` sets or removes the per-project
  board background (`403` for `Administrador` and `Usuario`). The
  background is JPEG, PNG, or WEBP, maximum 8 MB. With no image, the
  recorded default gradient is used.
- AC-012: `/portal/projetos` workspace/project home visual treatment is
  unchanged by this specification.

## User experience

UI language is Portuguese (Brazil). Dates use `America/Sao_Paulo`.
VETOR-012 copy remains except where this table replaces or adds strings.

Portal chrome is unchanged: navy sidebar, heading `Projetos`, light/dark
mode. The board fills the main area (no `1320px` cap on this view).

### Layout

- Horizontal board: columns `min-width` 280px from `md` up; below `md`
  the column is `min(280px, 100vw - 4.5rem)` so one lane stays fully
  visible. `overflow-x` auto on the canvas, vertical scroll inside each
  lane. The canvas fills the remaining portal main height (`min-h-[50svh]`
  on small screens).
- Lane: frosted surface (`bg-white/95` light, `bg-navy-50/90` dark,
  `backdrop-blur-md`), radius 24px, 4px top accent in the lane color,
  class `board-lane-raised` (inset highlight plus extruded drop shadow
  so the lane sits in front of the canvas). No navy overlay on the
  canvas.
- Card: white / `navy-50`, radius `rounded-2xl` (16px), soft shadow,
  padding 12px. Cover on top (`h-36`, `object-cover`, rounded top only).
- Board canvas sits on the background image or default gradient with no
  scrim. Lane type stays readable because the lane surface is raised and
  nearly opaque.
- Project files open from a board control `Arquivos do projeto` as a
  panel on the same page (right sheet on `lg`, full-width below the
  lanes on small screens with `max-h-[min(24rem,50svh)]`). Not a new
  route. Primary board controls use a 40px minimum touch target.
- `Novo card` stays. Background control `Fundo do board` is shown only
  to Administrador Tenant.
- Opening a card uses the shared `Modal` primitive (`role="dialog"`,
  labelled by the card title, Escape and overlay dismissal, close
  control `Fechar janela`). On `md` and up the dialog is `max-w-3xl`.
  The dialog is height-capped to the viewport (`max-h-dvh`,
  `md:max-h-[calc(100dvh-4rem)]`) and scrolls internally. The board
  stays visible under the overlay.

### Color system (senior designer)

Promote these into `docs/design.md` on approved delivery. They extend
VETOR; they do not copy Trello hex values.

| Token                   | Value     | Use                             |
| ----------------------- | --------- | ------------------------------- |
| `board-lane-backlog`    | `#64748B` | Backlog accent                  |
| `board-lane-ready`      | `#3D9CF0` | Pronto accent                   |
| `board-lane-working`    | `#F5A524` | Trabalhando accent              |
| `board-lane-review`     | `#7B6CFF` | Revisão accent                  |
| `board-lane-deploy`     | `#2EC4B6` | Deploy accent                   |
| `board-lane-done`       | `#BDDA2B` | Finalizado accent (VETOR lime)  |
| `board-label-lime`      | `#BDDA2B` | Tag                             |
| `board-label-sky`       | `#3D9CF0` | Tag                             |
| `board-label-pink`      | `#E85D8C` | Tag                             |
| `board-label-amber`     | `#F5A524` | Tag                             |
| `board-label-violet`    | `#7B6CFF` | Tag                             |
| `board-label-teal`      | `#2EC4B6` | Tag                             |
| `board-label-coral`     | `#FF6B4A` | Tag                             |
| `board-label-navy`      | `#1A2844` | Tag                             |
| `board-due-overdue`     | `#E24B4A` | Due date on or before yesterday |
| `board-due-today`       | `#F5A524` | Due date is today               |
| `board-due-future`      | `#4A5267` | Due date after today            |
| `board-priority-low`    | `#2EC4B6` | Priority chip                   |
| `board-priority-medium` | `#F5A524` | Priority chip                   |
| `board-priority-high`   | `#E24B4A` | Priority chip                   |

Priority chips stay labeled `Baixa` / `Média` / `Alta` (color is not
the only signal). Lane titles stay `Backlog` / `Pronto` /
`Trabalhando` / `Revisão` / `Deploy` / `Finalizado`.

Tag color keys (API): `lime`, `sky`, `pink`, `amber`, `violet`,
`teal`, `coral`, `navy`. Picker labels: `Lima`, `Azul`, `Rosa`,
`Âmbar`, `Violeta`, `Verde-água`, `Coral`, `Marinho`.

Existing string tags migrate by hashing the name to one of the eight
keys so every tag has a color without a user step.

Due-date calendar day is `America/Sao_Paulo`. Overdue includes today
only when the stored timestamptz is before the start of today; **today**
is the due calendar date equal to today; **future** is after today.

### Entrance effect

On first successful load of the board (not on every card mutation):

- Background fades in 400ms.
- Lanes stagger in from `x: 24` with 70ms delay, ease `[0.16, 1, 0.3, 1]`.
- Cards in view fade up `y: 12` with 20ms stagger.

`prefers-reduced-motion: reduce`: opacity 1, no transform, no stagger.

Drop target: 2px `accent` ring on the lane. Dragged card: 2deg rotate
and stronger shadow. Honor reduced motion (no rotate).

Use existing `framer-motion`. No new motion library.

### Card face

Top to bottom:

1. Cover image when `coverAttachmentId` is set (JPEG/PNG/GIF/WEBP
   attachment on that card).
2. `#number` and title on one row (`flex`, baseline aligned) at the same
   type size as the modal (`text-xl font-semibold`). This control opens
   the detail modal.
3. Remaining fields with labels: `Tags` (chips), `Data e hora` (due, when
   set), `Checklist` fraction (when items exist), `Comentários` count
   (when > 0), `Anexos` count (when > 0), `Prioridade`, and `Associado`
   with photo (32px circle) or initials from first and last name when
   there is no photo.
4. `Editar` (accent; opens the detail modal) beside `Excluir` with the
   existing confirm.

Opening the card uses the shared portal modal for fields, comments,
files, and checklist. Do not render card detail as a panel below the
board. Do not show `Capa` in the modal.

In the modal header, `#number` and the title sit on one row (`flex`,
baseline aligned) at the same type size (`text-xl font-semibold`). The
description is a boxed section labelled `Solicitação`, with the card
creation timestamp (`pt-BR` short date and short time,
`America/Sao_Paulo`). The due value in the modal uses the same datetime
format and is labelled `Data e hora`. Creator, assignee, priority, and
tags sit under `Criado`, `Associado`, `Prioridade`, and `Tags`. `Editar`
opens the card field form and uses the accent
treatment; `Cancelar` in that form uses the same accent treatment as
`Salvar`. `Salvar` at the bottom of the modal closes the dialog.
Checklist items have `Editar`; after that control the body is editable
and `Salvar` persists the text. Comments use heading `Comentários` and
submit control `Comentar`. Each comment shows the author name beside
the creation timestamp (`pt-BR` short date and short time,
`America/Sao_Paulo`).
Card attachments use section `Anexos` and a dashed labelled control
`Enviar arquivo` with a visually hidden `multiple` file input (same
pattern as project documents). Hint copy is `Cada arquivo até 5 MB.`

### Drag-and-drop

HTML5 Drag and Drop in `project-board.tsx`. No `@dnd-kit` or similar.

- The card article is `draggable` only when `moveCards` is true.
- Drop on a lane (empty or occupied) or on a card (insert before).
- Persist with `POST /api/v1/cards/{id}/place`.
- Do not show `Mover` / `Subir` / `Descer` on the card. `POST /move` and
  `POST /reorder` remain on the API.
- Do not persist a drop that the API rejects; refresh the board instead.

### Checklist

In card detail: list of items with checkbox, text, `Editar`, and
delete. `Editar` turns the body into an editable field and shows
`Salvar`, which persists `PATCH /api/v1/cards/{id}/checklist-items/{itemId}`
`{ body }`. Control `Novo item`. Empty `Nenhum item.`. Maximum 50 items;
each body 1–200 characters after trim. Toggle `done` with card access.
No extra permission.

### Cover

Cover still renders on the card face when `coverAttachmentId` points at
an image attachment of that card. Deleting that attachment clears the
cover. The modal does not show `Capa`, `Definir capa`, or `Remover capa`.

### Project documents

Panel `Arquivos do projeto` shows a tree. Empty `Nenhum arquivo neste
projeto.` Controls: `Enviar arquivo`, `Enviar pasta`, `Nova pasta`, and
per-node `Baixar`, `Renomear`, `Mover`, `Excluir`. The selected toolbar
control uses accent; the other two stay outlined (`aria-current="true"`
on the selected control). Folder download uses `Baixar
pasta` and returns a zip. Confirm delete file `Excluir este arquivo?`
Confirm delete folder `Excluir esta pasta e todo o conteúdo?`

`Enviar pasta` uses the browser directory picker
(`webkitdirectory` / `HTMLInputElement.webkitdirectory`). Empty folders
that the picker omits are not created unless the user uses `Nova pasta`.

Uploader line: `Enviado por {firstName} {lastName}`.

### Board background

Administrador Tenant only: `Fundo do board` file input, `Remover fundo`.
JPEG, PNG, or WEBP, maximum 8 MB. Other profiles do not see the control
and receive `403` on the API.

Default (no image): class `board-canvas-default` — navy mesh using
`navy`, `navy-300`, and `accent-soft` radial glows. Not a stock
photograph. No overlay scrim.

### Accessibility

Semantic `section` per lane, visible focus, and the shared modal
keyboard pattern (Escape, focus trap, return focus to the trigger).
Color is never the only signal. Custom inline SVG for counts, due clock,
and paperclip. Dragged card exposes `aria-grabbed`. Drop lanes expose
`aria-dropeffect="move"` when dragging. Card file attach uses a labelled
control; the native `input[type=file]` is visually hidden and accepts
multiple files.

### Copy (pt-BR)

VETOR-012 strings stay except `invalidFile`, which this feature
replaces. New and replaced strings:

| Use                          | Copy                                      |
| ---------------------------- | ----------------------------------------- |
| Invalid card or project file | `Envie um arquivo permitido de até 5 MB.` |
| Invalid folder total         | `A pasta deve ter no máximo 500 MB.`      |
| Invalid background           | `Envie JPEG, PNG ou WEBP de até 8 MB.`    |
| Button                       | `Arquivos do projeto`                     |
| Button                       | `Enviar arquivo`                          |
| Button                       | `Enviar pasta`                            |
| Button                       | `Nova pasta`                              |
| Button                       | `Baixar`                                  |
| Button                       | `Baixar pasta`                            |
| Button                       | `Renomear`                                |
| Button                       | `Mover` (project documents only)          |
| Button                       | `Novo item`                               |
| Button                       | `Fundo do board`                          |
| Button                       | `Remover fundo`                           |
| Empty documents              | `Nenhum arquivo neste projeto.`           |
| Empty checklist              | `Nenhum item.`                            |
| Confirm delete file          | `Excluir este arquivo?`                   |
| Confirm delete folder        | `Excluir esta pasta e todo o conteúdo?`   |
| Uploader prefix              | `Enviado por`                             |
| Checklist section            | `Checklist`                               |
| Comments section             | `Comentários`                             |
| Button                       | `Comentar`                                |
| Button                       | `Editar`                                  |
| Attachment section           | `Anexos`                                  |
| Card attach hint             | `Cada arquivo até 5 MB.`                  |
| Request section              | `Solicitação`                             |
| Created by                   | `Criado`                                  |
| Assignee                     | `Associado`                               |
| Due                          | `Data e hora`                             |
| Priority                     | `Prioridade`                              |
| Tags                         | `Tags`                                    |

Success, forbidden, generic failure, not found, cancel, save, delete
stay as VETOR-012.

## API and integrations

No Trello integration. JSON names are English. Cookies and session
tenant stay. Do not proxy through `ms-powerbi-embedded`. DTOs omit
filesystem paths.

Card access remains `viewProjects` or implying profile
(`Administrador`, `AdministradorTenant`). `moveCards` remains required
to move, reorder, place, or drag. Document and card-file writes use
card/board access (any `viewProjects` actor). Background writes use
`AdministradorTenant` only.

### MIME allowlist (card files and project files)

| MIME                                                                        | Extension |
| --------------------------------------------------------------------------- | --------- |
| `image/jpeg`                                                                | `jpg`     |
| `image/png`                                                                 | `png`     |
| `image/gif`                                                                 | `gif`     |
| `image/webp`                                                                | `webp`    |
| `application/pdf`                                                           | `pdf`     |
| `text/plain`                                                                | `txt`     |
| `text/csv`                                                                  | `csv`     |
| `text/markdown`                                                             | `md`      |
| `application/json`                                                          | `json`    |
| `application/zip`                                                           | `zip`     |
| `application/msword`                                                        | `doc`     |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document`   | `docx`    |
| `application/vnd.ms-excel`                                                  | `xls`     |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`         | `xlsx`    |
| `application/vnd.ms-powerpoint`                                             | `ppt`     |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | `pptx`    |

Magic-byte / MIME mismatch is `400`. Reject other types, including
`image/svg+xml`, HTML, and executables.

Limits: 5 MB per file (`5242880` bytes); 10 files per card; project
tree sum of file `byte_size` ≤ 500 MB (`524288000` bytes); max 200
nodes (files + folders) per project; max folder depth 8; node name
1–120 characters after trim.

Background: `image/jpeg`, `image/png`, `image/webp` only; 8 MB
(`8388608` bytes).

### Tag payload

`tags` becomes `{ name, color }[]`. `name` 1–40 characters, max 20.
`color` one of the eight keys. GET never returns bare strings.

### Planned endpoints

Existing card attachment POST/GET stay and expand MIME. New and
changed rows:

| Method | Path                                                   | Auth                       | Request                                                                                          | Success                                                                                                                                                                              | Errors                                     |
| ------ | ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| GET    | `/api/v1/projects/{id}`                                | `viewProjects`             | None                                                                                             | Board plus `backgroundUrl` (API URL or null), `documents` tree, cards with `createdAt`, tags as objects, `coverAttachmentId`, `assigneePhotoUrl`, checklist, attachment `createdBy*` | `401`, `403`, `404`                        |
| POST   | `/api/v1/cards/{id}/place`                             | `moveCards`                | `{ lane, position }` `position` integer ≥ 0, clamped to lane length                              | Updated card DTO                                                                                                                                                                     | `400`, `401`, `403`, `404`                 |
| POST   | `/api/v1/cards/{id}/attachments`                       | Card access                | multipart one file, allowlist, 5 MB, reject 11th                                                 | Attachment DTO including `createdByUserId`, names                                                                                                                                    | `400`, `401`, `403`, `404`                 |
| DELETE | `/api/v1/cards/{id}/attachments/{attachmentId}`        | Card access                | None                                                                                             | `204`; clears cover if it pointed here                                                                                                                                               | `401`, `403`, `404`                        |
| PATCH  | `/api/v1/cards/{id}`                                   | Card access                | Existing fields; `tags` as objects; optional `coverAttachmentId` uuid or null                    | Updated card                                                                                                                                                                         | `400`, `401`, `403`, `404`                 |
| POST   | `/api/v1/cards/{id}/checklist-items`                   | Card access                | `{ body }` 1–200 chars; reject at 50 items                                                       | Item DTO                                                                                                                                                                             | `400`, `401`, `403`, `404`                 |
| PATCH  | `/api/v1/cards/{id}/checklist-items/{itemId}`          | Card access                | `{ body? , done? }`                                                                              | Item DTO                                                                                                                                                                             | `400`, `401`, `403`, `404`                 |
| DELETE | `/api/v1/cards/{id}/checklist-items/{itemId}`          | Card access                | None                                                                                             | `204`                                                                                                                                                                                | `401`, `403`, `404`                        |
| PUT    | `/api/v1/projects/{id}/background`                     | `AdministradorTenant` only | multipart JPEG/PNG/WEBP ≤ 8 MB                                                                   | `{ backgroundUrl }`                                                                                                                                                                  | `400`, `401`, `403`, `404`                 |
| DELETE | `/api/v1/projects/{id}/background`                     | `AdministradorTenant` only | None                                                                                             | `204`                                                                                                                                                                                | `401`, `403`, `404`                        |
| GET    | `/api/v1/projects/{id}/background`                     | `viewProjects`             | None                                                                                             | Image bytes                                                                                                                                                                          | `401`, `403`, `404`                        |
| POST   | `/api/v1/projects/{id}/documents`                      | `viewProjects`             | JSON `{ kind: folder, name, parentId? }` or multipart files with `relativePath` (POSIX, no `..`) | Created node DTO or array                                                                                                                                                            | `400`, `401`, `403`, `404`                 |
| GET    | `/api/v1/projects/{id}/documents/{documentId}`         | `viewProjects`             | None                                                                                             | File bytes when `kind=file`                                                                                                                                                          | `401`, `403`, `404`                        |
| GET    | `/api/v1/projects/{id}/documents/{documentId}/archive` | `viewProjects`             | None                                                                                             | `application/zip` stream of that folder's descendants                                                                                                                                | `400` if not a folder, `401`, `403`, `404` |
| PATCH  | `/api/v1/projects/{id}/documents/{documentId}`         | `viewProjects`             | `{ name? , parentId? }` (null parent = root). Reject cycles and depth > 8                        | Updated node                                                                                                                                                                         | `400`, `401`, `403`, `404`                 |
| DELETE | `/api/v1/projects/{id}/documents/{documentId}`         | `viewProjects`             | None                                                                                             | `204`; CASCADE children and files                                                                                                                                                    | `401`, `403`, `404`                        |

`POST /move` and `POST /reorder` remain. Place is the drag persistence
path.

`assigneePhotoUrl` is the existing user-photo API URL or null, never a
disk path.

Zip download uses backend package `archiver` (added in the backend
workspace on delivery). Stream; do not buffer 500 MB in memory.

Folder upload writes each file with Multer **disk** storage (not
memory). Abort the request if running total would exceed 500 MB or 200
nodes. Reject `relativePath` with `..`, leading `/`, or `\`.

Error mapping:

- `401` unauthenticated
- `403` → `Você não tem permissão para esta ação.`
- `404` → `Este registro não existe.`
- `400` file type/size → `Envie um arquivo permitido de até 5 MB.`
- `400` folder total → `A pasta deve ter no máximo 500 MB.`
- `400` background → `Envie JPEG, PNG ou WEBP de até 8 MB.`
- other `400` / failures → `Não foi possível concluir a operação.`

Success → `Operação realizada com sucesso.`

## Data impact

PostgreSQL + TypeORM. Frontend never accesses the database. One new
migration. Update `docs/database.md` on approved delivery.

### `projects`

| Column                | Type              | Notes                                                 |
| --------------------- | ----------------- | ----------------------------------------------------- |
| `background_filename` | varchar(255) null | Pointer in the tenant folder. Bytes not in PostgreSQL |

Deleting a project CASCADE removes documents, cards, and the background
file from disk.

### `cards`

| Column                | Type      | Notes                                                               |
| --------------------- | --------- | ------------------------------------------------------------------- |
| `tags`                | jsonb     | `{ name, color }[]` instead of `string[]`. Migrate existing strings |
| `cover_attachment_id` | uuid null | FK `card_attachments(id)` `ON DELETE SET NULL`                      |

### `card_attachments`

| Column               | Type          | Notes                                                                                    |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `created_by_user_id` | uuid not null | FK users `ON DELETE RESTRICT`. Backfill existing rows with the card `created_by_user_id` |

Widen the tenant-file pointer regex to the new extensions. Bytes stay
under `infrastructure/repository/files/{tenantId}`.

### `card_checklist_items` (new)

| Field                | Type                                       |
| -------------------- | ------------------------------------------ |
| `id`                 | uuid PK                                    |
| `card_id`            | uuid FK cards `ON DELETE CASCADE`, indexed |
| `body`               | varchar(200) not null                      |
| `done`               | boolean not null default false             |
| `position`           | integer not null                           |
| `created_by_user_id` | uuid FK users `ON DELETE RESTRICT`         |
| timestamps           | timestamptz                                |

### `project_documents` (new)

| Field                | Type                                                     |
| -------------------- | -------------------------------------------------------- |
| `id`                 | uuid PK                                                  |
| `project_id`         | uuid FK projects `ON DELETE CASCADE`, indexed            |
| `parent_id`          | uuid null FK `project_documents(id)` `ON DELETE CASCADE` |
| `kind`               | varchar(16) check `file` \| `folder`                     |
| `original_name`      | varchar(120) not null                                    |
| `filename`           | varchar(255) null (file pointer; null for folder)        |
| `content_type`       | varchar(200) null                                        |
| `byte_size`          | integer not null default 0                               |
| `created_by_user_id` | uuid FK users `ON DELETE RESTRICT`                       |
| timestamps           | timestamptz                                              |

Unique `(project_id, parent_id, original_name)` (treat NULL parent as
one group). Index `parent_id`.

Folder rows: `filename` null, `content_type` null, `byte_size` 0.

### Limits (persisted rules)

| Rule               | Value               |
| ------------------ | ------------------- |
| Card files         | 10, 5 MB each       |
| Project tree bytes | 500 MB              |
| Project nodes      | 200                 |
| Folder depth       | 8                   |
| Checklist items    | 50                  |
| Checklist body     | 1–200               |
| Background         | 8 MB, JPEG/PNG/WEBP |

Hard delete remains. No `deleted_at`. Optional `metadata` jsonb stays
without UI.

## Security

Existing project security rules apply. Backend is the authority.

- Authenticated session (`401` otherwise).
- IDOR: every project, card, document, and attachment id is scoped to
  the actor tenant (Global working session tenant for reads/moves).
- Background PUT/DELETE: `AdministradorTenant` on their own tenant
  only. Global `403`. Usuario `403`.
- Document and card-file writes: any `viewProjects` actor on that
  tenant; not public, not unauthenticated.
- Default deny. Do not trust MIME, size, `relativePath`, `parentId`,
  `kind`, or `coverAttachmentId` from the client.
- Validate MIME allowlist, magic where practical, size, count, depth,
  and 500 MB running total. Never execute uploads. Never store bytes in
  PostgreSQL.
- Path traversal: reject `..`, absolute paths, and `\`.
- Zip download is server-built from stored files only (no client zip
  extract on upload).
- Serve bytes like VETOR-009 photo GET (`Content-Disposition`
  attachment, sanitized original name).
- DTOs omit secrets, hashes, tokens, and disk paths.
- Do not weaken CORS, Helmet, or auth rate limits.
- Stream 500 MB uploads and zip downloads; do not hold the tree in RAM.
- Multer disk storage for project uploads; per-file 5 MB; total checked
  in the service.

## Testing

- AC-001: `project-board.spec.tsx` rounded card class
- AC-002: lane accent / label / due / priority classes from recorded
  tokens; no canvas scrim; lanes use `board-lane-raised`
- AC-003: motion wrapper present; reduced-motion skips stagger
- AC-004: allowlist accepted; exe/svg/html rejected; 5 MB and 11th file
  rejected; `createdBy` on DTO; unit + `projects.e2e-spec.ts`
- AC-005: folder upload, 500 MB reject, traversal reject, zip GET,
  rename/move/delete, uploader persisted; `401`/`403`; files toolbar
  selected control uses accent and `aria-current`
- AC-006: no Trello wordmark; shell heading `Projetos`
- AC-007: unauthenticated `401`; Usuario without `viewProjects` `403`;
  without `moveCards` place `403`; Global background `403`
- AC-008: card face renders `#number` beside the title at `text-xl`;
  labelled `Tags`, `Data e hora`, `Checklist`, `Comentários`, `Anexos`,
  `Prioridade`, `Associado`; due urgency; photo or initials; cover;
  face `Editar` uses accent and opens the modal; board scroller is
  `overflow-x-auto`; lanes scroll vertically; primary controls `min-h-10`
- AC-009: place persists lane and index; drag disabled without
  `moveCards`; card face has no `Mover` / `Subir` / `Descer`; opening
  a card shows `role="dialog"` labelled by the title; modal `#number`
  sits beside the title at the same type size; description is in
  `Solicitação`; the box shows card `createdAt` date and time; due in
  the modal is labelled `Data e hora` and uses date and time; creator,
  assignee, priority, and tags use `Criado`, `Associado`, `Prioridade`,
  and `Tags`; modal `Editar` opens the field form;
  `Cancelar` matches `Salvar` accent; modal `Editar` uses accent;
  checklist `Editar` then `Salvar`; modal `Salvar` closes the dialog;
  comments heading is `Comentários`; comments show creation date and
  time; no modal `Capa`; attach control is `Enviar arquivo`
- AC-010: checklist CRUD and 51st item `400`
- AC-011: Tenant Admin background PUT/DELETE; Usuario and Global `403`;
  default gradient when null
- AC-012: `projects-home.spec.tsx` remains the VETOR-012 home treatment

Commands after approved delivery: frontend and backend `typecheck`,
`lint`, `test`, `build`; backend `test:e2e`; `spec-driven-development`.

## Delivery

This specification is `implemented`. A named human approved it via `/goal`
on 2026-09-21. Delivery promoted the durable decisions into
`docs/design.md`, `docs/api.md`, `openapi.yaml`, Swagger, and
`docs/database.md`.

Placement:

- Frontend: `frontend/components/projects/project-board.tsx`,
  `project-board.spec.tsx`, optional `project-files-panel.tsx` beside
  it, `frontend/lib/project-kanban.ts`, `frontend/lib/api/client.ts`
- Backend: `backend/src/modules/projects/` (entities, DTOs, guards,
  `ProjectsService`, `attachment-upload.ts`, `project-constants.ts`,
  `tenant-storage` pointer allowlist), new migration, `archiver` in
  the **backend** workspace only, `backend/test/projects.e2e-spec.ts`
- Contracts: `docs/design.md`, `docs/api.md`, `openapi.yaml`,
  `docs/database.md`

Do not add `archiver` to the root `package.json`.

## Traceability

- Source kind: `human_prompt`
- Source reference: `chat-2026-09-21-kanban-board-visual-folders`
- Request: colorful Trello-like board, rounded cards, client impact,
  files and folders
- Follow-up 2026-09-21: senior-designer colors; entrance effect; all
  listed Trello board elements; board route only; drag-and-drop;
  project folder or files; keep 5 MB and 10 per card, wider types;
  500 MB folder tree; all document actions; any board actor attaches
  with history; pt-BR copy; background only Administrador Tenant;
  card detail as modal; `#number` and title at the top of the card
  face and beside each other in the modal; `Editar` on the card face;
  comment creation date and time; labelled card attachment control;
  no card-face `Mover` / `Subir` / `Descer`; modal `Editar` for the
  field form; modal `Salvar` closes the dialog; `Solicitação` box;
  `#number` matches title size; request `createdAt` datetime; due
  datetime in the modal; `Cancelar` accent; checklist `Editar`/`Salvar`;
  no modal `Capa`; comments heading `Comentários`; modal `Editar` accent;
  modal labels `Criado`, `Associado`, `Data e hora`, `Prioridade`, `Tags`;
  card-face `#` beside title; face field labels; face `Editar` accent;
  files toolbar selected control uses accent; mobile and tablet board
  layout with horizontal lane scroll and 40px touch targets
- Visual reference: human-attached Trello screenshot (not a brand asset)
- Depends on: VETOR-012, VETOR-009 photo GET
- Conflicts with: VETOR-012 “no drag-and-drop” and JPEG/PNG/PDF-only
  attachments; `docs/design.md` single visual identity (this spec is
  the board delta to promote)
- Existing contracts consulted: `docs/product.md`, `docs/design.md`,
  `docs/api.md`, `docs/database.md`, `docs/conventions.md`,
  `tasks/specs/vetor-012-portal-project-kanban.md`,
  `tasks/specs/vetor-009-user-photo-upload-sidebar-logo.md`

## Implementation evidence

- Changed: `backend/src/modules/projects/` (entities, DTOs, guards,
  `ProjectsService`, `ProjectsController`, `CardsController`,
  `attachment-file.ts`, `attachment-upload.ts`, `document-path.ts`,
  `project-constants.ts`, `AdministradorTenantGuard`),
  `backend/src/database/migrations/1760000006000-add-board-visual-and-documents.ts`,
  `backend/src/common/swagger/examples.ts`, `backend/package.json`
  (`archiver` in the backend workspace),
  `backend/test/projects.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`,
  `backend/test/openapi-contract.spec.ts`,
  `frontend/app/globals.css`,
  `frontend/app/portal/projetos/[id]/page.tsx`,
  `frontend/components/projects/project-board.tsx`,
  `frontend/components/projects/project-files-panel.tsx`,
  `frontend/lib/project-kanban.ts`, `frontend/lib/api/client.ts`,
  `frontend/lib/portal-actions.ts`, `frontend/components/ui/modal.tsx`,
  `docs/design.md`, `docs/api.md`, `docs/database.md`, and `openapi.yaml`.
- Tests: `backend/src/modules/projects/projects.service.spec.ts`,
  `document-path.spec.ts`, `administrador-tenant.guard.spec.ts`,
  `backend/test/projects.e2e-spec.ts`, `backend/test/swagger.e2e-spec.ts`,
  `backend/test/openapi-contract.spec.ts`,
  `frontend/components/projects/project-board.spec.tsx`,
  `frontend/components/projects/projects-home.spec.tsx`,
  `frontend/components/ui/modal.spec.tsx`,
  `frontend/lib/project-kanban.spec.ts`,
  `frontend/lib/portal-actions.spec.ts`.
- Commands: `npm run typecheck` passed;
  `npm run lint` passed (two `@next/next/no-img-element` warnings on
  cover and assignee photos);
  `npm run test` passed (backend 147, frontend 123, SDD 10);
  `npm run test:e2e` passed (backend 55);
  `spec-driven-development` passed (14 specifications);
  `npm run build` passed (`/portal/projetos`, `/portal/projetos/[id]`).
- Limitations: Human validation of AC-001–AC-012 has not started. A live
  board at `/portal/projetos/{id}` was exercised in the browser (six
  lanes, rounded card face with `#number` and title first, no card-face
  `Mover` / `Subir` / `Descer`, card detail as `Modal` with Escape and
  `Fechar janela`, files panel, checklist, tenant-admin background
  control; workspace home unchanged). Docker backend `node_modules`
  volumes needed `npm ci --workspace backend` after adding `archiver`.
  `npm run docker:config` was not run. `npm run format:check` still
  fails on pre-existing files outside this delivery.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
- AC-007: not recorded
- AC-008: not recorded
- AC-009: not recorded
- AC-010: not recorded
- AC-011: not recorded
- AC-012: not recorded
