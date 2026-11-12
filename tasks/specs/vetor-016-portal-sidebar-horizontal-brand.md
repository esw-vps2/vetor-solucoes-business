---
id: VETOR-016
title: Portal sidebar horizontal brand lockup
status: in_review
source_kind: human_prompt
source_reference: chat-2026-09-21-portal-sidebar-horizontal-brand
created_at: 2026-09-21
updated_at: 2026-09-21
---

# Portal sidebar horizontal brand lockup

## Context

Authenticated portal chrome renders `PortalBrand` at the top of the navy
sidebar in `frontend/components/layout/portal-shell.tsx`. The selected node
is that block: a centered column, 240px wide inside the `w-72` sidebar
(`px-6`), currently 96px tall. It shows `/brand/symbol-vetor.png` on a white
rounded tile and, below the tile, the HTML caption `Vector Software
Engineer`.

The requester asked to adjust that logo so the artwork sits on the left and
the caption sits on the right. The prompt spells the caption as
`vector sogtware enginner`. On 2026-09-21 the requester confirmed both
readings: the caption stays exactly `Vector Software Engineer`, and the
artwork is the symbol already in this block, `/brand/symbol-vetor.png`.
No new brand name and no new asset file.

VETOR-009 is `implemented`. It composes this lockup in the layout (symbol
plus HTML caption, not a new PNG) and places it where the person's photo
and name used to be. This draft changes only the axis of that composition.
Photo upload, the header session chip, navigation, theme toggle, and the
public leadpage stay as already specified.

## Desired outcome

On every authenticated portal screen that uses the sidebar, the brand block
is one horizontal row: the existing VETOR symbol on the left, and
`Vector Software Engineer` on the right of that symbol. The caption stays
HTML text. The rest of the portal shell is unchanged.

## In scope

- Recompose `PortalBrand` from a centered column into a horizontal row.
- Keep the existing symbol file `/brand/symbol-vetor.png` on its white
  rounded tile.
- Keep the caption `Vector Software Engineer` as HTML text to the right of
  the tile.
- Apply the same row in the mobile overlay sidebar and the desktop sidebar,
  because both render `PortalBrand`.
- On approved delivery, replace the stacked-lockup sentence in
  `docs/design.md` with this horizontal lockup.

## Out of scope

- A new image file, a baked caption PNG, or the wordmark files
  `logo_vetor.png` and `logo_vetor_dark.png`
- Changing the caption words, the image `alt`, or adding a link on the
  lockup
- The main-header name, photo, and tenant line
- Leadpage, favicon, and social image
- Sidebar navigation, theme pill, `Sair`, and page content
- API, persistence, and authentication changes

## Acceptance criteria

- AC-001: The sidebar brand block shows `/brand/symbol-vetor.png` on the
  left and the text `Vector Software Engineer` on the right, in one
  horizontal row. The caption is outside the PNG.
- AC-002: The person's photo, name, and tenant are not in that brand block.
  The wordmark logo is not shown under or beside the lockup.
- AC-003: The same row appears when the sidebar is the mobile overlay and
  when it is the static desktop sidebar. Light and dark portal themes both
  keep the navy sidebar, the white tile, and the white caption.
- AC-004: Header session chip, navigation, theme pill, leadpage brand, and
  the brand asset files are unchanged.

## User experience

The lockup stays inside the existing navy sidebar (`bg-navy`, `w-72`,
`px-6`, `py-8`). Content width remains 240px. The sidebar is an overlay
below `lg` and static from `lg`. Both states use this row.

Composition, decided for this screen:

- Root: `flex w-full flex-row items-center gap-3 text-left`. This replaces
  `flex flex-col items-center text-center`.
- The mark and the caption sit side by side with a 12px gap (`gap-3`), the
  same spacing the stacked lockup used vertically (`mt-3`). They are not
  pushed to opposite edges of the 240px row.
- Symbol tile is unchanged: 64px (`h-16 w-16`), `rounded-2xl`, `bg-white`,
  `p-1.5`, image `object-contain`. The tile stays white so the color symbol
  stays readable on navy in both portal themes. Do not swap in the wordmark
  or `logo_vetor_dark.png`.
- Caption: `text-sm leading-5 font-medium text-white`, left aligned, with
  `min-w-0` and `text-balance` so it wraps in the remaining width (about
  164px) beside the tile. Drop `mt-3` and `max-w-[11.5rem]`.
- The row is vertically centered (`items-center`). Expected height is the
  64px tile when the caption wraps to two lines.
- DOM order is image, then caption, matching left-to-right reading order.
- The image `alt` stays `VETOR`. The lockup is not a control and has no
  focus ring.
- Do not bake the caption into a new PNG.

On approved delivery, replace the portal-dashboard lockup sentence in
`docs/design.md` with: the sidebar top chrome is a horizontal lockup, the
VETOR symbol (`/brand/symbol-vetor.png`) on a white rounded tile at the
left, and the HTML text `Vector Software Engineer` to the right of the
tile, outside the PNG. Do not stack the wordmark under that lockup.

## API and integrations

No HTTP change. Swagger, `openapi.yaml`, and `docs/api.md` stay unchanged.

## Data impact

No persistent-model change. No migration. The symbol file is the existing
static asset `frontend/public/brand/symbol-vetor.png`.

## Security

No new security policy was requested. This change does not add a route,
change who can open the portal shell, collect data, or log anything. The
symbol remains the existing public static file. Existing portal
authentication still gates the sidebar.

## Testing

Frontend component test only, in
`frontend/components/layout/portal-shell.spec.tsx`, after approved
delivery:

- AC-001: the brand group renders an image with accessible name `VETOR`
  before the text `Vector Software Engineer`, and the group is a horizontal
  row (`flex-row`, `items-center`, `text-left`)
- AC-002: that group does not render the session person's name or a
  wordmark image
- AC-003: the shell still renders one `PortalBrand` for the sidebar, so the
  overlay and the static sidebar share the row; the sidebar surface stays
  `bg-navy` with a white caption
- AC-004: existing shell tests for navigation, theme pill, and header
  session chip still pass; no leadpage or brand-file assertion changes

Commands after approved delivery:

- `npm run typecheck --workspace frontend`
- `npm run lint --workspace frontend`
- `npm run test --workspace frontend`
- `npm run build --workspace frontend`
- `spec-driven-development`

No backend unit or e2e test. Product behavior stays unchanged until a named
human sets `status: approved`.

## Delivery

Frontend chrome plus the design-contract sentence above. Implementation
starts only after a named human sets `status: approved`.

Files expected on delivery:

- `frontend/components/layout/portal-shell.tsx` (`PortalBrand` only)
- `frontend/components/layout/portal-shell.spec.tsx`
- `docs/design.md` (portal dashboard lockup sentence)

Do not edit VETOR-009 in place. This specification, once approved, replaces
only the stacked composition in VETOR-009 AC-003 and in `docs/design.md`.
The rest of VETOR-009 stays in force.

## Traceability

- Request: `source_kind: human_prompt`,
  `source_reference: chat-2026-09-21-portal-sidebar-horizontal-brand`
- Selected node: `PortalBrand` in the portal sidebar
  (`div.flex.flex-col.items-center.text-center`), visible text
  `Vector Software Engineer`
- Prior lockup: `tasks/specs/vetor-009-user-photo-upload-sidebar-logo.md`,
  `docs/design.md` portal dashboard
- Follow-up 2026-09-21: caption remains `Vector Software Engineer`; artwork
  remains `/brand/symbol-vetor.png`

## Implementation evidence

- Changed: Not recorded. Implementation has not started.
- Tests: Not recorded. Implementation has not started.

## Validation evidence

- AC-001: Not recorded. Human validation has not started.
- AC-002: Not recorded. Human validation has not started.
- AC-003: Not recorded. Human validation has not started.
- AC-004: Not recorded. Human validation has not started.
