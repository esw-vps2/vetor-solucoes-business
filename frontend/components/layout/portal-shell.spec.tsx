import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import type { SafeUser } from '@/lib/api/client';
import { notifyProjectNavRefresh } from '@/lib/project-nav-refresh';
import { PORTAL_CADASTRO_INTENT_KEY } from '@/lib/portal-cadastro';
import { PortalShell } from './portal-shell';

const nav = vi.hoisted(() => ({
  pathname: '/portal/projetos',
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push }),
}));

const administrador: SafeUser = {
  age: 32,
  cargo: 'Product Manager',
  email: 'admin@vetor.tech',
  enabledActions: [],
  firstName: 'Admin',
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  sex: 'M',
  tenantId: 'vetor-tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

const usuario: SafeUser = {
  ...administrador,
  enabledActions: [],
  firstName: 'Usuário',
  lastName: 'Portal',
  profile: 'Usuario',
};

describe('PortalShell', () => {
  afterEach(() => {
    cleanup();
    nav.pathname = '/portal/projetos';
    nav.push.mockReset();
    sessionStorage.removeItem(PORTAL_CADASTRO_INTENT_KEY);
    localStorage.removeItem('portalTheme:v1');
  });

  it('renders a flush main column without page padding or document scroll', () => {
    render(
      <PortalShell
        flushMain
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Vetor Agent"
        user={usuario}
      >
        <p>Workspace</p>
      </PortalShell>,
    );

    const main = screen.getByRole('main');
    expect(main.className).toContain('overflow-hidden');
    expect(main.className).not.toContain('overflow-y-auto');
    expect(main.className).not.toContain('px-3');
    expect(screen.getByRole('heading', { name: 'Vetor Agent' })).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('places Suporte below Cadastro, Vetor Agent below Suporte, and Projetos below Vetor Agent', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    const cadastro = screen.getByRole('button', { name: 'Cadastro' });
    const suporte = screen.getByRole('link', { name: 'Suporte' });
    const vetorAgent = screen.getByRole('link', { name: 'Agente Beta' });
    const projetos = screen.getByRole('link', { name: 'Projetos' });

    expect(cadastro.compareDocumentPosition(suporte) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(suporte.compareDocumentPosition(vetorAgent) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(vetorAgent.compareDocumentPosition(projetos) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('opens Cadastro after leaving Projetos', () => {
    const view = render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Projetos"
        user={administrador}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    expect(nav.push).toHaveBeenCalledWith('/portal');
    expect(sessionStorage.getItem(PORTAL_CADASTRO_INTENT_KEY)).toBe('1');

    view.unmount();
    nav.pathname = '/portal';
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastro' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens Cadastro without remounting the shell when the route returns home', () => {
    nav.pathname = '/portal/projetos';
    const view = render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Projetos"
        user={administrador}
      />,
    );
    const navigation = screen.getByRole('navigation', { name: 'Navegação do portal' });

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    nav.pathname = '/portal';
    view.rerender(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Navegação do portal' })).toBe(navigation);
    expect(screen.getByRole('heading', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastro' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByText('Bem-vindo ao Portal Vector.')).not.toBeInTheDocument();
  });

  it('nests Contratos under Financeiro without navigating from the parent', () => {
    nav.pathname = '/portal/financeiro';

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    const relatorios = screen.getByRole('link', { name: 'Relatórios' });
    const financeiro = screen.getByRole('button', { name: 'Financeiro' });
    const contratos = screen.getByRole('link', { name: 'Contratos' });
    const powerBi = screen.getByRole('link', { name: 'Power BI' });

    expect(relatorios.compareDocumentPosition(financeiro) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(financeiro.compareDocumentPosition(powerBi) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(financeiro.querySelector('svg')).not.toBeNull();
    expect(financeiro).toHaveAttribute('aria-expanded', 'true');
    expect(financeiro).not.toHaveAttribute('aria-current');
    expect(contratos).toHaveAttribute('href', '/portal/financeiro');
    expect(contratos).toHaveAttribute('aria-current', 'page');
    expect(contratos.querySelector('svg')).toBeNull();
    expect(contratos.className).not.toContain('w-[280px]');
    const despesas = screen.getByRole('link', { name: 'Custos e Despesas' });
    expect(contratos.compareDocumentPosition(despesas) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(despesas).toHaveAttribute('href', '/portal/financeiro/despesas');
    expect(despesas).not.toHaveAttribute('aria-current');
    expect(despesas.querySelector('svg')).toBeNull();

    fireEvent.click(financeiro);

    expect(nav.push).not.toHaveBeenCalled();
    expect(financeiro).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Custos e Despesas' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    fireEvent.click(financeiro);
    fireEvent.click(screen.getByRole('link', { name: 'Contratos' }));

    expect(screen.queryByRole('button', { name: 'Fechar menu' })).not.toBeInTheDocument();
  });

  it('opens Financeiro children only from the Financeiro button', () => {
    nav.pathname = '/portal/powerbi';

    const view = render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Power BI"
        user={administrador}
      />,
    );

    const financeiro = screen.getByRole('button', { name: 'Financeiro' });
    const powerBi = screen.getByRole('link', { name: 'Power BI' });

    expect(financeiro).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Custos e Despesas' })).not.toBeInTheDocument();

    fireEvent.click(powerBi);

    expect(financeiro).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();

    view.unmount();
    nav.pathname = '/portal';
    const home = render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    expect(screen.getByRole('link', { name: 'Contratos' })).toBeInTheDocument();

    home.unmount();
    nav.pathname = '/portal/powerbi';
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Power BI"
        user={administrador}
      />,
    );

    expect(screen.getByRole('button', { name: 'Financeiro' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));

    expect(screen.getByRole('button', { name: 'Financeiro' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute(
      'href',
      '/portal/financeiro',
    );
    expect(screen.getByRole('link', { name: 'Custos e Despesas' })).toHaveAttribute(
      'href',
      '/portal/financeiro/despesas',
    );
  });

  it('keeps Financeiro visible when the search matches Contratos', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.getByRole('button', { name: 'Financeiro' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar na navegação' }), {
      target: { value: 'contratos' },
    });

    expect(screen.getByRole('button', { name: 'Financeiro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute(
      'href',
      '/portal/financeiro',
    );
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar na navegação' }), {
      target: { value: 'xyz' },
    });

    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
  });

  it('shows Custos e Despesas from search and marks that route current', () => {
    nav.pathname = '/portal/financeiro/despesas';

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        pageTitle="Custos e Despesas"
        user={administrador}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Custos e Despesas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Custos e Despesas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Contratos' })).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar na navegação' }), {
      target: { value: 'custos' },
    });

    expect(screen.getByRole('link', { name: 'Custos e Despesas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
  });

  it('filters visible navigation items by label without changing the route', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar na navegação' }), {
      target: { value: 'projet' },
    });

    expect(screen.getByRole('link', { name: 'Projetos' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('lists created projects as a tree under Projetos', async () => {
    nav.pathname = '/portal/projetos/proj-1';
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Entrega', tenantId: 'vetor-tenant-id' },
      { id: 'ws-empty', name: 'Vazia', tenantId: 'vetor-tenant-id' },
    ]);
    vi.spyOn(api, 'listWorkspaceProjects').mockImplementation(async (workspaceId) =>
      workspaceId === 'ws-1'
        ? [{ id: 'proj-1', name: 'Chat para Eventos', workspaceId: 'ws-1' }]
        : [],
    );

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(await screen.findByRole('link', { name: 'Chat para Eventos' })).toHaveAttribute(
      'href',
      '/portal/projetos/proj-1',
    );
    expect(screen.getByRole('link', { name: 'Chat para Eventos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Entrega')).toBeInTheDocument();
    expect(screen.queryByText('Vazia')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projetos' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps Projetos visible when the search matches a created project', async () => {
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Entrega', tenantId: 'vetor-tenant-id' },
    ]);
    vi.spyOn(api, 'listWorkspaceProjects').mockResolvedValue([
      { id: 'proj-1', name: 'Chat para Eventos', workspaceId: 'ws-1' },
      { id: 'proj-2', name: 'Site', workspaceId: 'ws-1' },
    ]);

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(await screen.findByRole('link', { name: 'Chat para Eventos' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar na navegação' }), {
      target: { value: 'chat' },
    });

    expect(screen.getByRole('link', { name: 'Projetos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chat para Eventos' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Site' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();
  });

  it('refreshes the project tree when a project is saved', async () => {
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Entrega', tenantId: 'vetor-tenant-id' },
    ]);
    vi.spyOn(api, 'listWorkspaceProjects')
      .mockResolvedValueOnce([{ id: 'proj-1', name: 'Antigo', workspaceId: 'ws-1' }])
      .mockResolvedValueOnce([{ id: 'proj-1', name: 'Novo', workspaceId: 'ws-1' }]);

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(await screen.findByRole('link', { name: 'Antigo' })).toBeInTheDocument();
    notifyProjectNavRefresh();
    expect(await screen.findByRole('link', { name: 'Novo' })).toBeInTheDocument();
  });

  it('preserves permission-based navigation visibility', () => {
    nav.pathname = '/portal';

    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={usuario}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Relatórios' })).not.toBeInTheDocument();
    expect(screen.queryByText('Bem-vindo ao Portal Vector.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Projetos' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suporte' })).toHaveAttribute(
      'href',
      '/portal/chamados',
    );
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Power BI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agente Beta' })).not.toBeInTheDocument();
  });

  it('shows Vetor Agent only when the session action is effective', () => {
    const { rerender } = render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={usuario}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Agente Beta' })).not.toBeInTheDocument();

    rerender(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={{ ...usuario, enabledActions: ['vetorAgent'] }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Agente Beta' })).toHaveAttribute(
      'href',
      '/portal/vetor-agent',
    );

    rerender(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.getByRole('link', { name: 'Agente Beta' })).toHaveAttribute(
      'href',
      '/portal/vetor-agent',
    );

    rerender(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={{ ...usuario, enabledActions: [], profile: 'AdministradorTenant' }}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Agente Beta' })).not.toBeInTheDocument();
  });

  it('renders the authenticated user context and invokes logout', () => {
    const onLogout = vi.fn();

    render(
      <PortalShell
        loggingOut={false}
        onLogout={onLogout}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.getAllByText('Admin Vetor')).toHaveLength(1);
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administrador' })).toHaveAttribute(
      'href',
      '/portal/administrador',
    );
    expect(screen.getByText('VETOR')).toBeInTheDocument();
    expect(screen.getByText('VE')).toBeInTheDocument();
    expect(screen.getByText('BUSINESS & TECHNOLOGY')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sair/ }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('opens and closes the mobile navigation overlay', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(screen.queryByRole('button', { name: 'Fechar menu' })).not.toBeInTheDocument();
  });

  it('does not render numeric navigation badges', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('shows the tenant photo in the header and only cargo in the footer', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={{
          ...administrador,
          cargo: '',
          tenantPhotoUrl: '/api/v1/tenants/vetor-tenant-id/photo',
        }}
      />,
    );

    const tenantPhotos = screen.getAllByRole('img', { name: 'VETOR' });
    expect(
      tenantPhotos.some((img) =>
        img.getAttribute('src')?.includes('/api/v1/tenants/vetor-tenant-id/photo'),
      ),
    ).toBe(true);
    expect(screen.queryByText('VE')).not.toBeInTheDocument();
    expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Admin Vetor' })).toHaveLength(1);
  });

  it('does not render a theme toggle in the sidebar', () => {
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Modo escuro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modo claro' })).not.toBeInTheDocument();
  });

  it('hides tenant photo replacement from Usuario', () => {
    nav.pathname = '/portal';
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={usuario}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
  });

  it('uses the standard light form layout for user registration', () => {
    nav.pathname = '/portal';
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={() => undefined}
        user={administrador}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('bg-white');
    expect(dialog.className).toContain('text-navy');
    expect(dialog.className).toContain('md:max-w-xl');
    expect(screen.getByRole('heading', { name: 'Cadastrar usuário' }).className).toContain(
      'text-navy',
    );
    expect(screen.getByLabelText('Nome').className).toContain('bg-white');
  });

  it('reloads the session after replacing the working tenant photo', async () => {
    nav.pathname = '/portal';
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: administrador.tenantId, name: 'VETOR', slug: 'vetor' },
    ]);
    vi.spyOn(api, 'replaceTenantPhoto').mockResolvedValue(undefined);
    const refreshed = {
      ...administrador,
      tenantPhotoUrl: '/api/v1/tenants/vetor-tenant-id/photo',
    };
    vi.spyOn(api, 'getSession').mockResolvedValue(refreshed);
    const onUserUpdated = vi.fn();
    const photo = new File([Uint8Array.from([137, 80, 78, 71])], 'mark.png', {
      type: 'image/png',
    });
    render(
      <PortalShell
        loggingOut={false}
        onLogout={() => undefined}
        onUserUpdated={onUserUpdated}
        user={administrador}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alterar foto da tenant' }));
    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [photo] } });
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    await waitFor(() => {
      expect(onUserUpdated).toHaveBeenCalledWith(refreshed);
    });
    expect(
      screen.queryByRole('heading', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
  });
});
