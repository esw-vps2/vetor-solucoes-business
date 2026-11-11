import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import PortalFinanceiroPage from './financeiro/page';
import { PortalLayoutClient as PortalLayout } from '@/components/layout/portal-layout-client';
import PortalPage from './page';

const nav = vi.hoisted(() => ({
  pathname: '/portal',
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
  usePathname: () => nav.pathname,
  useRouter: () => ({
    push: nav.push,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const usuario: api.SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: ['painel'],
  firstName: 'Ana',
  id: 'user-id',
  lastName: 'Silva',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Usuario',
  sex: 'F',
  tenantId: 'tenant-id',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

describe('PortalLayout', () => {
  afterEach(() => {
    cleanup();
    nav.pathname = '/portal';
    nav.push.mockReset();
    vi.restoreAllMocks();
  });

  it('keeps the sidebar mounted while the main column changes', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    const view = render(
      <PortalLayout>
        <p>Painel body</p>
      </PortalLayout>,
    );

    expect(
      await screen.findByRole('navigation', { name: 'Navegação do portal' }),
    ).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: 'Navegação do portal' });
    const search = screen.getByRole('searchbox', { name: 'Buscar na navegação' });
    fireEvent.change(search, { target: { value: 'suporte' } });

    nav.pathname = '/portal/chamados';
    view.rerender(
      <PortalLayout>
        <p>Suporte body</p>
      </PortalLayout>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegação do portal' })).toBe(navigation);
    expect(screen.getByRole('searchbox', { name: 'Buscar na navegação' })).toHaveValue('suporte');
    expect(screen.getByRole('heading', { name: 'Suporte' })).toBeInTheDocument();
    expect(screen.getByText('Suporte body')).toBeInTheDocument();
    expect(screen.queryByText('Painel body')).not.toBeInTheDocument();
    expect(api.getSession).toHaveBeenCalledTimes(1);
  });

  it('renders a portal page once inside the persistent shell', async () => {
    nav.pathname = '/portal/financeiro';
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(
      <PortalLayout>
        <PortalFinanceiroPage />
      </PortalLayout>,
    );

    expect(await screen.findByRole('heading', { name: 'Contratos' })).toBeInTheDocument();
    expect(await screen.findByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Navegação do portal' })).toHaveLength(1);
    expect(api.getSession).toHaveBeenCalledTimes(1);
  });

  it('shows the home welcome through the persistent shell', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(
      <PortalLayout>
        <PortalPage />
      </PortalLayout>,
    );

    expect(await screen.findByText('Bem-vindo ao Portal Vector.')).toBeInTheDocument();
    expect(screen.getAllByText('Bem-vindo ao Portal Vector.')).toHaveLength(1);
    expect(screen.getAllByRole('navigation', { name: 'Navegação do portal' })).toHaveLength(1);
    expect(api.getSession).toHaveBeenCalledTimes(1);
  });

  it('opens the login page after logout', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    vi.spyOn(api, 'logout').mockResolvedValue();
    render(
      <PortalLayout>
        <PortalPage />
      </PortalLayout>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(nav.push).toHaveBeenCalledWith('/login');
    });
  });

  it('opens the login page when logout is already unauthorized', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    vi.spyOn(api, 'logout').mockRejectedValue(new api.ApiError('Invalid session.', 401));
    render(
      <PortalLayout>
        <PortalPage />
      </PortalLayout>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(nav.push).toHaveBeenCalledWith('/login');
    });
  });

  it('stays in the portal when logout fails for another reason', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    vi.spyOn(api, 'logout').mockRejectedValue(new api.ApiError('Service unavailable.', 503));
    render(
      <PortalLayout>
        <PortalPage />
      </PortalLayout>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(api.logout).toHaveBeenCalledOnce();
      expect(screen.getByRole('button', { name: 'Sair' })).toBeEnabled();
    });
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('leaves the password reset route outside the shell', () => {
    nav.pathname = '/portal/change-password';
    const session = vi.spyOn(api, 'getSession');
    render(
      <PortalLayout>
        <p>Troca de senha</p>
      </PortalLayout>,
    );

    expect(screen.getByText('Troca de senha')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Navegação do portal' }),
    ).not.toBeInTheDocument();
    expect(session).not.toHaveBeenCalled();
  });
});
