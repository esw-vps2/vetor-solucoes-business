---
id: VETOR-018
title: Kanban UI kit components
status: implemented
source_kind: human_prompt
source_reference: chat-2026-10-01-kanban-ui-kit-components
created_at: 2026-10-01
updated_at: 2026-10-01
---

# Kanban UI kit components

## Context

The requester asked for every component on one Figma page to become a
reusable frontend set. The website and the installed PWA are the same
frontend. The work is not a restyle of the portal board that VETOR-012
and VETOR-014 already deliver.

Source file:

| Field | Value |
| --- | --- |
| File | 3 Free Kanban Board App UI Kit (Community) — Copy |
| File key | `YyhLj3ZNEXMem7A9LEqd8L` |
| Page | `5773:39069`, name `🗃 Kanban` |
| URL | `https://www.figma.com/design/YyhLj3ZNEXMem7A9LEqd8L/3-Free-Kanban-Board-App-UI-Kit--Community---Copy-?node-id=5773-39069` |
| Pages in this file | This page only |
| License stated by the requester | CC BY 4.0 |

The page is six frames: three desktop boards at 1440×960 and three
matching mobile boards at 375 wide. Components appear as instances
inside those frames. This specification enumerates those components.
Anonymous `Frame` wrappers that only group siblings are layout, not
separate components, except the three board compositions, which are
the page's screens and are in scope as reusable layouts.

The current portal board is `ProjectBoardView` in
`frontend/components/projects/project-board.tsx`, with project files in
`frontend/components/projects/project-files-panel.tsx`, inside
`PortalShell`. That board does not yet render any component from this
file. Overlap of ideas (a card, a lane, an avatar, a count) does not
count as this file's component. Every component below is marked
**Create**.

Follow-up answers (2026-10-01):

1. Visible kit text is Portuguese (Brazil).
2. The components stay in the frontend. There is no new route and no
   catalog page.
3. The leadpage stays as it is. Only the kanban region of the existing
   board changes.
4. Approved board behavior remains: permissions, drag-and-drop, project
   folders, and the Portuguese copy already specified in VETOR-012 and
   VETOR-014.
5. Attribution is not shown anywhere for now.
6. Logo slots use the VETOR logo, not the slothui mark in the file.
7. The file's sample avatar and cover photos ship inside the kit.
8. The card can generate a link so a person can send it to someone else.

## Desired outcome

After approval, the frontend contains the reusable components listed in
this specification, matching the linked Figma page, with Portuguese
labels and the VETOR logo. The same React modules ship in the Next.js
app that already serves the website and the installable PWA. No new URL
is added. On `/portal/projetos/{id}`, the kanban region uses this kit
and keeps the approved board behavior. Each card can copy a link to
itself on that same page.

## In scope

- Every component found on Figma page `5773:39069`, including components
  the current portal board does not render. Each one is marked Create.
- The three board compositions, each with the desktop frame and the
  mobile frame from the file, as reusable components in the frontend.
- Feature-local visual tokens taken from that file.
- Portuguese default labels for the strings read from the file.
- VETOR logo assets in every logo slot.
- Sample avatar and cover images from the file, stored in the frontend.
- The kanban region of `/portal/projetos/{id}` rendered with the kit's
  lane and card chrome, keeping approved fields, actions, permissions,
  drag-and-drop, and project folders.
- A card control that copies a link to that card.

## Out of scope

- Approving this specification.
- Implementing code in this draft.
- Any other slothUI Community file.
- A new route, catalog page, or leadpage section.
- Replacing `PortalShell` or the portal sidebar with `KanbanAppSidebar`.
- Showing a CC BY 4.0 attribution line.
- The slothui logomark and wordmark.
- A new permission, a public anonymous link, or a new way to see a card.
- Sending the link by email, WhatsApp, or any other integration. The
  product copies the link; the person sends it.
- A new HTTP API, table, or migration.
- Changing approved lane names, card fields, modal behavior, folder
  rules, or drag-and-drop rules.
- Personas, metrics, or billing for "Go Pro".

## Acceptance criteria

- AC-001: The specification enumerates every component found on Figma
  page `5773:39069`.
- AC-002: Each component from that page that the current portal board
  does not render is in scope and marked Create.
- AC-003: The component set lives in the one frontend that serves the
  website and the PWA. No new route is added.
- AC-004: Kit labels are Portuguese (Brazil). Approved board copy from
  VETOR-012 and VETOR-014 stays on the board.
- AC-005: The source file is CC BY 4.0, as stated by the requester. No
  surface shows an attribution line.
- AC-006: Logo slots render the VETOR logo. Sample avatar and cover
  photos from the file ship in the kit.
- AC-007: The leadpage and the portal shell stay as they are. The kanban
  region of `/portal/projetos/{id}` uses the kit chrome. Permissions,
  drag-and-drop, and project folders remain.
- AC-008: A card control copies a link to that card on the existing
  board URL. Opening the link uses the board's current authentication
  and authorization.

## User experience

The visual source of this kit is the linked file. These components are
not restyled down to the current leadpage or the shared `Button` in
`frontend/components/ui/button.tsx`. Kit tokens stay feature-local to
the kanban region and to the kit components. They do not replace the
leadpage visual system. Approved delivery updates the Portal board row
in `docs/design.md` so that row cites this kit for the kanban region.
`docs/product.md` stays unchanged: UI language is already Portuguese
(Brazil), and the logo assets below are already the product logos.

### Feature-local tokens

Apply these only under a root class `kanban-ui`. The rest of the app
keeps Inter and the tokens in `docs/design.md`.

| Token | Value | Use |
| --- | --- | --- |
| Font | Plus Jakarta Sans | Kit text only |
| Title | 16px / 22px, Bold, tracking -0.112px, `#1e293b` | Card titles, nav labels |
| Body | 16px / 1.6, Regular, `#475569` | Card description, featured-card body |
| Label | 14px / 20px, Medium or SemiBold, tracking -0.084px | Meta, buttons, breadcrumbs |
| Badge | 12px / 16px, SemiBold, tracking -0.06px | Pills |
| Page title, desktop | 38px Bold, `#1e293b` | Composition headings |
| Page title, mobile | 32px Bold, `#1e293b` | Composition headings |
| Indigo | `#4f46e5` | Filled controls, selected tab, progress, links |
| Indigo soft | background `#eef2ff`, text `#4f46e5`, border `#a5b4fc` | Soft badges |
| Slate title | `#1e293b` | Primary text |
| Slate body | `#475569` | Secondary text |
| Line | `#e2e8f0` | Card, sidebar, and cover borders |
| Control line | `#cbd5e1` | Inputs, outlined icon buttons, idle tabs |
| Surface | `#ffffff` | Cards, sidebar, inputs |
| Muted surface | `#f8fafc` | Featured card, selected slim nav item |
| Rose solid | `#f43f5e`, white text | Badge tone |
| Amber solid | `#f59e0b`, white text | Badge tone |
| Slate solid | `#94a3b8`, white text | Badge tone |
| Card radius | 24px | Cards, featured card |
| Cover radius | 16px | Card images |
| Pill radius | 9999px | Buttons, badges, inputs, tabs are not pills |
| Logomark radius | 12px | Logomark |
| Card shadow | `0 4px 8px -2px rgba(23,23,23,0.1), 0 2px 4px -2px rgba(23,23,23,0.06)` | Cards |
| Logomark shadow | `0 4px 8px rgba(79,70,229,0.1)` | Logomark |
| Card padding | 12px task card, 16px launch card | |
| Card gap | 16px | |
| Avatar | 32px on cards, 40px in the default sidebar, 48px in the slim sidebar | 2px white ring when stacked |
| Avatar overlap | -8px | Avatar group |
| Progress track | 8px, `#e2e8f0`, fill `#4f46e5` | |
| Focus | 2px `#4f46e5` outline, 2px offset | Keyboard focus only |

Load Plus Jakarta Sans with `next/font/google` at weights 400, 500, 600,
700, and 800. Attach the font class on kit roots only.

Desktop compositions use the 1440-wide frames. Mobile compositions use
the 375-wide frames. At viewport width below 768px, render the mobile
composition. At 768px and above, render the desktop composition. Between
768px and 1440px, the desktop column row scrolls horizontally. Mobile
columns stack vertically with the padding shown in the mobile frames.
Do not shrink the 40px icon buttons.

The file shows no hover, empty, loading, or error art, and no motion.
Do not add an entrance animation. Keyboard focus uses the focus token
above. Honor `prefers-reduced-motion` by keeping transitions off.

### Compositions

These three layouts are components. They compose the primitives below.
Visible strings use the Portuguese defaults in this specification.
Approved board labels stay on the live board.

| Id | Composition | Desktop node | Mobile node | What the frame shows | Delivery |
| --- | --- | --- | --- | --- | --- |
| K-01 | Analytics board | `6037:30584` | `6038:51552` | Default sidebar; title; icon buttons and a filled Share button; tab group; "Sort By" plus a badge; three lanes with a kanban action button and task cards | Create |
| K-02 | Project board | `6530:141975` | `6533:183304` | Slim sidebar; breadcrumb; placeholder logo; project title; three short text buttons; tab group; one 48px-tall button; lanes titled with a dot, a count, and an icon button; task cards with a progress bar | Create |
| K-03 | Launch board | `6959:3467` | `6967:6870` | Slim sidebar; placeholder logo; title with a caret; search input; Share button; avatar group; icon tabs; four lanes with Plus and DotsThree; launch cards | Create |

Lane titles read from the file:

| Composition | Lane titles read from the file |
| --- | --- |
| K-02 | `To Do (8)`, `In Progress (2)`, `Completed (7)` |
| K-03 | `New Requests`, `Assigned`, `In Progress`, `Approved` |
| K-01 | The first lane's action button reads `25` and `In Progress`. The next reads `8` and `Reviewed` on amber `#f59e0b`. The third reads `2` and `Completed` on green `#00c345`. |

### Primitives

`Board today` is whether `ProjectBoardView` renders this component.
None of them do.

| Id | Component | Figma name | Representative nodes | Anatomy read from the file | Delivery |
| --- | --- | --- | --- | --- | --- |
| C-01 | `KanbanAppSidebar` | App Sidebar | `6037:31023` Default 312×960; `6530:141976` Slim 80×960; `6362:57194` Mobile 375×64 | Default: logo, search, seven nav rows, featured card, account row. Slim: logomark, seven icon buttons, avatar. Mobile: logo and a list icon button, bottom border | Create |
| C-02 | `KanbanLogo` | Logo | `5569:17873` | Horizontal lockup. Image is `/brand/logo_vetor.png`. Alt text `VETOR` | Create |
| C-03 | `KanbanLogomark` | Logomark | `5572:73326`, `5572:73147` | 32px tile. Image is `/brand/symbol-vetor.png`. Alt text `VETOR` | Create |
| C-04 | `KanbanSidebarItem` | `_AppSidebarItem` | inside `6037:31023` | 48px row, 24px icon, bold label, optional soft badge. Radius pill. Width 280 | Create |
| C-05 | `KanbanFeaturedCard` | Nav Featured Card | `6360:36880` | 280px, radius 24, muted surface, icon well, dismiss icon, body, two text actions | Create |
| C-06 | `KanbanInputText` | Input Text / `_InputTextBase` | sidebar search inside `6037:31023`; `6959:6085` | Pill, 40px min height, 12×8 padding, magnifying glass, placeholder | Create |
| C-07 | `KanbanTabGroup` | Tab Group | `6037:40440`, `6959:5381`, `6534:184981` | Row of tab items. Selected item: `#1e293b` text, 2px `#4f46e5` bottom border. Idle: `#475569` text, 2px `#cbd5e1` bottom border. Min height 48. Optional leading icon. Optional soft badge | Create |
| C-08 | `KanbanTabItem` | Tab Item | inside the tab groups | Label, optional icon, optional badge | Create |
| C-09 | `KanbanBreadcrumb` | Breadcrumb Link Group | `6533:177859` | Home icon button, caret separators, link items. Current item is indigo and may show a leading icon | Create |
| C-10 | `KanbanBreadcrumbItem` | Breadcrumb Link Item | inside `6533:177859` | 14px Bold label, optional 20px icon | Create |
| C-11 | `KanbanBadge` | Badge Text | task cards, tabs, sidebar, sort row, action button | Pill. Tones: soft-indigo; solid-indigo; solid-rose; solid-amber; solid-slate; white-on-indigo (the count inside the action button) | Create |
| C-12 | `KanbanButton` | Button | `6037:39463` and the unread button nodes | Filled indigo pill, 14px Bold white label, optional trailing icon, about 40px tall. Separate text-height instances are 20px tall; their fill was not read | Create |
| C-13 | `KanbanIconButton` | Button Icon | header cluster `6037:39462`, `6037:39464`, `6037:39488`; slim nav | 40px circle. Ghost, or 1px `#cbd5e1` outline. Slim nav uses 48px; the selected one uses `#f8fafc` | Create |
| C-14 | `KanbanActionButton` | Kanban Action Button | `6038:49899` via `6038:49939` | Full pill, indigo fill, white count badge, white bold label, trailing plus. Read state label: `In Progress`, count `25` | Create |
| C-15 | `KanbanTaskCard` | Kanban Task Card | `6038:49477`, `6038:50069`, `6038:49464`, `6533:182567` | White card, 1px `#e2e8f0`, radius 24, shadow. Soft badge, bold title, optional description, optional progress, avatar group, comment count with `ChatTeardropDots`, check count with `CheckCircle` | Create |
| C-16 | `KanbanLaunchCard` | Frame instances on the launch board | `6959:6602`, `6960:8118`, `6960:8218`, `6967:3957` | Same chrome as the task card with 16px padding. Optional 240px cover, radius 16. Title row with `CheckCircle`. Badge row. Optional avatar, date label, thumbs-up count | Create |
| C-17 | `KanbanAvatar` | Avatar | `5468:1032` sm 32; `5468:1033` md 40; slim account 48 | Circle image | Create |
| C-18 | `KanbanAvatarGroup` | Avatar Group | card footers; `6531:167621` | Overlapping avatars. Overflow chip is indigo soft with `+N` in ExtraBold 14 | Create |
| C-19 | `KanbanProgressBar` | Progress Bar | inside `6533:182567` | Label row (`Progress`, percent) and 8px track. Fill width matches the percent | Create |
| C-20 | `KanbanDot` | `_Dot` | `6533:183154` | 10px circle used beside K-02 lane titles | Create |
| C-21 | `KanbanPlaceholderLogo` | Placeholder Logo | `6533:177841` 96px; `6959:6236` and `6967:6892` 48px | Same VETOR symbol as `KanbanLogomark`, at 96px or 48px. The file's placeholder artwork is not used | Create |
| C-22 | `KanbanLaneHeader` | repeated lane title row | K-02 lanes; K-03 lanes | K-02: dot, title, icon button. K-03: title, `Plus`, `DotsThree` | Create |
| C-23 | `KanbanSortControl` | sort row | `6037:42611` plus badge `6037:47996` | Visible label `Sort By` and badge `Newest` | Create |

`KanbanTaskCard` slots, from the opened instances:

| Slot | Opened example |
| --- | --- |
| Badge | `Important`, `Meh` |
| Title | file sample titles |
| Description | present on K-01 cards; absent on the opened K-02 card |
| Progress | absent on K-01 cards; `0%` on `6533:182567` |
| Avatars | one image, two images, or four images plus `+3` |
| Comment count | number beside `ChatTeardropDots` |
| Check count | number beside `CheckCircle` |

`KanbanLaunchCard` slots, from the opened instances:

| Slot | Opened example |
| --- | --- |
| Cover | present at 240px tall, or absent |
| Check icon | `CheckCircle` before the title |
| Title | file sample titles |
| Badges | `Started` solid-indigo, `Ongoing` solid-indigo, `Not Started` solid-slate, `P1` solid-amber, `P2` solid-rose |
| Assignee | one avatar, or absent |
| Date label | `Dec  2 -  8`, or absent |
| Thumbs-up count | number beside `ThumbsUp`, or absent |

### Icons

Each icon below is a component used on the page. Implement it as a
local SVG in `frontend/components/kanban-ui/icons/`. Do not add an icon
library. Do not hotlink Figma asset URLs; those URLs expire.

| Id | Icon | Figma node cited by the file | Where it appears | Delivery |
| --- | --- | --- | --- | --- |
| I-01 | `MagnifyingGlass` | `5578:150571` | Search inputs; first header icon button | Create |
| I-02 | `HouseSimple` | `6041:60586` | Default sidebar Home; slim sidebar; breadcrumb home | Create |
| I-03 | `ListBullets` | `5579:151763` | Default sidebar Tasks | Create |
| I-04 | `Users` | `5579:152486` | Default sidebar Users | Create |
| I-05 | `Cube` | `5578:149018` | Default sidebar APIs | Create |
| I-06 | `CreditCard` | `5579:152024` | Default sidebar Subscription | Create |
| I-07 | `GearSix` | `5578:150325` | Default sidebar Settings; slim sidebar | Create |
| I-08 | `ChatTeardropDots` | `5577:146636`, `6041:59099` | Default sidebar Help; task-card comment count | Create |
| I-09 | `Warning` | `5579:153332` | Featured card icon well | Create |
| I-10 | `X` | `5579:151149` | Featured card dismiss | Create |
| I-11 | `SignOut` | `5578:150690` | Default sidebar account action. The export names the layer "Monotone add"; the component description and the glyph are Sign out | Create |
| I-12 | `Plus` | `5579:150992` | Header icon button; action button; K-03 lane tools | Create |
| I-13 | `ShareNetwork` | `5577:147003` | Trailing icon of the filled Share button | Create |
| I-14 | `Upload` | `5578:150733` | Header icon button | Create |
| I-15 | `CheckCircle` | `5578:149537` | Task-card check count; launch-card title | Create |
| I-16 | `ThumbsUp` | `6041:59183` | Launch-card count | Create |
| I-17 | `CaretRight` | `5577:144067` | Breadcrumb separator | Create |
| I-18 | `CaretDown` | `6959:5252` | K-03 title | Create |
| I-19 | `Sphere` | `6041:69365` | Current breadcrumb item | Create |
| I-20 | `ChartBar` | `5579:150825` | Slim sidebar | Create |
| I-21 | `User` | `5579:152448` | Slim sidebar | Create |
| I-22 | `CalendarBlank` | `5578:148815` | Slim sidebar; K-03 Calendar tab | Create |
| I-23 | `Lightning` | `5578:150457` | Slim sidebar | Create |
| I-24 | `BellSimple` | `5578:149466` | Slim sidebar | Create |
| I-25 | `List` | `5579:151720` | Mobile sidebar; K-03 List tab | Create |
| I-26 | `Columns` | `6041:67448` | K-03 Board tab | Create |
| I-27 | `HourglassSimple` | `6041:64775` | K-03 Timeline tab | Create |
| I-28 | `Check` | `5578:149504` | K-03 Progress tab | Create |
| I-29 | `DotsThree` | `6959:5769` | K-03 lane tools | Create |

Default labels are Portuguese. The English column is the string read
from the file. On the live board, an approved VETOR-012 or VETOR-014
string wins when the same control already has one.

| English in the file | Portuguese default |
| --- | --- |
| Home | Início |
| Tasks | Tarefas |
| Users | Usuários |
| APIs | APIs |
| Subscription | Assinatura |
| Settings | Configurações |
| Help & Support | Ajuda e suporte |
| Enjoy unlimited access to our app with only a small price monthly. | Tenha acesso ilimitado ao aplicativo por um pequeno valor mensal. |
| Dismiss | Dispensar |
| Go Pro | Seja Pro |
| Basic Member | Membro básico |
| Search... | Buscar... |
| Search tasks... | Buscar tarefas... |
| By Status | Por status |
| By Total Tasks | Por total de tarefas |
| Tasks Due | Tarefas a vencer |
| Extra Tasks | Tarefas extras |
| Tasks Completed | Tarefas concluídas |
| List | Lista |
| Board | Quadro |
| Timeline | Linha do tempo |
| Calendar | Calendário |
| Progress | Progresso |
| Sort By | Ordenar por |
| Dashboard | Painel |
| Project | Projeto |
| To Do | A fazer |
| In Progress | Em progresso |
| Completed | Concluído |
| New Requests | Novos pedidos |
| Assigned | Atribuído |
| Approved | Aprovado |
| Important | Importante |
| Meh | Neutro |
| Started | Iniciado |
| Ongoing | Em andamento |
| Not Started | Não iniciado |
| Share | Compartilhar |
| Grid View | Visualização em grade |
| List View | Visualização em lista |
| Column View | Visualização em colunas |
| Row View | Visualização em linhas |
| Filter | Filtrar |
| Sort | Ordenar |
| Export Data | Exportar dados |
| Reviewed | Revisado |
| Newest | Mais recentes |
| High Priority | Prioridade alta |
| Low Priority | Prioridade baixa |
| Not that important | Não tão importante |
| I don't know | Não sei |
| I guess | Acho que |
| Maybe important | Talvez importante |
| OK | OK |
| Done | Feito |
| Invite | Convidar |
| Public To All | Público para todos |
| Website Launch 2024 | Lançamento do site 2024 |

Sample personal names stay as written in the file (`Azunyan U. Wu` and
the other portrait names). Counts stay numeric.

K-01 tabs from `6037:40440`, in Portuguese: `Por status`, `Por total de
tarefas` (badge `12`, selected), `Tarefas a vencer`, `Tarefas extras`,
`Tarefas concluídas`.

K-03 tabs from `6959:5381`, in Portuguese: `Lista` (selected), `Quadro`,
`Linha do tempo`, `Calendário`, `Progresso`. The header button beside
search reads `Share`. Portuguese: `Compartilhar`, with `ShareNetwork`.

K-02 header strings read from the rendered file: `Grid View`, `List View`
(selected), `Column View`, `Row View`, `Filter`, `Sort`, and `Export Data`.
Portuguese: `Visualização em grade`, `Visualização em lista`,
`Visualização em colunas`, `Visualização em linhas`, `Filtrar`,
`Ordenar`, and `Exportar dados`. The view row is the segmented tab group.
`List View` starts selected. `Filter`, `Sort`, and the separate `Grid View`
are 20px text buttons with dark ink. `Export Data` is the filled button
with `Upload`. Opened K-02 card titles include `Machine Learning Progress`
and `User flow confirmation for fintech App`.

Breadcrumb from `6533:177859`, in Portuguese: home icon, `Painel`,
`Projeto`, then the current item. The sample current item in the file
is `Project PlanetX`; that proper name stays `Project PlanetX`.

### Unread instances

These nodes are on the page. Their component type is known. Their
sample label or artwork was not read, so this draft does not invent it.
Delivery reads the node and uses that artwork. It does not substitute a
label.

| Nodes | Component | What is unread |
| --- | --- | --- |
| `6038:50005`, `6038:50056`, `6038:52678`, `6038:52753` | `KanbanActionButton` | Desktop labels read from the rendered file: `In Progress` / `25`, `Reviewed` / `8`, `Completed` / `2`. Mobile copies of these nodes were not opened separately |
| `6037:47996`, `6038:51815` | `KanbanBadge` inside `KanbanSortControl` | Desktop badge reads `Newest`. The mobile copy was not opened separately |
| `6534:184981`, `6533:183483` | `KanbanTabGroup` | Rendered item labels: `Grid View`, `List View` (selected), `Column View`, `Row View` |
| `6531:167645`, `6531:167664`, `6531:167670`, `6533:182212`, `6533:183440`, `6533:183478`, `6533:183479`, `6533:183480` | `KanbanButton` | These node ids were not opened one by one. The rendered K-02 header shows `Grid View`, `Filter`, and `Sort` as 20px ink text, and `Export Data` as the filled button with `Upload` |
| `6959:5220`, `6959:5759`, `6967:6898` | `KanbanButton` | The rendered K-03 header button reads `Share`. The mobile copy beside search shows the same control |
| `6533:177841`, `6959:6236`, `6967:6892` | `KanbanPlaceholderLogo` | File artwork is unused. These slots render the VETOR symbol |
| Card instances on K-01, K-02, and K-03 that are not in the opened set below | `KanbanTaskCard` or `KanbanLaunchCard` | Confirm the slot combination. Add a new component only if the structure is neither card |

Opened card nodes: `6038:50069`, `6038:49464`, `6038:49477`,
`6533:182567`, `6959:6602`, `6960:8118`, `6960:8218`, `6967:3957`.

### Props and chrome

Components take labels, images, counts, and booleans as props. Default
labels are the Portuguese table above. Sample photos live under
`frontend/public/kanban-ui/` and are the default `src` for kit avatars
and covers. Live board cards keep using the assignee photo and card
cover already stored for that card.

Kit controls that are not mounted on the board accept an optional
callback and perform no navigation, filter, billing, or mutation.
`Go Pro`, search, tabs, breadcrumbs, lane menus, the launch-card check,
and thumbs-up stay inside the library.

| Control | Chrome | Result |
| --- | --- | --- |
| `KanbanButton`, `KanbanIconButton`, `KanbanActionButton` | `<button type="button">`. Icon-only buttons require `accessibleName` | Optional callback. No product action unless the board section below names one |
| `KanbanTabGroup` | `tablist` / `tab`, `aria-selected`. One item selected. Arrow keys move the selected tab | Selection stays inside the component |
| `KanbanBreadcrumb` | `<nav>` with accessible name `Trilha` | Optional callback per item |
| `KanbanInputText` | `<input type="search">`, label `Buscar` | Controlled value. It does not query the API |
| `KanbanLaunchCard` check and thumbs-up | Visual controls with optional `onChange` | They do not change a stored task |
| `KanbanProgressBar` | `progressbar`, min 0, max 100 | Displays the `value` prop |
| Sidebar rows and the mobile list button | Buttons. No `href` | No destination. The mobile frame stays the bar drawn in the file |
| Card share | `KanbanButton` labeled `Compartilhar` with `ShareNetwork` | Copies the card link. See below |
| Images | Local kit files, or the card's own photo when the board has one | Decorative kit samples use empty alt text |

`KanbanAppSidebar` variants are `default`, `slim`, and `mobile`, matching
the file's `type` and `isMobile` properties. The mobile frame shows the
bar only. This specification does not add a drawer the file does not
show. The portal keeps `PortalShell`.

### Board kanban region

Only the kanban region of `/portal/projetos/{id}` mounts the kit. The
leadpage, `/portal/projetos`, and `PortalShell` stay as they are.

The region is wrapped in the `kanban-ui` class, so Plus Jakarta Sans
applies there. The shell keeps Inter.

Lane headers use `KanbanLaneHeader` in the K-02 form: a `#4f46e5` dot,
the approved lane label, the card count in that lane, and no new menu.
The six lanes stay, in order, with their approved labels: `Backlog`,
`Pronto`, `Trabalhando`, `Revisão`, `Deploy`, `Finalizado`.

Each card uses `KanbanTaskCard` chrome (white surface, 24px radius, the
card shadow, 12px padding). When the card has a cover, the 240px cover
slot from `KanbanLaunchCard` sits on top. Approved face fields stay:

| Approved field | Kit slot |
| --- | --- |
| `#number` and title | Title row. The approved number stays beside the title |
| Tags | `KanbanBadge`, soft-indigo |
| Priority `high` / `Alta` | `KanbanBadge`, solid-rose |
| Priority `medium` / `Média` | `KanbanBadge`, solid-amber |
| Priority `low` / `Baixa` | `KanbanBadge`, solid-slate |
| Due date and time | Date label, `America/Sao_Paulo`, same format as VETOR-014 |
| Checklist count | Check count with `CheckCircle` |
| Comment count | Comment count with `ChatTeardropDots` |
| Attachment count | Count row, keeping the board's paperclip icon |
| Assignee | `KanbanAvatar` with that user's photo |
| Cover | Launch-card cover slot when a cover is set |

Drag-and-drop, the card modal, comments, checklist editing, attachments,
and `Arquivos do projeto` stay as specified in VETOR-012 and VETOR-014.
The kit does not remove those controls and does not add a second create,
edit, or delete control.

### Card link

The card face includes `Compartilhar`. Activating it writes this URL to
the clipboard, using the origin of the page the person is on:

```text
{origin}/portal/projetos/{projectId}?card={cardId}
```

`cardId` is the existing card UUID. The address is the existing board
page plus a query parameter. There is no new path.

After a successful copy, the card shows `Link copiado.` in an
`aria-live="polite"` region. If the clipboard is unavailable, the card
shows the full URL in a read-only field whose label is `Link do card`,
so the person can still copy it and send it. The product does not send
email or a message.

Opening that URL loads `/portal/projetos/{projectId}` under the current
portal session. The existing guards stay. A person who cannot open that
board still cannot open it. When the loaded board contains that card,
the existing card modal opens. When it does not, the board renders
without a modal and without a message that reveals whether the id
exists in another tenant. Closing the modal removes the `card` query
with `history.replaceState`. Refreshing while the query is present
opens the modal again.

Anyone who can already see the card can copy the link. There is no new
permission key.

## API and integrations

No new HTTP endpoint, request body, or response field.

The card link is the existing `GET` of the board page with a `card`
query parameter. The frontend already loads the board for
`/portal/projetos/{projectId}`. It reads `card` and opens the existing
modal when that id is in the payload. Existing project endpoints from
VETOR-012 and VETOR-014 stay as they are.

Kit sample images are static files. Do not request `www.figma.com` at
runtime. Fonts load through `next/font/google`.

No email, messaging, or share-sheet integration.

## Data impact

No table, column, index, or migration.

The link uses the card `id` that VETOR-012 already stores. Kit sample
images are files in `frontend/public/kanban-ui/`, not database rows.
Live assignee photos and card covers stay in their current storage.

## Security

No new authentication, authorization, session, logging, or retention
rule.

No new route. Do not weaken the guards on `/portal/projetos` or
`/portal/projetos/{id}`. The `card` query does not authorize anyone.
The existing session and board authorization still decide whether the
page loads. A link sent to a person who cannot open that board does not
grant access. The UI does not report that a hidden card id exists.

The kit must not contain secrets, tokens, or `NEXT_PUBLIC_*` values.
Icon-only controls expose an accessible name, not a hidden capability.
Hiding a control is not authorization. Backend authorization for the
board remains the authority.

Sample photographs ship as static files copied at implementation time.
Do not embed temporary Figma asset URLs. The human decided that no
surface shows a CC BY 4.0 attribution line for now. Do not add one in
the UI, the PWA, or a catalog page.

## Testing

Frontend tests use Vitest and React Testing Library, beside the
components, under `frontend/components/kanban-ui/`.

| Criterion | Check |
| --- | --- |
| AC-001 | This document's inventory matches page `5773:39069`, including the unread-instance table. `spec-driven-development` checks the specification shape |
| AC-002 | The inventory marks every row Create, and a test file exists for each primitive C-01 through C-23 and for K-01 through K-03 |
| AC-003 | Components import from `frontend/components/kanban-ui/` inside the existing Next.js app. No new `app/` route. The PWA manifest is unchanged |
| AC-004 | Kit defaults render the Portuguese table. A board test still shows `Backlog`, `Pronto`, `Trabalhando`, `Revisão`, `Deploy`, and `Finalizado` |
| AC-005 | A rendered kit component and the board page do not show an attribution string |
| AC-006 | `KanbanLogo` uses `/brand/logo_vetor.png`. `KanbanLogomark` and `KanbanPlaceholderLogo` use `/brand/symbol-vetor.png`. Kit avatar and cover defaults resolve to files under `frontend/public/kanban-ui/` |
| AC-007 | Leadpage tests stay unchanged. The board test renders kit card chrome, keeps drag-and-drop, and still shows project files. `PortalShell` is still the portal frame |
| AC-008 | Activating `Compartilhar` writes `{origin}/portal/projetos/{projectId}?card={cardId}`. Loading that URL with access opens the card modal. Loading it without access follows the existing unauthenticated or forbidden behavior. A card id outside the loaded board does not open a modal |

Component tests, when implementation is approved:

- Each primitive renders its opened slots and the tones listed above.
- `KanbanTabGroup` exposes one selected tab and moves selection with
  arrow keys.
- An icon-only button throws in the test if `accessibleName` is missing,
  by failing the accessible-name query.
- `KanbanProgressBar` exposes `aria-valuenow`.
- K-01, K-02, and K-03 render the mobile composition below 768px and the
  desktop composition at 768px and above.
- The kanban region uses Plus Jakarta Sans. The portal shell and a
  leadpage heading still use Inter.
- `Compartilhar` copies the card URL. The clipboard failure path shows
  `Link do card` and the URL.

No backend unit test and no backend e2e. This specification adds no HTTP
surface. Board behavior is covered by the existing frontend board tests
plus the card-link cases in AC-008. Do not add a public test route to
host the kit.

- AC-001: The inventory in this document matches page `5773:39069`, including the unread-instance table.
- AC-002: Every inventory row is marked Create, and `frontend/components/kanban-ui/` has a test file for each primitive C-01 through C-23 and for K-01 through K-03.
- AC-003: Components import from `frontend/components/kanban-ui/` in the existing Next.js app. No new `app/` route. `frontend/app/manifest.ts` does not reference the kit.
- AC-004: Kit defaults render the Portuguese table. The board test still shows `Backlog`, `Pronto`, `Trabalhando`, `Revisão`, `Deploy`, and `Finalizado`.
- AC-005: A rendered kit component and the board page do not show an attribution string.
- AC-006: `KanbanLogo` uses `/brand/logo_vetor.png`. `KanbanLogomark` and `KanbanPlaceholderLogo` use `/brand/symbol-vetor.png`. Kit avatar and cover files live under `frontend/public/kanban-ui/`.
- AC-007: Leadpage tests stay unchanged. The board test renders kit card chrome, keeps drag-and-drop, and still shows project files. `PortalShell` remains the portal frame.
- AC-008: `Compartilhar` writes `{origin}/portal/projetos/{projectId}?card={cardId}`. Loading that URL with access opens the card modal. Loading it without a session stays on the existing session gate. A card id outside the loaded board does not open a modal.

## Delivery

| Choice | Decision |
| --- | --- |
| App | `frontend/` only. The installed PWA is this app. Do not add a service worker or change `frontend/app/manifest.ts` |
| Folder | `frontend/components/kanban-ui/` and `frontend/components/kanban-ui/icons/` |
| Imports | Direct file imports. No barrel file |
| Client boundary | Add `'use client'` only on components that hold state or handlers: sidebar, tabs, buttons, input, launch-card controls, and the three compositions. Badge, avatar, dot, progress, logo, and icons stay free of `'use client'` |
| Shared button | Do not modify `frontend/components/ui/button.tsx` |
| Board | `frontend/components/projects/project-board.tsx` mounts kit lane and card chrome and the share control. Folder behavior stays in `project-files-panel.tsx` |
| Global contracts | This draft does not edit them. Approved delivery updates the Portal board row in `docs/design.md` to cite this kit for the kanban region. It does not edit `docs/product.md`, `docs/api.md`, `openapi.yaml`, or `docs/database.md` |
| Backend | No module, controller, DTO, entity, or migration |
| Dependencies | No new npm package and no icon library |
| Images | Copy the file's sample avatars and covers into `frontend/public/kanban-ui/` at implementation. Do not commit Figma MCP URLs. Logo slots use the existing brand files |
| Attribution | Do not render an attribution line |
| Comments | No source comments |

Implementation starts only after a named human sets `status: approved`.

Commands after an approved implementation:

```bash
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm run test --workspace frontend
npm run build --workspace frontend
spec-driven-development
```

Backend `test` and `test:e2e` are not required for this scope unless a
later delta adds HTTP.

## Traceability

| Source | Record |
| --- | --- |
| Prompt | `human_prompt`, `chat-2026-10-01-kanban-ui-kit-components` |
| Visual source | Figma file key `YyhLj3ZNEXMem7A9LEqd8L`, page `5773:39069` |
| License stated by the requester | CC BY 4.0. The human decided on 2026-10-01 that attribution is not shown for now |
| Current board | VETOR-012 and VETOR-014 remain in force for behavior, copy, permissions, drag-and-drop, and folders. This specification adds kit chrome on the kanban region and the card link |
| PWA | VETOR-008. The website and the PWA are one frontend. This specification does not change the manifest and does not add a route |
| Logo | `/brand/logo_vetor.png` and `/brand/symbol-vetor.png` |
| Human answers | Recorded in Context on 2026-10-01 |
| Approval | The human set `status: approved` and invoked `/goal` on this file on 2026-10-01 |

## Implementation evidence

- Changed: `frontend/components/kanban-ui/` (primitives C-01–C-23, icons I-01–I-29, compositions K-01–K-03), `frontend/public/kanban-ui/` (six avatars and three covers), `frontend/components/projects/project-board.tsx` (kit lane and card chrome, `Compartilhar`, `?card=`), `frontend/test/setup.ts` (Plus Jakarta Sans test double), `docs/design.md` (Portal board row).
- Tests: `frontend/components/kanban-ui/*.spec.tsx`, `frontend/components/projects/project-board.spec.tsx`, `frontend/app/portal/projetos/[id]/page.spec.tsx`.
- Commands: after the project and launch compositions were aligned to the rendered file (`Convidar`, `Feito`, `Público para todos`, and the read card counts), `npm run lint --workspace frontend` passed with five `@next/next/no-img-element` warnings, `npm run typecheck --workspace frontend` passed, `npm run test --workspace frontend` passed (207 tests), and `npm run build --workspace frontend` passed, including `/portal/projetos/[id]`. `spec-driven-development` still fails on `vetor-017-portal-login-page.md`, which is outside this delivery. An unauthenticated open of `/portal/projetos/{id}?card={cardId}` stays on the existing login gate (`Portal Vector`) and does not show the card id. With a session, the board shows the six approved lanes and `Compartilhar`. The clipboard fallback shows `Link do card` with `{origin}/portal/projetos/{projectId}?card={cardId}`. Opening that URL opens the card modal. Closing it removes the `card` query. An id outside the board does not open a modal and is not shown. After `cover-steps.jpg` was added to `Linux version update`, lint passed with the same five image warnings, typecheck passed, `npm run test --workspace frontend` passed again (207 tests), and `npm run build --workspace frontend` passed.
- Limitations: Figma MCP calls remain rate-limited. Header, sort-badge, lane-action, and card strings that were read from the rendered community file are mounted, including `Healthcare app wireframe flow`, `High Priority`, and `Low Priority`. A later read of the analytics frame also mounted `Blog Copywriting` counts `987` and `21,8k`, `High Priority` counts `108k` and `997`, `I don't know` counts `888` and `12`, `Maybe important` as `Talvez importante` with `9` and `487`, and `I guess` check `55`. The analytics board spec passed after that change. Sample card titles that were read stay in English. No attribution line is rendered. A later read of the project-board frame shows the completed lane header count `(7)` with five drawn cards; the other two titles are not in the frame, so they were not invented. The launch card `Linux version update` uses the file's portrait cover, stored as `frontend/public/kanban-ui/cover-steps.jpg`.

## Validation evidence

- AC-001: not recorded
- AC-002: not recorded
- AC-003: not recorded
- AC-004: not recorded
- AC-005: not recorded
- AC-006: not recorded
- AC-007: not recorded
- AC-008: not recorded
