'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { SafeUser } from '@/lib/api/client';
import { publicPhotoSrc, getSession } from '@/lib/api/client';
import { KanbanAvatar } from '@/components/kanban-ui/kanban-avatar';
import { KanbanInputText } from '@/components/kanban-ui/kanban-input-text';
import { KanbanLogomark } from '@/components/kanban-ui/kanban-logomark';
import { KanbanSidebarItem } from '@/components/kanban-ui/kanban-sidebar-item';
import { focusRing } from '@/components/kanban-ui/samples';
import {
  PortalProjectNav,
  projectNavMatchesQuery,
  useProjectNavIndex,
} from '@/components/layout/portal-project-nav';
import { SignOutIcon } from '@/components/kanban-ui/icons/sign-out';
import {
  clearPortalCadastroIntent,
  rememberPortalCadastroIntent,
  takePortalCadastroIntent,
} from '@/lib/portal-cadastro';
import { PortalConfigureProfileForm } from '@/components/forms/portal-configure-profile-form';
import { PortalEditUserForm } from '@/components/forms/portal-edit-user-form';
import { PortalRegisterForm } from '@/components/forms/portal-register-form';
import { PortalRegisterTenantForm } from '@/components/forms/portal-register-tenant-form';
import { PortalReplaceTenantPhotoForm } from '@/components/forms/portal-replace-tenant-photo-form';
import {
  canConfigureProfile,
  canCreateTenant,
  canCreateUser,
  canUseVetorAgent,
  canViewPainel,
  canViewProjects,
  canViewReports,
} from '@/lib/portal-actions';
import { Modal } from '@/components/ui/modal';

type PortalSection = 'painel' | 'cadastro-usuario';

function initialPortalSection(pathname: string): PortalSection {
  if (pathname === '/portal' && takePortalCadastroIntent()) {
    return 'cadastro-usuario';
  }

  return 'painel';
}

function userInitials(user: SafeUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

function tenantInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}

function PainelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="3.5"
        width="7.5"
        height="7.5"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="3.5"
        width="7.5"
        height="7.5"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13"
        width="7.5"
        height="7.5"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="13"
        width="7.5"
        height="7.5"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VetorAgentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M6 6.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-3.5 3v-3H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c.8-3.4 3.4-5.2 7-5.2s6.2 1.8 7 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RelatoriosIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProjetosIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="5" height="16" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="15.5" y="4" width="5" height="16" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SuporteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 12.5V12a7 7 0 0 1 14 0v.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="12"
        width="4.2"
        height="6.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="16.8"
        y="12"
        width="4.2"
        height="6.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FinanceiroIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PowerBiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 18.5V12M10 18.5V7M15 18.5v-8M20 18.5V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AdministradorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreateUserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 19c.7-3.1 2.9-4.7 5.5-4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.5 14.5v6M13.5 17.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditUserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path
        d="M4 20h4.2L18.5 9.7a2.1 2.1 0 0 0-3-3L5.2 17V20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConfigureProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 19c.7-3.1 2.9-4.7 5.5-4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17.2" cy="16.8" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M17.2 13.2v1.2M17.2 19.2v1.2M13.8 16.8h1.2M19.4 16.8h1.2M14.7 14.3l.9.9M18.8 18.4l.9.9M18.8 14.3l-.9.9M14.7 18.4l-.9.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReplaceTenantPhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10.5" r="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.8 16.2 9 12.8l2.4 2.2 2.2-1.8 5.6 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CreateTenantIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path
        d="M6.5 20V9.2L12 5.5l5.5 3.7V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path
        d="M9.2 11h.01M12 11h.01M14.8 11h.01M9.2 14.2h.01M14.8 14.2h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionCard({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center gap-6 rounded-[28px] border border-navy/10 bg-white p-8 text-center transition hover:border-accent/40 hover:shadow-[0_12px_32px_rgba(6,11,24,0.08)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/10 dark:bg-navy-100 dark:hover:border-accent/40"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-navy">
        {icon}
      </span>
      <span className="text-lg font-semibold text-navy dark:text-white">{label}</span>
    </button>
  );
}

function PortalBrand() {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-2xl bg-white px-3 py-4">
      <KanbanLogomark className="size-12 shrink-0 bg-white p-1.5" />
      <div className="min-w-0 flex-1 text-left">
        <p className="whitespace-nowrap text-[11.28px] font-bold tracking-[0.06em] text-navy">
          BUSINESS &amp; TECHNOLOGY
        </p>
      </div>
    </div>
  );
}

function SessionChip({ user }: { user: SafeUser }) {
  const tenantName = user.tenantName.trim();

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="min-w-0 max-w-[8.5rem] text-right sm:max-w-[14rem] md:max-w-none">
        <p className="truncate text-sm font-semibold tracking-wide text-navy dark:text-white">
          {tenantName}
        </p>
      </div>
      {user.tenantPhotoUrl ? (
        <KanbanAvatar
          alt={tenantName}
          fit="contain"
          size="md"
          src={publicPhotoSrc(user.tenantPhotoUrl)}
        />
      ) : (
        <span
          aria-label={tenantName}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-navy"
        >
          {tenantInitials(tenantName)}
        </span>
      )}
    </div>
  );
}

function PortalUserFooter({
  loggingOut,
  onLogout,
  user,
}: {
  loggingOut: boolean;
  onLogout: () => void;
  user: SafeUser;
}) {
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const cargo = user.cargo?.trim() ?? '';

  return (
    <div className="flex items-center gap-3 border-t border-[#e2e8f0] pt-6 dark:border-white/10">
      {user.photoUrl ? (
        <KanbanAvatar alt={displayName} size="lg" src={publicPhotoSrc(user.photoUrl)} />
      ) : (
        <span
          aria-label={displayName}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-navy"
        >
          {userInitials(user)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-navy dark:text-white">{displayName}</p>
        {cargo ? (
          <p className="truncate text-sm text-text-dark-secondary dark:text-text-secondary">
            {cargo}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Sair"
        disabled={loggingOut}
        onClick={onLogout}
        className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-text-dark-secondary transition hover:bg-navy/5 hover:text-navy disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:text-text-secondary dark:hover:bg-white/10 dark:hover:text-white"
      >
        <SignOutIcon className="size-6" />
      </button>
    </div>
  );
}

function navPhraseMatches(phrase: string, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();

  return normalized.length > 0 && phrase.includes(normalized);
}

function isFinanceiroPath(pathname: string): boolean {
  return pathname === '/portal/financeiro' || pathname.startsWith('/portal/financeiro/');
}

function routeHeading(pathname: string, reportsEnabled: boolean): string | undefined {
  if (pathname === '/portal/relatorios') {
    return reportsEnabled ? 'Relatórios' : undefined;
  }

  if (pathname === '/portal/financeiro') {
    return 'Contratos';
  }

  if (
    pathname === '/portal/financeiro/despesas' ||
    pathname.startsWith('/portal/financeiro/despesas/')
  ) {
    return 'Custos e Despesas';
  }

  if (pathname === '/portal/powerbi') {
    return 'Power BI';
  }

  if (pathname === '/portal/administrador') {
    return 'Administrador';
  }

  if (pathname === '/portal/chamados' || pathname.startsWith('/portal/chamados/')) {
    return 'Suporte';
  }

  if (pathname === '/portal/vetor-agent') {
    return 'Inteligência Artificial';
  }

  if (pathname === '/portal/projetos' || pathname.startsWith('/portal/projetos/')) {
    return 'Projetos';
  }

  return undefined;
}

function financeiroNavMatches(query: string): boolean {
  return (
    navPhraseMatches('financeiro', query) ||
    navPhraseMatches('contratos', query) ||
    navPhraseMatches('custos e despesas', query)
  );
}

function FinanceiroChildNav({
  contratosActive,
  despesasActive,
  onNavigate,
  query,
  expanded,
}: {
  contratosActive: boolean;
  despesasActive: boolean;
  expanded: boolean;
  onNavigate: () => void;
  query: string;
}) {
  const children = [
    { active: contratosActive, href: '/portal/financeiro', label: 'Contratos' },
    {
      active: despesasActive,
      href: '/portal/financeiro/despesas',
      label: 'Custos e Despesas',
    },
  ].filter((child) => expanded || navPhraseMatches(child.label.toLocaleLowerCase(), query));

  if (children.length === 0) {
    return null;
  }

  return (
    <ul className="mt-1 ml-5 flex flex-col border-l border-[#e2e8f0]">
      {children.map((child) => (
        <li key={child.href}>
          <Link
            href={child.href}
            scroll={false}
            aria-current={child.active ? 'page' : undefined}
            onClick={onNavigate}
            className={`block w-full truncate rounded-full px-3 py-1.5 text-sm font-medium transition ${
              child.active ? 'bg-accent/15 text-accent' : 'text-[#1e293b] hover:bg-[#f8fafc]'
            } ${focusRing}`}
          >
            {child.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface PortalShellProps {
  children?: ReactNode;
  flushMain?: boolean;
  loggingOut: boolean;
  onLogout: () => void;
  onUserUpdated: (user: SafeUser) => void;
  pageTitle?: string;
  user: SafeUser;
}

export function PortalShell({
  children,
  flushMain = false,
  loggingOut,
  onLogout,
  onUserUpdated,
  pageTitle,
  user,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [financeiroExpanded, setFinanceiroExpanded] = useState(() => isFinanceiroPath(pathname));
  const [section, setSection] = useState<PortalSection>(() => initialPortalSection(pathname));
  const [sectionPath, setSectionPath] = useState(pathname);
  const mainRef = useRef<HTMLElement>(null);

  if (pathname !== sectionPath) {
    setSectionPath(pathname);

    if (pathname === '/portal' && takePortalCadastroIntent()) {
      setSection('cadastro-usuario');
    } else if (pathname !== '/portal') {
      setSection('painel');
    }
  }
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [replaceTenantPhotoOpen, setReplaceTenantPhotoOpen] = useState(false);
  const isAdministrador = user.profile === 'Administrador';
  const showCreate = canCreateUser(user);
  const showCreateTenant = canCreateTenant(user);
  const showPerfil = canConfigureProfile(user);
  const showPainel = canViewPainel(user);
  const showProjetos = canViewProjects(user);
  const projectRows = useProjectNavIndex(showProjetos, user.tenantId);
  const showRelatorios = canViewReports(user);
  const showVetorAgent = canUseVetorAgent(user);
  const isPortalHome = pathname === '/portal';
  const relatoriosActive = pathname === '/portal/relatorios';
  const projetosActive = pathname === '/portal/projetos';
  const vetorAgentActive = pathname === '/portal/vetor-agent';
  const suporteActive = pathname === '/portal/chamados' || pathname.startsWith('/portal/chamados/');
  const despesasActive =
    pathname === '/portal/financeiro/despesas' ||
    pathname.startsWith('/portal/financeiro/despesas/');
  const contratosActive = pathname === '/portal/financeiro';
  const powerBiActive = pathname === '/portal/powerbi';
  const administradorActive = pathname === '/portal/administrador';
  const cadastroActive = isPortalHome && section === 'cadastro-usuario';
  const painelActive = isPortalHome && section === 'painel';

  useEffect(() => {
    const main = mainRef.current;

    if (!main) {
      return;
    }

    main.scrollTop = 0;
  }, [pathname, section]);

  const heading =
    pageTitle ??
    routeHeading(pathname, showRelatorios) ??
    (cadastroActive ? 'Cadastro' : showPainel ? 'Painel' : 'Portal');
  const mainIsFlush = flushMain || pathname === '/portal/vetor-agent';
  const mainClassName = mainIsFlush
    ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
    : 'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 md:px-10 md:py-5 lg:px-14';
  const navigationItems = [
    ...(showPainel
      ? [
          {
            active: painelActive,
            href: '/portal',
            icon: <PainelIcon />,
            label: 'Painel',
            onClick: () => openSection('painel'),
          },
        ]
      : []),
    ...(showRelatorios
      ? [
          {
            active: relatoriosActive,
            href: '/portal/relatorios',
            icon: <RelatoriosIcon />,
            label: 'Relatórios',
            onClick: closeMenu,
          },
        ]
      : []),
    ...(isAdministrador
      ? [
          {
            active: false,
            icon: <FinanceiroIcon />,
            label: 'Financeiro',
            onClick: () => setFinanceiroExpanded((current) => !current),
          },
          {
            active: powerBiActive,
            href: '/portal/powerbi',
            icon: <PowerBiIcon />,
            label: 'Power BI',
            onClick: closeMenu,
          },
          {
            active: administradorActive,
            href: '/portal/administrador',
            icon: <AdministradorIcon />,
            label: 'Administrador',
            onClick: closeMenu,
          },
        ]
      : []),
    {
      active: cadastroActive,
      icon: <UsersIcon />,
      label: 'Cadastro',
      onClick: openCadastro,
    },
    {
      active: suporteActive,
      href: '/portal/chamados',
      icon: <SuporteIcon />,
      label: 'Suporte',
      onClick: closeMenu,
    },
    ...(showVetorAgent
      ? [
          {
            active: vetorAgentActive,
            href: '/portal/vetor-agent',
            icon: <VetorAgentIcon />,
            label: 'Agente Beta',
            onClick: closeMenu,
          },
        ]
      : []),
    ...(showProjetos
      ? [
          {
            active: projetosActive,
            href: '/portal/projetos',
            icon: <ProjetosIcon />,
            label: 'Projetos',
            onClick: closeMenu,
          },
        ]
      : []),
  ];
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (item.label.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())) {
      return true;
    }

    if (item.label === 'Projetos' && projectNavMatchesQuery(projectRows, searchQuery)) {
      return true;
    }

    return item.label === 'Financeiro' && financeiroNavMatches(searchQuery);
  });

  function openSection(next: PortalSection) {
    if (next === 'painel') {
      clearPortalCadastroIntent();
    }

    setSection(next);
    setMenuOpen(false);
  }

  function openCadastro() {
    setMenuOpen(false);

    if (isPortalHome) {
      clearPortalCadastroIntent();
      setSection('cadastro-usuario');
      return;
    }

    rememberPortalCadastroIntent();
    setSection('cadastro-usuario');
    router.push('/portal');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-off-white font-sans text-text-dark">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-navy/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#e2e8f0] bg-white px-4 py-6 text-navy transition-transform dark:border-white/10 dark:bg-navy dark:text-white lg:static lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <PortalBrand />
        <div className="mt-8">
          <KanbanInputText
            label="Buscar na navegação"
            onChange={setSearchQuery}
            placeholder="Buscar..."
            value={searchQuery}
          />
        </div>
        <nav
          aria-label="Navegação do portal"
          className="mt-6 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
        >
          {filteredNavigationItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <KanbanSidebarItem
                active={item.active}
                className="w-full"
                expanded={item.label === 'Financeiro' ? financeiroExpanded : undefined}
                href={item.href}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
              />
              {item.label === 'Financeiro' &&
              (financeiroExpanded || financeiroNavMatches(searchQuery)) ? (
                <FinanceiroChildNav
                  contratosActive={contratosActive}
                  despesasActive={despesasActive}
                  expanded={financeiroExpanded}
                  onNavigate={closeMenu}
                  query={searchQuery}
                />
              ) : null}
              {item.label === 'Projetos' ? (
                <PortalProjectNav
                  onNavigate={closeMenu}
                  pathname={pathname}
                  query={searchQuery}
                  rows={projectRows}
                />
              ) : null}
            </div>
          ))}
        </nav>
        <div className="mt-6">
          <PortalUserFooter loggingOut={loggingOut} onLogout={onLogout} user={user} />
        </div>
      </aside>
      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-navy/10 px-3 py-3 sm:gap-4 sm:px-5 md:px-10 lg:px-14 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-text-dark/10 text-navy lg:hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
            <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-navy sm:text-xl md:text-2xl dark:text-white">
              {heading}
            </h1>
          </div>
          <SessionChip user={user} />
        </header>
        <main ref={mainRef} className={mainClassName}>
          {cadastroActive ? (
            <>
              <hr className="border-0 border-t border-navy/10 dark:border-white/10" />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {showCreate ? (
                  <ActionCard
                    icon={<CreateUserIcon />}
                    label="Cadastrar usuário"
                    onClick={() => setCreateOpen(true)}
                  />
                ) : null}
                <ActionCard
                  icon={<EditUserIcon />}
                  label="Editar usuário"
                  onClick={() => setEditOpen(true)}
                />
                {showPerfil ? (
                  <ActionCard
                    icon={<ConfigureProfileIcon />}
                    label="Configurar Perfil"
                    onClick={() => setPerfilOpen(true)}
                  />
                ) : null}
                {showCreateTenant ? (
                  <ActionCard
                    icon={<CreateTenantIcon />}
                    label="Cadastrar tenant"
                    onClick={() => setCreateTenantOpen(true)}
                  />
                ) : null}
                {showCreateTenant ? (
                  <ActionCard
                    icon={<ReplaceTenantPhotoIcon />}
                    label="Alterar foto da tenant"
                    onClick={() => setReplaceTenantPhotoOpen(true)}
                  />
                ) : null}
              </div>
            </>
          ) : children ? (
            children
          ) : showPainel ? (
            <p className="max-w-3xl text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-navy dark:text-white">
              Bem-vindo ao Portal Vector.
            </p>
          ) : null}
        </main>
      </div>
      <Modal
        labelledBy="cadastro-usuario-criar"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tone="light"
      >
        <h2 id="cadastro-usuario-criar" className="pr-10 text-2xl font-semibold text-navy">
          Cadastrar usuário
        </h2>
        <div className="mt-6">
          <PortalRegisterForm actor={user} onSuccess={() => setCreateOpen(false)} />
        </div>
      </Modal>
      <Modal
        labelledBy="cadastro-usuario-editar"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        tone="light"
      >
        <h2 id="cadastro-usuario-editar" className="pr-10 text-2xl font-semibold text-navy">
          Editar usuário
        </h2>
        <div className="mt-6">
          <PortalEditUserForm
            actor={user}
            onSaved={(session) => {
              if (session) {
                onUserUpdated(session);
              }

              setEditOpen(false);
            }}
          />
        </div>
      </Modal>
      <Modal
        labelledBy="cadastro-usuario-perfil"
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        tone="light"
      >
        <h2 id="cadastro-usuario-perfil" className="pr-10 text-2xl font-semibold text-navy">
          Perfil
        </h2>
        <div className="mt-6">
          <PortalConfigureProfileForm
            actor={user}
            onSaved={() => setPerfilOpen(false)}
            onSessionUpdated={onUserUpdated}
          />
        </div>
      </Modal>
      <Modal
        labelledBy="cadastro-tenant-criar"
        open={createTenantOpen}
        onClose={() => setCreateTenantOpen(false)}
        tone="light"
      >
        <h2 id="cadastro-tenant-criar" className="pr-10 text-2xl font-semibold text-navy">
          Cadastrar tenant
        </h2>
        <div className="mt-6">
          <PortalRegisterTenantForm
            onCancel={() => setCreateTenantOpen(false)}
            onSuccess={() => setCreateTenantOpen(false)}
          />
        </div>
      </Modal>
      <Modal
        labelledBy="cadastro-tenant-foto"
        open={replaceTenantPhotoOpen}
        onClose={() => setReplaceTenantPhotoOpen(false)}
        tone="light"
      >
        <h2 id="cadastro-tenant-foto" className="pr-10 text-2xl font-semibold text-navy">
          Alterar foto da tenant
        </h2>
        <div className="mt-6">
          <PortalReplaceTenantPhotoForm
            workingTenantId={user.tenantId}
            onCancel={() => setReplaceTenantPhotoOpen(false)}
            onSuccess={(tenantId) => {
              const refresh =
                tenantId === user.tenantId ? getSession().then(onUserUpdated) : Promise.resolve();
              void refresh.finally(() => setReplaceTenantPhotoOpen(false));
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
