import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import PortalFinanceiroPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/financeiro',
  useRouter: () => ({ push: vi.fn() }),
}));

const admin: api.SafeUser = {
  age: 40,
  email: 'admin@example.com',
  enabledActions: [],
  firstName: 'Admin',
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  sex: 'M',
  tenantId: 'tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

const usuario: api.SafeUser = {
  ...admin,
  email: 'ana@example.com',
  firstName: 'Ana',
  id: 'user-id',
  profile: 'Usuario',
  tenantName: 'Acme',
};

const tenantAdmin: api.SafeUser = {
  ...usuario,
  profile: 'AdministradorTenant',
};

const emptyList: api.FinanceList = {
  projects: [],
  totals: {
    contractedResultAmountCents: 0,
    costAmountCents: 0,
    openAmountCents: 0,
    paidAmountCents: 0,
    resultAmountCents: 0,
    totalAmountCents: 0,
  },
};

describe('PortalFinanceiroPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens the finance screen under Contratos and marks that link current', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(admin);
    vi.spyOn(api, 'listFinanceProjects').mockResolvedValue(emptyList);
    render(<PortalFinanceiroPage />);

    expect(await screen.findByRole('heading', { name: 'Contratos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute(
      'href',
      '/portal/financeiro',
    );
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Financeiro' })).not.toHaveAttribute('aria-current');
    expect(await screen.findByText('Valor do contrato')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo Projeto' })).toBeInTheDocument();
  });

  it('keeps the denial copy for profiles that cannot open finance', async () => {
    const list = vi.spyOn(api, 'listFinanceProjects');
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    const view = render(<PortalFinanceiroPage />);

    expect(await screen.findByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contratos' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();

    view.unmount();
    vi.spyOn(api, 'getSession').mockResolvedValue(tenantAdmin);
    render(<PortalFinanceiroPage />);

    expect(await screen.findByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });
});
