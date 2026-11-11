# Product contract

This document records durable, project-wide product decisions. It is not the
delivery contract for an individual feature.

Feature-specific requirements, acceptance criteria, and delivery evidence live
in approved specifications under `docs/specs/`. Promote a decision here only
when it affects the product beyond one feature.

Source for the leadpage: extracted from `tmp/vetor` (Next.js marketing site)
before that tree is removed.

## Relationship to specifications

- Read the approved feature specification before implementing behavior.
- Keep this document focused on identity, product scope, shared business
  rules, and project-wide non-functional decisions.
- Do not copy feature-level acceptance criteria into this document.
- A human-approved specification may update this contract when it changes a
  durable product decision.

## Identity

| Field                 | Value                                                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product name          | VETOR                                                                                                                                                                                                                                                                                                |
| Brand or organization | VETOR — Business & Technology                                                                                                                                                                                                                                                                        |
| UI language           | Portuguese (Brazil)                                                                                                                                                                                                                                                                                  |
| Target audience       | Decision-makers at companies that need custom software, data, automation, or applied AI. Portal users are tenant-scoped. `Administrador` has all-tenant access. `AdministradorTenant` has every tenant-scoped portal operation on their home tenant. `Usuario` has extras only via `enabledActions`. |
| Problem to solve      | Companies grow faster than their systems and need technology built from real operational problems, not generic tools.                                                                                                                                                                                |
| Product positioning   | Custom software studio. Public leadpage presents VETOR. A portal is planned as a separate authorized surface and is not in the extracted leadpage.                                                                                                                                                   |

VETOR designs and builds custom software, data platforms, automation, and
applied AI for other organizations. This product is VETOR's own digital
presence, not a packaged application that VETOR sells to third parties.

Approved tagline: `O negócio aponta a direção. A tecnologia leva mais longe.`

Approved metadata:

| Field             | Approved value                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Document title    | `VETOR \| Business & Technology`                                                                           |
| Meta description  | `Software, dados, automação e inteligência artificial construídos a partir de problemas reais de negócio.` |
| Open Graph locale | `pt_BR`                                                                                                    |
| HTML `lang`       | `pt-BR`                                                                                                    |

## Scope

### In scope

- A public leadpage that presents VETOR as a custom software company
- Lead capture through a backend email operation to the configured contact
  address, without persisting the inquiry
- WhatsApp click-to-chat from the leadpage when a destination number is
  configured
- A portal that is a distinct surface from the leadpage (not present in the extracted site)
- Separation between public marketing content and authorized-only operations
- Backend-enforced access control for every portal operation, when the portal is specified

### Out of scope

- Hosting or delivering customer applications inside this product
- A multi-tenant SaaS platform for other software studios
- Native mobile applications
- An offline PWA shell
- Offline-first behavior
- Payment, billing, or invoicing unless a later approved specification adds them
- A public marketplace, job board, or user-generated content area
- Stored lead forms, CRM, analytics, or messaging integrations until a specification adopts them
- Client-logo social proof until approved logo assets exist

### Functional requirements

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Status   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-001 | The product exposes a public leadpage that presents VETOR as a custom software company                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Approved |
| FR-002 | The product exposes a portal at `/portal` as a surface separate from the leadpage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Approved |
| FR-003 | Anonymous visitors can use the leadpage without authentication                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Approved |
| FR-004 | Portal access requires authentication and authorization enforced by the backend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Approved |
| FR-005 | Public marketing claims, metrics, and contact details are published only from this contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Approved |
| FR-006 | Lead capture sends a non-persisted inquiry through the backend to the `FORM_CONTACT` address                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Approved |
| FR-007 | Portal access is multitenant; `Administrador` has all-tenant scope and other users have tenant scope. Power BI catalog and distribution stay all-tenant. Viewing and embed stay session-tenant even for `Administrador`. `Administrador` may switch session `tenantId` from Projetos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Approved |
| FR-008 | The leadpage exposes WhatsApp click-to-chat when `NEXT_PUBLIC_WHATSAPP_NUMBER` is set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Approved |
| FR-009 | Backend startup ensures bootstrap tenant `vetor` and `Administrador` `admin@vetor.tech` exist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Approved |
| FR-010 | `/` and `/portal` are installable as a PWA with the VETOR logo, start URL `/`, and no offline shell                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Approved |
| FR-011 | Authenticated portal users view Power BI reports distributed to their session tenant; `Administrador` imports and distributes reports through Nest and `ms-powerbi-embedded`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Approved |
| FR-012 | An `Administrador` grants mapped portal actions per user (`enabledActions`). A `Usuario` with `createUser` can create users. A `Usuario` with `editUser` still edits only their own registration. `AdministradorTenant` may create and configure users of their tenant. Mapped actions include `painel`, `viewReports`, `viewProjects`, `manageProjects`, `moveCards`, `createLane`, `renameLane`, `deleteLane`, `createTenant`, and `vetorAgent`. `painel` shows the Painel screen and `viewReports` shows Relatórios. `vetorAgent` shows the sidebar item `Agente` and the shell heading `Inteligência Artificial`, and opens the owner-scoped chat in the portal main column at `/portal/vetor-agent`. It is not implied for `AdministradorTenant`. `createLane`, `renameLane`, and `deleteLane` authorize only those board controls and are held by `Administrador` by default. Granting `createTenant` does not authorize tenant create for non-`Administrador` callers. | Approved |
| FR-013 | Authenticated portal users with `viewProjects` use `/portal/projetos` workspaces, projects, and a Kanban board per project                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Approved |
| FR-014 | An `Administrador` registers a tenant from Cadastro (`Nome Empresa`, `Slug`, optional contact `Email`) through `POST /api/v1/tenants`. The page heading and nav are `Cadastro`. `AdministradorTenant` and `Usuario` cannot create a tenant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Approved |
| FR-015 | An `Administrador` sees `Financeiro` as a sidebar parent and opens `Contratos` at `/portal/financeiro`. The shell heading is `Contratos`. The screen records one contract, the contract value, an amount and an optional due date for each installment, and named cost lines for every existing project of every tenant. Valor pago is the sum of installment amounts whose due date is today or earlier in America/Sao_Paulo. An installment with no due date is excluded. Valor Pendente is the contract total minus that sum. The list shows that paid amount, Valor Pendente, and the cost sum. Stored payment rows do not change these figures. Amounts are BRL. The page filters by tenant without changing the portal session. The same parent opens `Custos e Despesas` at `/portal/financeiro/despesas`, the company operating ledger, without changing Contratos formulas. `AdministradorTenant` and `Usuario` cannot read or write finance.                                                                                                                                                                                                                                                           | Approved |
| FR-016 | Authenticated portal users open `Suporte` at `/portal/chamados`. `Usuario` and `AdministradorTenant` create tickets for their home tenant. `Administrador` on the company tenant session attends tickets from every tenant and can filter that list by tenant. On another session tenant, `Administrador` manages only that tenant. Only `Administrador` changes status. A ticket priority is `low` by default, or `medium` or `high`. Callers who can view the ticket can attach the same files allowed on cards. Pasting an image on the ticket screen adds an attachment. Notifications are link-only SMTP mail sent after the HTTP response. A new ticket and a client comment go to the ticket tenant contact email from Cadastro. A company comment and a status change go to the active users of that tenant.                                                                                             | Approved |

### Non-functional requirements

| Concern                  | Decision                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Responsive behavior      | Leadpage must remain usable from mobile through desktop. Breakpoints live in `docs/design.md`.                                                                                                                                                                                                                           |
| Accessibility target     | Semantic HTML, keyboard navigation, visible focus, and `prefers-reduced-motion` support are required. Formal WCAG level is TBD.                                                                                                                                                                                          |
| Performance expectations | TBD                                                                                                                                                                                                                                                                                                                      |
| PWA support              | Installable for `/` and `/portal`. Icon is `frontend/public/brand/logo_vetor.png`. Start URL is `/`. Standalone startup opens `/portal` on the current origin. A missing session on the leadpage host continues to `/login` on that same origin. The principal address is `https://vps2.com.br/login`. No offline shell. |
| Authentication           | Not required for the leadpage. Portal sign-in is e-mail and password. The e-mailed MFA code is required before session cookies only when the user's home tenant has MFA enabled. Tenants start with MFA disabled.                                                                                                        |
| Offline behavior         | Not required                                                                                                                                                                                                                                                                                                             |

## Surfaces and routes

| Surface              | Route                         | Purpose                                                                                                                               | Status   |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Leadpage             | `/`                           | Public commercial presence on every host except `app.vps2.com.br`                                                                     | Approved |
| Portal login         | `https://vps2.com.br/login`   | Public login on the principal DNS. The same page is also `/login`, and `/` on `app.vps2.com.br`                                       | Approved |
| Origin               | `/#origem`                    | Company origin narrative                                                                                                              | Approved |
| Capabilities         | `/#servicos`                  | Business objectives and applied capabilities                                                                                          | Approved |
| Projects             | `/#projetos`                  | Approved case studies                                                                                                                 | Approved |
| Contact              | `/#contato`                   | Final CTA and lead capture                                                                                                            | Approved |
| Method               | `/#processo`                  | Working method on the composed vector trail                                                                                           | Approved |
| Portal               | `/portal`                     | Authenticated dashboard (`Painel`) on the current origin. Sign-in from `https://vps2.com.br/login` opens `https://vps2.com.br/portal` | Approved |
| Portal reports       | `/portal/relatorios`          | Session-tenant Power BI report cards and embed viewer                                                                                 | Approved |
| Portal projects      | `/portal/projetos`            | Tenant project workspaces and projects                                                                                                | Approved |
| Portal support       | `/portal/chamados`            | Tenant support tickets for the authenticated portal user                                                                              | Approved |
| Portal Vetor Agent   | `/portal/vetor-agent`         | Owner-scoped AI chat in the portal main column for sessions with `vetorAgent`. The worker can list, create, and update cards after an exact project name. Two or more accessible projects with that name stop the operation. A card may be stored with no assignee when the person is missing or not unique. | Approved |
| Portal ticket        | `/portal/chamados/{id}`       | One support ticket, its comments, priority, attachments, and status                                                                   | Approved |
| Portal finance       | `/portal/financeiro`          | `Administrador` opens `Contratos` under `Financeiro` for the contract, installment due dates, derived paid and pending amounts, and costs | Approved |
| Portal expenses      | `/portal/financeiro/despesas` | `Administrador` company operating ledger under `Financeiro`                                                                           | Approved |
| Portal board         | `/portal/projetos/{id}`       | One Kanban board per project                                                                                                          | Approved |
| Portal Power BI      | `/portal/powerbi`             | `Administrador` catalog and distribution of Power BI reports                                                                          | Approved |
| Portal administrator | `/portal/administrador`       | `Administrador` per-tenant MFA setting and one Agente Beta token price copied onto every tenant                                       | Approved |
| Portal password      | `/portal/change-password`     | Public password-change form for a valid create-user or Editar usuário reset link                                                      | Approved |

Do not add other public marketing sections or portal routes until an approved
specification defines them.

### Leadpage composition

The visual structure of `/` follows the restyled product-landing layout in
`docs/design.md`. Copy, claims, and this composition stay as recorded here.

Mounted on `/` in this order:

1. Header
2. Hero
3. Manifesto, including the vector trail
4. Capabilities (Services)
5. Origin
6. Projects
7. Impact
8. Final CTA
9. Footer

Fixed overlay on `/`, not in the section order above:

- WhatsApp contact widget in the lower-right corner, hidden when
  `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty
- Header `Fale conosco`, on desktop and in the mobile menu, opens the same
  WhatsApp click-to-chat URL in a new browsing context. The control is omitted
  when that number is empty. The services CTA `Fale sobre o seu desafio` and the
  final CTA `Conte seu desafio` use the same WhatsApp URL when configured; they
  fall back to `#contato` and `mailto:contato@vetor.tech` respectively when the
  number is empty

Extracted from the source project but **not** composed on `/`:

- Client profile
- Differentiator
- Process (standalone extracted component)
- Provocative statement
- Social proof / client logos

Header and footer in-page links follow this composition order: Método
(`#processo`), Serviços (`#servicos`), Empresa (`#origem`), Projetos
(`#projetos`), then contact (`#contato`). Header, footer, and hero links to
`#processo` land on the composed vector trail (`VetorTrail`), which is the
working-method content already on `/`. Do not mount the extracted Process
section until a specification re-includes it.

## Business rules

1. Anonymous visitors may access only the leadpage and other surfaces that a
   specification explicitly marks as public.
2. Every portal operation is authenticated and authorized on the backend.
   Frontend checks are user experience only.
3. The frontend never accesses the database. Persistence, when adopted, stays
   behind the NestJS API.
4. Public copy, brand claims, and contact details are published only after they
   are recorded in this contract or in an approved specification.
5. This product does not host, sell, or operate the custom software VETOR
   builds for its clients.
6. Lead capture does not persist visitor data. The backend sends the inquiry to
   the single address in `FORM_CONTACT`.
7. Authentication, PWA support, offline behavior, and external integrations are
   implemented only when this contract and an approved specification require
   them.
8. Client logos and social profile URLs are not published until approved assets
   or URLs exist. WhatsApp click-to-chat on `/` is the approved exception and
   uses `NEXT_PUBLIC_WHATSAPP_NUMBER`.
9. Backend startup creates the bootstrap `Administrador` `admin@vetor.tech` in
   tenant `vetor` when that account is missing. The password comes from
   `BOOTSTRAP_ADMIN_PASSWORD` and is never stored in plaintext. The stored
   profile is `Admin` / `Vetor` / `40` / `M` / `/brand/symbol-vetor.png`.
10. Login starts from `users.tenant_id`. An `Administrador` dashboard uses the
    VETOR tenant until they switch session `tenantId` from Projetos.
    `AdministradorTenant` and `Usuario` stay on their home tenant.
    Creating a user is allowed for `Administrador`, `AdministradorTenant` on
    their tenant, and a `Usuario` with `createUser`. Editing a registration
    is allowed for `Administrador`, `AdministradorTenant` on their tenant
    (except `Administrador` targets), and for the user acting on their own
    record, including a `Usuario` with `editUser`. Writing `enabledActions`
    is allowed for `Administrador` and for `AdministradorTenant` on
    non-`Administrador` users of their tenant. Opening `Configurar Perfil`
    is allowed for `Administrador` and `AdministradorTenant`. Only
    `Administrador` assigns `Usuario`, `AdministradorTenant`, or
    `Administrador` (Administrador Global). Administrador Global has every system
    permission. `AdministradorTenant` starts with every tenant permission and
    can administer only their home tenant. Administrador Global can select
    each permission for a `Usuario` or `AdministradorTenant`. Mapped
    `enabledActions` are `painel`, `viewReports`, `createUser`, `editUser`,
    `viewProjects`, `manageProjects`, `moveCards`, `createLane`,
    `renameLane`, `deleteLane`, `createTenant`, and `vetorAgent`. `vetorAgent`
    is not implied for `AdministradorTenant`. `createLane`,
    `renameLane`, and `deleteLane` are not implied for
    `AdministradorTenant`. Only `Administrador` grants or revokes them.
    A user sees create, rename, and delete lane controls only when that
    permission is present.
    Only `Administrador` may register a tenant from Cadastro. Uploaded photos
    and card attachments are stored on the tenant filesystem; PostgreSQL
    stores only a pointer.

## Capabilities

The leadpage presents capabilities as business objectives, not a technology
catalog.

| ID  | Objective                 | Challenge                                                                 | Applied                                                                  | Impact word |
| --- | ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------- |
| 01  | Simplificar a operação    | Manual processes, rework, and systems that no longer match the operation  | Custom software, internal platforms, automation, and AI agents           | EFICIÊNCIA  |
| 02  | Decidir com clareza       | Scattered data, late indicators, and incomplete decision views            | Data engineering, BI, analytics, and applied AI                          | CLAREZA     |
| 03  | Conectar o ecossistema    | ERPs, systems, spreadsheets, and platforms that do not talk to each other | APIs, integrations, data sync, and cross-system automation               | CONEXÃO     |
| 04  | Criar novas oportunidades | An unvalidated business opportunity that still needs to become a product  | Product discovery, UX/UI, MVPs, digital platforms, apps, and SaaS        | CRESCIMENTO |
| 05  | Evoluir e escalar         | Solutions that became limited, outdated, or blocked growth                | Modernization, architecture, cloud, monitoring, and continuous evolution | ESCALA      |

## Approved case studies

| Case          | Industry           | Headline                                           | Built                                              | Result                                        |
| ------------- | ------------------ | -------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| PRECIFICAI    | Food Service       | De dados espalhados no ERP a decisões de margem.   | Integrações + Dados + Software + IA                | Uma camada de inteligência sobre a operação.  |
| EASYCONDO     | Gestão Condominial | O condomínio organizado, sem depender do WhatsApp. | Software + PWA + Automação                         | Transparência e acesso rápido às informações. |
| MEDICAL BILLS | Healthcare         | De um ciclo complexo a uma operação mensurável.    | Regras de negócio + Integrações + Dados + Software | Uma visão integrada do ciclo da receita.      |

Do not add other public cases or numeric results beyond the approved claims
below.

## Integrations

| Integration            | Purpose                                      | Status  | Configuration                                                           |
| ---------------------- | -------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Google Fonts           | Load Inter for the leadpage and portal       | Adopted | Public CSS import                                                       |
| SMTP                   | Contact and transactional email              | Adopted | Backend `MAIL_*` and `FORM_CONTACT`                                     |
| WhatsApp click-to-chat | Open the visitor's WhatsApp for the leadpage | Adopted | Frontend `NEXT_PUBLIC_WHATSAPP_NUMBER`                                  |
| Web app manifest       | Installable PWA for `/` and `/portal`        | Adopted | `frontend/app/manifest.ts`                                              |
| Power BI Embedded      | Catalog, distribute, and embed reports       | Adopted | Nest `POWERBI_EMBEDDED_*`; Python Azure and Redis env in `.env.powerbi` |

## Content and claims

| Item                     | Approved value                                                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product copy             | Portuguese (Brazil) strings recorded in this contract and `docs/design.md`                                                                                                                                                                     |
| Brand assets             | Files under `frontend/public/brand/`                                                                                                                                                                                                           |
| Public claims or metrics | Only the impact outcomes below                                                                                                                                                                                                                 |
| Contact details          | Header `Fale conosco`, the WhatsApp widget, and the services and final CTA challenge buttons use `NEXT_PUBLIC_WHATSAPP_NUMBER` when set; header and widget are hidden when empty; CTAs fall back to `#contato` and `mailto:contato@vetor.tech` |
| Social profiles          | Named only after approved profile URLs exist. Not shown in the footer.                                                                                                                                                                         |

### Approved positioning and headlines

| Surface         | Approved copy                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Hero eyebrow    | Business & Technology                                                                                     |
| Hero headline   | Antes do código, entendemos o negócio.                                                                    |
| Hero support    | Estratégia, software, dados e inteligência artificial construídos a partir de problemas reais de negócio. |
| Hero quote      | Quem não constrói o futuro, constrói o presente com as ferramentas do passado.                            |
| Manifesto       | Não criamos tecnologia para impressionar. Criamos para resolver.                                          |
| Capabilities    | O negócio define a direção. A tecnologia constrói o caminho.                                              |
| Origin          | Começamos pelos dados.                                                                                    |
| Projects        | Tecnologia construída no mundo real.                                                                      |
| Impact          | No fim, tecnologia é meio. Resultado é o objetivo.                                                        |
| Final CTA       | Qual problema do seu negócio a tecnologia ainda não resolveu?                                             |
| CTA button      | Conte seu desafio                                                                                         |
| Header CTA      | Fale conosco                                                                                              |
| WhatsApp speech | Estou pronto para lhe atender.                                                                            |

### Approved impact claims

These numbers are published on the leadpage. Do not invent additional metrics.

| Metric | Label            | Title                       |
| ------ | ---------------- | --------------------------- |
| 80%    | menos retrabalho | Mais eficiência operacional |
| 3x     | mais velocidade  | Melhores decisões           |
| 40%    | menos custo      | Menos desperdício           |
| 10x    | mais capacidade  | Mais escala                 |
| 100%   | visibilidade     | Mais controle               |

### Approved working method

Recorded from the extracted Process section. Not composed on `/` until a
specification re-includes it.

1. Entendemos — negócio, operação, pessoas, sistemas, dados e objetivos
2. Diagnosticamos — gargalos e onde tecnologia gera impacto
3. Construímos — software, integrações, automações, dados ou IA
4. Evoluímos — resultados acompanhados e melhoria contínua

### Approved client profile

Recorded from the extracted client-profile copy. Not composed on `/` until a
specification re-includes it.

- Operações que cresceram mais rápido que seus sistemas
- Dependência de processos manuais e planilhas
- Sistemas que não conversam entre si
- Muitos dados, mas pouca informação gerencial
- Oportunidades de software dentro da própria operação
- Modernização sem perder conhecimento do negócio
- IA de forma prática e economicamente inteligente

## Success criteria

- A public visitor can tell that VETOR develops custom software, data,
  automation, and applied AI from real business problems.
- Public marketing content and portal operations remain separate surfaces.
- Lead capture does not store visitor data in this product.
- Unpublished claims, metrics, contact details, and social URLs never appear
  in the interface.
- An authorized user can reach the portal only after its route, roles, and
  capabilities are approved in a specification.

## Document status

- [x] Identity is defined
- [x] Scope and exclusions are approved
- [x] Functional requirements are actionable
- [ ] Routes and integrations are defined
- [ ] Security, accessibility, and operational needs are recorded
- [ ] Ready for implementation

The leadpage route, copy, claims, and mailto capture are recorded. The portal
route, authentication scheme, formal WCAG target, performance expectations,
social URLs, and unused extracted sections still need approved specifications
before implementation.
