# Design contract

This document records durable, project-wide visual decisions. It is optional
until the project adopts a visual system or approved design reference.

Feature-specific screen behavior, states, and acceptance criteria live in the
approved specification under `tasks/specs/`. Promote a decision here only when
it changes the shared visual system, a reusable component, or a global asset.

Source for this visual system: the implemented leadpage. The layout structure
follows the public ClikSofthouse landing pattern. Brand tokens, copy, and
assets remain VETOR. There is no Figma file.

## Relationship to specifications

- Read the approved feature specification before implementing visual work.
- Use this document for shared tokens, primitives, assets, and cross-feature
  accessibility decisions.
- Agents decide layout, tokens, composition, and visual states as senior
  engineers without asking. Follow this contract and the implemented UI.
- When a visual choice repeats or becomes shared, promote it here in the same
  delivery so the pattern consolidates as the product grows.
- Do not invent branding, marketing sections, or a second visual identity.
  Copy, claims, and brand assets remain product decisions.
- Approved delivery may update this contract when it changes a durable visual
  decision.

## Design reference

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Figma URL    | None. The extracted leadpage is the source |
| File key     | —                                          |
| Primary node | —                                          |
| Design owner | Anderson Araujo                            |

Implement confirmed visual behavior from this contract. Extend shared tokens
and primitives when a new surface needs them. Do not invent a second visual
identity or reuse third-party product brands.

## Screens and composition

| Screen or component  | Route or context                 | Reference                                                                                        | Status    |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ | --------- |
| Header               | Fixed on the leadpage `/`        | `Header`                                                                                         | Approved  |
| Header contact       | Header `Fale conosco` on `/`     | Same WhatsApp click-to-chat URL as `WhatsAppContact`                                             | Approved  |
| Portal access        | `https://vps2.com.br/login`      | `PortalLoginPage`                                                                                | Approved  |
| WhatsApp contact     | Fixed overlay on `/`             | `WhatsAppContact`                                                                                | Approved  |
| Portal landing       | `/portal`                        | `PortalPage`, `PortalShell`                                                                      | Approved  |
| Portal reports       | `/portal/relatorios`             | `RelatoriosView`, `PowerBiEmbedViewer`                                                           | Approved  |
| Portal projects      | `/portal/projetos`               | `ProjectsHome`                                                                                   | Approved  |
| Portal board         | `/portal/projetos/{id}`          | `ProjectBoardView`; the kanban region uses the VETOR-018 kit in `frontend/components/kanban-ui/` | Approved  |
| Portal finance       | `/portal/financeiro`             | `FinanceHome`                                                                                    | Approved  |
| Portal Power BI      | `/portal/powerbi`                | `PowerBiAdmin`                                                                                   | Approved  |
| Portal administrator | `/portal/administrador`          | `TenantMfaSettings`                                                                              | Approved  |
| Portal register      | `/portal` create and edit modals | `PortalRegisterForm`, `PortalEditUserForm`                                                       | Approved  |
| Portal password      | `/portal/change-password`        | `ChangePasswordForm`                                                                             | Approved  |
| Hero                 | `/` first section                | `Hero`, `HeroCanvas`, `HeroFlow`                                                                 | Approved  |
| Manifesto            | `/` after Hero                   | `Manifesto`                                                                                      | Approved  |
| Vector trail         | `/#processo` (Manifesto method)  | `VetorTrail`                                                                                     | Approved  |
| Capabilities         | `/#servicos`                     | `Services`                                                                                       | Approved  |
| Origin               | `/#origem`                       | `Origin`                                                                                         | Approved  |
| Projects             | `/#projetos`                     | `Projects`                                                                                       | Approved  |
| Impact               | `/` after Projects               | `Impact`                                                                                         | Approved  |
| Final CTA            | `/#contato`                      | `FinalCTA`                                                                                       | Approved  |
| Footer               | End of `/`                       | `Footer`                                                                                         | Approved  |
| Button               | Shared CTA primitive             | `Button`                                                                                         | Approved  |
| Client profile       | Not composed on `/`              | `ClientProfile`, `SocialProof`                                                                   | Extracted |
| Differentiator       | Not composed on `/`              | `Differentiator`                                                                                 | Extracted |
| Process              | Extracted; not composed on `/`   | `Process`                                                                                        | Extracted |
| Provocative          | Not composed on `/`              | `Provocative`                                                                                    | Extracted |

### Page rhythm

Dark and light bands follow a product-landing cadence:

| Order | Section      | Surface color                             |
| ----- | ------------ | ----------------------------------------- |
| 1     | Hero         | Navy with grid, metric strip at the end   |
| 2     | Manifesto    | Off-white, centered intro                 |
| 3     | Vector trail | Navy                                      |
| 4     | Capabilities | Off-white, centered intro                 |
| 5     | Origin       | Navy with 2x2 cards                       |
| 6     | Projects     | Off-white, alternating showcases          |
| 7     | Impact       | Navy, centered intro, white outcome cards |
| 8     | Final CTA    | Off-white wrapping a navy card            |
| 9     | Footer       | Navy                                      |

### Portal dashboard

Authenticated `/portal` uses a white left sidebar in light mode and a navy
equivalent in dark mode, with an off-white main area in light mode, Inter, and
VETOR color tokens. Below `lg` the sidebar is a hamburger overlay. From `lg`
the sidebar stays visible. Sidebar top chrome uses the approved VETOR symbol
asset (`/brand/symbol-vetor.png`) on the left and centered HTML text
`VETOR` with `BUSINESS & TECHNOLOGY` on a white rounded surface. The main header keeps the
section title on the left. On the right, one line shows the working tenant
`name` in `text-sm` semibold navy, or white in dark mode, truncated and not
forced uppercase, beside a 40px circle. That circle is the working tenant
photo, covering the circle. With no photo, the circle shows accent initials:
the first letter of the first two words, or the first two letters of a single
word, with the tenant name as the accessible name. It does not use the
person's photo or `/brand/symbol-vetor.png`. The person's name and photo stay
in the sidebar footer. The footer subtitle is `cargo` only. An empty `cargo`
omits that line. Profile labels are not shown there. Tenant `slug`
is not shown in the chrome. Email and profile chips are not shown. `Painel`
uses a custom grid SVG. `Sair` stays at the bottom of the sidebar and opens `/login` on the current origin. The
sidebar has no light or dark mode control, and the authenticated shell stays
on the off-white light surface. The public leadpage is unchanged.
`Cadastro` is a sidebar navigation item visible to every
authenticated profile. `Suporte` sits immediately below `Cadastro`, is
visible to every authenticated profile, and opens `/portal/chamados`.
`Agente` (`/portal/vetor-agent`) sits immediately below `Suporte` when
the session includes `vetorAgent` and opens in the main column.
`Abrir chamado` uses the same white dialog as `Novo card`: white surface,
navy text, `border-navy/10`, no `Fechar janela`, and accent `Salvar` with
`Cancelar`. The fields sit in the same bordered form panel. `Prioridade`
uses the card priority select, default `Baixa`, then `Média` and `Alta`.
`Anexar` uses the same labelled file input, allowlist, and 5 MB hint as
`Novo card`. Pasting an image into the form adds it to that file list.
The ticket screen lists attachments with `Enviar arquivo` and accepts a
pasted image as an attachment. Priority appears as the same colored chip
used on the board.
Sidebar navigation items, including `Cadastro`,
use `cursor-pointer`. Selecting it replaces the main area with a
`Cadastro` section, including when the actor is on another portal route
and returns to `/portal`. The section presents create, edit, `Configurar Perfil`,
`Cadastrar tenant`, and `Alterar foto da tenant` action cards. A divider separates the section heading from the
cards. Icon and label sit centered inside each card. Each card opens a
modal. Icons are custom inline SVG. `Configurar Perfil` uses a user
silhouette with a gear and opens a modal titled `Perfil`. A successful
`Salvar` closes that modal. The create, edit, tenant, and tenant-photo modals close the
same way after a successful save. `Administrador`
and `AdministradorTenant` see the profile card. `Cadastrar tenant` uses a
building/company mark and is shown only to `Administrador`. `Alterar foto da tenant`
uses an image-frame mark, is shown only to `Administrador`, and opens a modal
with a required `Tenant` select and a required `Foto`. Replacing the working
tenant's photo reloads the session so the header circle updates. A `Usuario` without `createUser`
sees only the edit card. A `Usuario` with `createUser` also sees
`Cadastrar usuário`. Create uses an optional `Foto` image control
instead of a photo URL field. The file picker accepts any image type. `Administrador` chooses `Perfil` on
create: `Usuário`, `Administrador Global`, or `Administrador Tenant`.
`Editar usuário` shows the same `Tenant` select, labeled `Tenant`, with
options `{name} ({slug})` and placeholder `Selecione`, only for
`Administrador`. It sits after `E-mail` and starts on the loaded user's
home tenant.
`Perfil` still presents checkboxes for `Painel`, `Relatórios`, `Cadastrar usuário`,
`Editar usuário`, `Projetos`, `Gerenciar projetos`, `Mover cards`,
`Criar raia`, `Alterar nome da raia`, `Excluir raia`, and `Tenant`.
Administrador Global can select those checkboxes for `Usuário` and
`Administrador Tenant`. `Tenant` is omitted for `Administrador Tenant`.
`Administrador Global` keeps every checkbox selected.
`Painel` is shown only when that permission is selected. `Relatórios`
(`/portal/relatorios`) is shown only when the `Relatórios` permission is
selected. Unchecking either one hides that screen.
`Administrador` also sees `Financeiro` as a parent button with a custom
ledger SVG, after `Relatórios` and before `Power BI`. The button toggles
`aria-expanded` and is not a link. The child list is the existing indented
`ul`. Order is `Contratos`, then `Custos e Despesas`. Neither child has an
icon. `Contratos` links to `/portal/financeiro` and is current only on that
route. `Custos e Despesas` links to `/portal/financeiro/despesas` and is
current on that route and its create, detail, and edit pages. The shell
heading follows the current child. The tree starts expanded only on a
Financeiro route, so the current child is visible. On every other route,
including Power BI, it stays collapsed until the Financeiro button is
clicked. Choosing Power BI does not open the child list. Search
keeps the parent when the query is contained in `financeiro`, `contratos`,
or `custos e despesas`, and a child match stays visible when the tree is
collapsed. `Power BI` (`/portal/powerbi`) follows that parent.
`Administrador` (`/portal/administrador`) sits after `Power BI` and before
`Cadastro`, with a custom gear SVG. The heading is `Administrador`. Its
`MFA` section lists every tenant on a white catalog row: the name, the slug
in parentheses, and a bordered switch labeled `Habilitado` or `Desabilitado`.
`Projetos` (`/portal/projetos`) follows `Agente` when that item is
shown, and follows `Suporte` otherwise, when the actor has `viewProjects`
(by profile or grant) and uses a custom board/columns SVG.
Created projects appear under that item as a tree: each workspace name,
then its project links to `/portal/projetos/{id}`. The open project is the
current page in that tree. The board route is `/portal/projetos/{id}`. The `Contratos` screen lists
every tenant's projects. The `Custos e Despesas` screen lists the company
operating ledger: period, category, subcategory, status, supplier, type, and
project filters; four summary cards; a table with server sort and pages of
20; and create, detail, and edit pages. The first row is `Período`, `Categoria`, and `Status` as white cards beside
the accent `Nova despesa` pill. Cards are white, `rounded-2xl`, with
a navy/10 border, a 2px accent top, and a decorative mark on the right.
`Pagas` states `Data de pagamento`. Status is a tinted pill.
Content width is `max-w-[1440px]`. A `Tenant` select starts at `Todas` and filters
the table without calling `PATCH /api/v1/auth/session`. Financeiro uses a
responsive `1440px` content cap on wide screens while preserving portal
gutters and horizontal table scrolling on narrow screens. Each project row
also exposes `Arquivos do projeto`, which opens a viewport-capped shared modal
with the selected tenant, workspace, and project context, a compact document
list, authenticated `Baixar` controls, and a labelled `Enviar arquivo`
control. The modal uses internal scrolling and does not expose filesystem
paths. `Novo Projeto`
and a project row open a modal for the contract, contract value,
installment amounts and due dates, read-only `Valor pago` and `Valor Pendente`,
named cost lines, and PDF. The list shows `Valor Pendente` after the amount
received, then the installment count. The totals strip shows contract, paid,
`Valor Pendente`, and cost. When a specific tenant is selected,
`Nova anotação` sits beside `Novo Projeto` and title-only post-it notes
render below the totals and project table.
Those screens use the same navy sidebar, off-white
or dark main area, Inter, and VETOR tokens.
Report cards use a custom inline SVG, not the stored `icone` string as an
icon-library glyph. `powerbi-client` and `powerbi-client-react` are an
embed-SDK exception to “do not add another UI or icon library”; they are not
a general component or icon kit. Do not add Lucide, Radix, or shadcn.

`ProjectsHome` lists workspaces and projects for the session tenant. Global
sees selector `Tenant` with placeholder `Selecione um tenant`. Empty copy is
`Nenhuma workspace neste tenant.` and `Nenhum projeto nesta workspace.`
Create, rename, and delete controls (`Nova workspace`, `Novo projeto`,
`Salvar`, `Excluir`, `Cancelar`) appear for Global and Tenant Admin only.
The project name is a link to `/portal/projetos/{id}`. `ProjectBoardView`
shows the project name from the board payload as the board heading, then a
toolbar and a persistent filter row for status, date, and task completion.
The toolbar uses the Kanban kit for `Share`, project-file upload, and
`Novo card`. Six columns use labels `Backlog`, `Pronto`,
`Trabalhando`, `Revisão`, `Deploy`, and `Finalizado`. Those labels and colors
are the default lane set. `Criar raia`, `Alterar nome da raia`, and
`Excluir raia` are profile permissions. Administrador Global has them by
default. Another user sees a control only when that permission is granted.
An empty lane is renamed by clicking its name in the pill and removed with
the minus control beside the add control. `Nova raia` adds a lane. A lane
that contains a card cannot be renamed or deleted. A workspace manager can
drag any lane pill to a new position. Every lane on a board uses a different color. A new lane takes the
first unused color from the twelve-color lane palette. A default lane keeps
its canonical color when a stored color is repeated. Empty lane copy is
`Nenhum card.` Actors with `moveCards` drag cards with HTML5 drag-and-drop.
Each lane is an open column. Its header is a rounded pill in that lane's
accent: a white count chip, the lane name, and the add control. An empty
lane whose user has `Excluir raia` also shows a minus control beside the
add control. The pill is the drag handle for reordering lanes. Cards are
white, rounded, and lightly shadowed. A card face shows `#number` and the
title on one line. Tags are not collected on the card form and are not shown
on the face. The description stays in the card dialog. The footer places the
assignee photo on the left and, on the right, the due date, comment count,
attachment count, and priority as colored text: `Baixa` blue, `Média` yellow,
and `Alta` red.
Those field names stay available to assistive technology.
They do not show `Mover`, `Subir`, or `Descer`. The title control opens the
shared `Modal` (`role="dialog"`, Escape and overlay dismissal, `Fechar janela`).
Face `Editar` uses accent and opens the same white dialog as `Novo card`,
filled with the card. Saving that dialog updates the card, including checklist
additions and removals. The dialog is capped to the
viewport and scrolls internally. In the modal, `#number`
sits beside the title at the same type size; the description is a
labelled `Solicitação` box with the card creation date and time; due
in the modal is labelled `Data e hora` and uses the same datetime
format; creator, assignee, and priority use `Criado`, `Associado`, and
`Prioridade`. The dialog dates are `Data início` and `Data fim`. `Editar` opens the field
form. The new-card dialog uses a white surface and has no `Fechar janela` control. Its fields are `Título`,
`Associado`, `Descrição`, `Checklist`, `Data início`, `Data fim`, and
`Prioridade`, with `Anexar` beside priority. Checklist items are typed under
`Descrição` with `Novo item` and created after the card exists. `Data início` is stored as `startsAt` and `Data fim`
as `dueAt`. A start later than the end is rejected. `Cancelar` in that form uses the same accent as `Salvar`;
modal `Editar` uses accent; `Salvar` closes the dialog; checklist items
have `Editar` then `Salvar`; comments heading is `Comentários`; the
modal has no `Capa` section; comments show creation date and time; card
attachments use labelled `Enviar arquivo` (hidden native `multiple` file input;
each file at most 5 MB).
Board copy includes `Novo card`, `Editar`, `Excluir`, `Comentar`,
`Salvar`, `Arquivos do projeto`, and `Fundo do board` as recorded. The
shared `Modal` stays inside the viewport and scrolls internally. In
`Arquivos do projeto`, the selected toolbar control uses accent. Each file
has `Visualizar`. PDF and photo files open in a preview dialog centered on
the screen and sized to the available viewport. Any other
file shows that it is not enabled for viewing and that only PDF and photos
are enabled. Document rows do not show `Mover`. Portal
`main` uses tight gutters on small screens and `overflow-x-hidden`; the
board canvas scrolls horizontally and each lane scrolls vertically.
Primary board controls are at least 40px tall. Count
and due marks use custom inline SVG. No icon library.

### Vetor Agent workspace

Authenticated `/portal/vetor-agent` renders inside the portal shell. The
portal sidebar stays on the left. The shell heading is `Inteligência Artificial`.
The sidebar item is `Agente`. The
shell main for this route has no page padding and does not scroll as a
document. The workspace fills that main column on an `off-white` field. From
`md` the field uses the dialog inset (`px-4 py-8`). The workspace card uses
the light dialog surface: `bg-white`, `text-navy`, `border-navy/10`,
`shadow-2xl`, square corners below `md`, and `rounded-[28px]` from `md`.
The conversation sidebar is the same white surface with a `navy/10` divider
and sits inside the card, to the right of the portal sidebar. The transcript
column uses a `navy/10` border so the text width stays visible. Each message
uses the same border. A user question uses the accent fill (`#BDDA2B`) with
navy text and a `Reprocessar` control that sends that question again. The
assistant label is `Vetor`. The composer uses a `28px` radius and `p-6`.
Its writing field is an off-white inset with a `navy/20` border, placeholder
`Digite o prompt`, and a taller minimum height. With no selected conversation,
or with an empty ready conversation, the prompt column stays blank and the
composer sits in the vertical center. After the first message it eases to the
bottom over 700ms with the shared easing, and the transcript fades in. That
motion is removed when reduced motion is requested. Secondary copy uses
`text-dark-secondary`. `Novo chat` and `Enviar` use the accent fill with
navy text.
The workspace does not repeat the VETOR wordmark, the page title, or
`Voltar ao portal`. Icons are custom inline SVG. Focus uses
`focus-visible:ring-2` and `ring-accent`. Interactive targets are at least
`40px` tall.

Below `lg` the conversation sidebar is closed. `Abrir conversas` in the
prompt column opens it over the main column only, on a `navy/80` blurred
scrim, and `Fechar conversas`,
`Dispensar conversas`, or Escape closes it. From `lg` the conversation
sidebar stays beside the prompt area. The workspace uses `overflow-x-hidden`
and fills the main column height. Any transform transition on the sidebar
is removed when `prefers-reduced-motion` is set. The composer sends the
message to the authenticated AI API. Enter submits the current draft.
Shift+Enter inserts a line break. User messages preserve line breaks.
Assistant messages render sanitized Markdown, including lists, emphasis, links,
and fenced code blocks, inside the existing `text-navy` body styles. While a
run is waiting for the first fragment, and while fragments are still arriving,
the agent row shows a pulse that is removed when reduced motion is requested.
Incoming fragments stay plain text so the transcript keeps growing; Markdown
is applied to the persisted message after the run ends. The transcript follows
the latest content. Visible
states use `Carregando...`,
`Nenhuma conversa ainda.`, `Na fila...`,
`Processando...`, `Reconectando...`, `Resposta recuperada.`,
`Não foi possível concluir a operação.`, and `Tentar de novo`. The status
line is polite live text and does not announce every fragment. A
session without `vetorAgent` sees `Você não tem acesso ao Vetor Agent.` on
the off-white shell surface in that same main column.

## Visual system

| Decision           | Value                                                                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography         | Inter (`100–900`, italic included). Fallback: `system-ui, -apple-system, sans-serif`                                                                                                                                                   |
| Color tokens       | Tailwind `@theme` tokens below                                                                                                                                                                                                         |
| Spacing and radius | General content max width `1320px`; Financeiro project content max width `1440px`. Page gutters `24 / 40 / 56px`. Cards `20–24px`. Buttons pill.                                                                                       |
| Icons              | Custom inline SVG. No icon library. Recurring mark: northeast arrow                                                                                                                                                                    |
| UI primitives      | `Button` (`primary`, `secondary`, `ghost`, `inverse` × `md`, `lg`). Pill eyebrows. Feature rows. Window frames. Cards.                                                                                                                 |
| Modal              | Accessible light dialog with `bg-white` and `text-navy`, focus return, Escape and overlay dismissal, full-screen mobile, a `md:max-w-xl` form width, and viewport-capped internal scroll (`max-h-dvh`, `md:max-h-[calc(100dvh-4rem)]`) |
| Motion             | `framer-motion`. Shared easing `[0.16, 1, 0.3, 1]`. Honor `prefers-reduced-motion`.                                                                                                                                                    |

Tailwind CSS is the styling system. `framer-motion` is required for the
extracted leadpage motion. Do not add another UI or icon library.

### Color tokens

| Token                   | Value                       | Use                             |
| ----------------------- | --------------------------- | ------------------------------- |
| `navy`                  | `#060B18`                   | Default page background         |
| `navy-50`               | `#0A1020`                   | Footer background               |
| `navy-100`              | `#0E1628`                   | Primary button text             |
| `navy-200`              | `#141E35`                   | —                               |
| `navy-300`              | `#1A2844`                   | Scrollbar thumb                 |
| `navy-400`              | `#243556`                   | —                               |
| `accent`                | `#BDDA2B`                   | Brand lime, CTAs, active states |
| `accent-hover`          | `#A9C425`                   | Accent hover                    |
| `accent-soft`           | `rgba(189, 218, 43, 0.08)`  | Soft accent wash                |
| `board-lane-backlog`    | `#64748B`                   | Kanban Backlog accent           |
| `board-lane-ready`      | `#3D9CF0`                   | Kanban Pronto accent            |
| `board-lane-working`    | `#F5A524`                   | Kanban Trabalhando accent       |
| `board-lane-review`     | `#7B6CFF`                   | Kanban Revisão accent           |
| `board-lane-deploy`     | `#2EC4B6`                   | Kanban Deploy accent            |
| `board-lane-done`       | `#BDDA2B`                   | Kanban Finalizado accent        |
| `board-lane-rose`       | `#E85D8C`                   | Extra lane accent               |
| `board-lane-coral`      | `#FF6B4A`                   | Extra lane accent               |
| `board-lane-green`      | `#16A34A`                   | Extra lane accent               |
| `board-lane-magenta`    | `#D946EF`                   | Extra lane accent               |
| `board-lane-royal`      | `#1D4ED8`                   | Extra lane accent               |
| `board-lane-bronze`     | `#B45309`                   | Extra lane accent               |
| `board-label-lime`      | `#BDDA2B`                   | Board tag                       |
| `board-label-sky`       | `#3D9CF0`                   | Board tag                       |
| `board-label-pink`      | `#E85D8C`                   | Board tag                       |
| `board-label-amber`     | `#F5A524`                   | Board tag                       |
| `board-label-violet`    | `#7B6CFF`                   | Board tag                       |
| `board-label-teal`      | `#2EC4B6`                   | Board tag                       |
| `board-label-coral`     | `#FF6B4A`                   | Board tag                       |
| `board-label-navy`      | `#1A2844`                   | Board tag                       |
| `board-due-overdue`     | `#E24B4A`                   | Due date overdue                |
| `board-due-today`       | `#F5A524`                   | Due date today                  |
| `board-due-future`      | `#4A5267`                   | Due date after today            |
| `board-priority-low`    | `#2EC4B6`                   | Priority chip                   |
| `board-priority-medium` | `#F5A524`                   | Priority chip                   |
| `board-priority-high`   | `#E24B4A`                   | Priority chip                   |
| `off-white`             | `#F8F9FC`                   | Light section background        |
| `warm-gray`             | `#F1F3F8`                   | Reserved light surface          |
| `glass`                 | `rgba(255, 255, 255, 0.04)` | Dark glass fill                 |
| `glass-border`          | `rgba(255, 255, 255, 0.06)` | Dark glass border               |
| `text-primary`          | `#F0F2F7`                   | Primary text on navy            |
| `text-secondary`        | `#8892A6`                   | Secondary text on navy          |
| `text-muted`            | `#505B70`                   | Muted text on navy              |
| `text-dark`             | `#0D1321`                   | Primary text on off-white       |
| `text-dark-secondary`   | `#4A5267`                   | Secondary text on off-white     |

Accent gradient stops used in headlines: `#BDDA2B` → `#D4E85A` or `#8BB020`.
Ambient glows also use `rgba(80, 120, 200, 0.04)`.
The live project board has no default canvas fill. Lanes sit on the page
surface as accent pills and white cards. An uploaded board image still
covers that region. `board-lane-raised` remains the
extruded volume for kit demonstration boards. Board entrance motion: canvas fade
400ms; lanes stagger from `x: 24` at 70ms; in-view cards fade up `y: 12`
at 20ms; shared ease `[0.16, 1, 0.3, 1]`. Reduced motion disables stagger
and decorative transforms.

Selection color: `rgba(189, 218, 43, 0.2)` on white text.
Body default: navy background, `text-primary`, antialiased Inter.
Smooth scroll is enabled on `html`.
Film grain uses one separated color per surface: light specks
(`text-primary`) with overlay blend on navy, and dark specks (`navy`)
with multiply blend on off-white. Do not overlay mixed grayscale noise.

### Type scale

| Role              | Treatment                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| Display / hero    | `clamp(2.6rem, 6vw, 5rem)`, semibold, line-height `1.05`, tracking `-0.035em` |
| Section title     | `clamp(2rem, 4.5vw, 3.5rem)` to `clamp(2.2rem, 5vw, 4rem)`, semibold          |
| Eyebrow           | `0.65–0.7rem`, semibold, uppercase, tracking `0.3em`, accent                  |
| Body on dark      | `1–1.05rem`, `text-secondary`, line-height `1.75–1.85`                        |
| Body on light     | `0.95–1.02rem`, `text-dark-secondary`                                         |
| Mono / step index | Small Inter mono-style tracking, accent                                       |
| Nav               | `0.8rem` desktop, `3xl` light weight in the mobile overlay                    |

### Spacing, radius, and elevation

| Decision            | Value                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Content max width   | `1320px` (portal board `/portal/projetos/{id}` fills the main area without this cap)                             |
| Horizontal gutters  | `24px` default, `40px` from `md`, `56px` from `lg`                                                               |
| Section padding     | About `144–192px` vertical (`py-36` / `lg:py-48`). Hero and CTA larger                                           |
| Button radius       | Full pill                                                                                                        |
| Impact card radius  | `20px`                                                                                                           |
| Project card radius | `24px`                                                                                                           |
| Header              | Always `navy/92` with `backdrop-blur-xl`. Resting padding `20px`. Scrolled padding `12px` plus a hairline border |
| Accent glow on CTA  | `0 0 40–60px rgba(189, 218, 43, 0.25)`                                                                           |

### Motion

| Token          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Library        | `framer-motion`                                                                |
| Shared ease    | `[0.16, 1, 0.3, 1]`                                                            |
| `fadeUp`       | Opacity `0→1`, `y: 60→0`, `0.9s`                                               |
| `fadeIn`       | Opacity `0→1`, `0.8s`                                                          |
| `stagger`      | Children `0.1s`, delay children `0.1s`                                         |
| `scaleUp`      | Scale `0.88→1`, `0.8s`                                                         |
| Button hover   | `y: -2`, tap scale `0.97`                                                      |
| Reduced motion | Disable entrance and decorative animation when `prefers-reduced-motion` is set |

Vector-trail scroll animation, capability tab transitions, hero-flow steps,
and impact counters are part of the approved visual system.

## Component inventory

Reuse these extracted primitives. Do not introduce a second button, header, or
section pattern for the leadpage.

### Button

- Element: link styled as a button
- Variants: `primary` (accent fill, navy text), `secondary` (glass), `ghost`,
  `inverse` (navy fill, white text on light surfaces)
- Sizes: `md` (`28×12px` padding), `lg` (`36×16px` padding)
- Always includes the northeast arrow icon
- Default target when unspecified: `#contato`

### Header

- Fixed, full width, `z-50`, navy glass bar
- Logo: inverted dark logo (`brightness-0 invert`)
- Leadpage logo size: `h-14` below `lg` and `lg:h-16` from `lg`, with
  `w-auto` to keep `BUSINESS & TECHNOLOGY` readable
- Desktop from `lg`: in-page links in page-scroll order — Método (`#processo`
  on the vector trail), Serviços (`#servicos`), Empresa (`#origem`), Projetos
  (`#projetos`) — plus `Fale conosco` when a WhatsApp number is configured
- The header does not include a portal action. The desktop action group does
  not keep an empty portal placeholder, and the mobile overlay does not keep
  a portal row.
- Hash links scroll the matching section into view below the fixed header
- Below `lg`: hamburger that locks body scroll and opens a full-screen navy overlay
- `Fale conosco` is a link to `https://wa.me/{digits}` in a new browsing
  context, with `rel="noopener noreferrer"`. It uses the same number rules as
  the WhatsApp widget and is omitted when that number is empty. Desktop uses
  the primary accent pill (`bg-accent`, navy text) at the compact header size.
  The mobile overlay uses the same destination and the overlay type scale
- The mobile navigation includes `Fale conosco` when desktop header actions
  are hidden and a WhatsApp number is configured
- Active section uses a lime underline (`layoutId="activeNav"`)
- Scroll threshold for the compact bar: `40px`

### Portal login

Path `/login` is a split `PortalLoginPage` on every host. The principal address
is `https://vps2.com.br/login`. Path `/` on `app.vps2.com.br` is the same login
page. Path `/` on every other host, including `vps2.com.br`, is the leadpage.
An unauthenticated portal route on a leadpage host goes to `/login` on that
same origin. After sign-in, the same tab opens `/portal` on that same origin.
The login document has no leadpage header, hero,
portal sidebar, overlay, or close control, and it has one `h1`.

From `lg`, the page is two equal columns and at least the viewport tall. The
left column is `bg-navy` and shows `logo_vetor_dark.png` with a light wordmark and the green arrow kept visible, the sentence
`Tecnologia que impulsiona resultados.`, the support line `Acesse seu ambiente
de trabalho com segurança e simplicidade.`, and three rows: `Gestão integrada`,
`Acesso seguro`, and `Eficiência operacional`. Lime geometry stays decorative.
Below `lg`, that column is hidden and `logo_vetor.png` sits above the form.

The right column is a light surface, `#F7F8FA`. The form sits in a centered white
card, at most `28rem` wide, with a soft shadow. Its `h1` is `Acesse sua conta`. The support line is `Entre com
suas credenciais para continuar`. Labels are `E-mail corporativo` and `Senha`,
uppercase, with the placeholders `seu@email.com` and a masked password.
`Esqueceu sua senha?` is an accent text button aligned to the end of the
password field. `Entrar` is a full-width accent button with a trailing arrow.
Under it, `Ainda não tem acesso?` stays plain and `Fale com o administrador.`
is accent text without a destination.

The MFA, recovery, and blocked-account steps stay in that same right column.
The countdown is `mm:ss`, with `tabular-nums`, `text-secondary`, and accessible
name `Tempo restante`. `Pedir novo código` is the accent button and is shown
only at `00:00`. `Entrar` stays available while time remains. `Cancelar` sits
in that same row while time remains and at `00:00`. On this light surface it is
a white control with navy text and a hairline border, the same height and focus
ring as the accent button, and no arrow icon. While cancel is in progress both
controls in the row are disabled and the ghost label is `Cancelando...`. A
blocked account shows the specified sentence in `text-red-600` with
`role="alert"`. The page adds no entrance animation.

`Reativar` is an accent pill inside `Editar usuário`, shown only when that
user's `status` is `blocked`.

### WhatsApp contact

- Fixed overlay on `/` only, lower-right corner, `z-40` so it stays below the
  header stacking context
- Offset matches page gutters: `24px`, `40px` from `sm`, `56px` from `lg`
- Speech bubble uses the approved copy `Estou pronto para lhe atender.`
- Custom inline SVG for the robot character. Do not add an icon library or a
  WhatsApp brand mark
- Tap target for the robot control is at least `44px`
- Opens `https://wa.me/{digits}` in a new browsing context with
  `rel="noopener noreferrer"`
- Decorative bobbing uses `.whatsapp-ready-motion` and stops when
  `prefers-reduced-motion` is set
- Hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty or not a digit-only
  phone value
- Header `Fale conosco` opens this same URL and follows the same empty-number
  rule. It does not open the contact form

### Footer

- Three centered columns from `md`: brand, Empresa, Serviços
- Navy background with a hairline top border
- Brand column shows the approved tagline, then `VETOR — Business & Technology`
- Social labels are not published until approved profile URLs exist

### Hero

- Navy section with a faint square grid and ambient lime glow
- Left: pill eyebrow, headline with italic lime accent, support copy, two
  buttons, approved working-method checks, approved quote
- Right from `lg`: interactive four-step vector flow inside a window frame
- Below `lg`: compact mobile flow in the same window frame
- Closing metric strip publishes three approved impact claims: `80%`, `3x`,
  `40%`

### Shared layout primitives

- `SectionEyebrow` — pill label (`dark`, `light`, `accent`)
- `FeatureRow` — icon, title, and description on a rounded card
- `BrowserFrame` — dark window chrome around method and project visuals
- `GridBackdrop` — decorative square grid on navy surfaces

Accent words in section titles use Inter italic and the lime token.

### Manifesto

- Centered pill, title, and support copy on off-white
- Vector trail remains the working-method surface at `#processo`

### Capabilities

- Centered intro
- Desktop from `lg`: vertical tab list and feature-row panel (Desafio / O que
  aplicamos / Impacto)
- Below `lg`: accordion with the same feature rows
- Arrow-key, Home, and End navigation on the tab list

### Origin

- Centered intro on navy
- Four evolution steps in a 2x2 card grid

### Projects

- Alternating text and window-framed screenshots
- Fields: industry, label, headline, problem, opportunity, built, result, tags,
  screenshot
- Screenshot alternative text: `Screenshot do projeto {LABEL}`

### Impact

- Centered intro and five outcome cards on navy, distinct from the Projects
  off-white band
- Animated numeric counters when the card enters the viewport

### Final CTA

- Off-white band wrapping a large navy rounded card
- Primary action opens the same WhatsApp click-to-chat URL as `WhatsAppContact`
  when `NEXT_PUBLIC_WHATSAPP_NUMBER` is set; otherwise `mailto:contato@vetor.tech`
- Secondary action is `#processo`

## Assets

| Asset                 | Source or definition                                    | Status   |
| --------------------- | ------------------------------------------------------- | -------- |
| Logo (color)          | `frontend/public/brand/logo_vetor.png`                  | Approved |
| Logo (dark / invert)  | `frontend/public/brand/logo_vetor_dark.png`             | Approved |
| Symbol (mark)         | `frontend/public/brand/symbol-vetor.png`                | Approved |
| Favicon               | VETOR mark in `frontend/app/icon.png` and `favicon.ico` | Approved |
| Social image          | `frontend/public/brand/logo_vetor.png`                  | Approved |
| PrecificAI screenshot | `frontend/public/brand/project-precificai.png`          | Approved |
| EasyCondo screenshot  | `frontend/public/brand/project-easycondo.png`           | Approved |
| Medical Bills image   | `frontend/public/brand/project-medicalbills.png`        | Approved |
| Client logos          | `frontend/public/brand/logo_vetor.png`                  | Approved |

On navy surfaces the dark logo is inverted to white. Do not replace these
files with Next.js starter SVGs.

## Responsive behavior

| Breakpoint or viewport | Design decision                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Default / mobile       | Single column. Hamburger header. Mobile hero flow. Capability accordion. Portal: tight gutters, horizontal board scroll, 40px touch targets. |
| `md` (`768px`)         | Wider gutters. Footer uses three centered columns. Board lanes lock to 280px.                                                                |
| `lg` (`1024px`)        | Desktop nav, hero flow, capability tabs, project side-by-side. Board files panel is a right sheet.                                           |
| Content width          | Centered, max `1320px`. Portal board fills main (no max cap).                                                                                |

Start from the narrow layout. Preserve usable content, focus order, and a
minimum `40px` touch target for the menu control and primary CTAs.

## Accessibility

- `html` language is `pt-BR`.
- Use landmarks: `header`, `main`, `footer`, and labeled `nav`.
- Menu button has an accessible name (`Menu`).
- Modals use `role="dialog"`, an accessible name, focus trapping, Escape and
  overlay dismissal, and return focus to the trigger.
- Form modals use the shared light shell: `fixed inset-0 z-[60]` with
  `bg-navy/80` and backdrop blur, a centered `min-h-dvh` wrapper, and a
  white `md:max-w-xl` dialog with `rounded-none` mobile treatment,
  `md:rounded-[28px]`, `p-6` mobile padding, `md:p-8` desktop padding, and
  internal scrolling. File previews may use the shared viewport-size variant
  because they are viewing surfaces rather than forms.
- Capability tabs expose `tablist` / `tab` / `tabpanel` and keyboard support.
- Vector-trail and hero-flow steps are activable controls with `aria-pressed`.
- Decorative canvas, noise, and SVG trajectories are `aria-hidden`.
- Images have alternative text. The inverted logo uses `alt="VETOR"`.
- Provide a visible focus ring. Extracted components use `focus-visible:ring`
  with accent at about 40% opacity.
- Honor `prefers-reduced-motion` for hero flow, manifesto, capabilities,
  the vector trail, and the WhatsApp contact widget.
- Contrast must remain readable for `text-secondary` on navy and
  `text-dark-secondary` on off-white. Do not lighten accent text below the
  approved lime on navy.

## Optional PWA assets

PWA support is not required. Do not add a manifest, install icons, or offline
shell.

## Document status

- [x] Screens and routes are defined
- [x] Visual system decisions are recorded
- [x] Assets are identified
- [x] Responsive behavior is defined when applicable
- [x] Accessibility requirements are recorded
- [ ] Ready for visual implementation

The leadpage visual system is recorded. Implementation still requires an
approved specification. Social URLs and the unused extracted sections remain
open.
