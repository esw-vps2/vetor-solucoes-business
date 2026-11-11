import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PortalShell } from '@/components/layout/portal-shell';
import * as api from '@/lib/api/client';
import { ExpensesHome } from './expenses-home';

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

const usuario: api.SafeUser = { ...admin, profile: 'Usuario' };
const tenantAdmin: api.SafeUser = { ...admin, profile: 'AdministradorTenant' };

const emptyList: api.ExpenseList = {
  items: [],
  limit: 20,
  page: 1,
  summary: { count: 0, paidTotalCents: 0, pendingTotalCents: 0, periodTotalCents: 0 },
  total: 0,
};

function renderHome(user: api.SafeUser, notice?: string) {
  return render(
    <PortalShell loggingOut={false} onLogout={vi.fn()} onUserUpdated={vi.fn()} pageTitle="Custos e Despesas" user={user}>
      <ExpensesHome notice={notice} user={user} />
    </PortalShell>,
  );
}

describe('ExpensesHome', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hides figures while the list is loading and after an error', async () => {
    vi.spyOn(api, 'listExpenses').mockImplementation(() => new Promise(() => undefined));
    vi.spyOn(api, 'listExpenseCategories').mockResolvedValue([]);
    vi.spyOn(api, 'listExpenseAssociations').mockResolvedValue({ projects: [], tenants: [] });
    renderHome(admin);
    expect(screen.getByRole('heading', { name: 'Custos e Despesas' })).toBeInTheDocument();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.getByText('Lançamentos').parentElement?.textContent).not.toContain('0');
    cleanup();
    vi.spyOn(api, 'listExpenses').mockRejectedValue(new Error('failed'));
    vi.spyOn(api, 'listExpenseCategories').mockResolvedValue([]);
    vi.spyOn(api, 'listExpenseAssociations').mockResolvedValue({ projects: [], tenants: [] });
    renderHome(admin);
    expect(await screen.findByText('Não foi possível concluir a operação.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it('shows the empty ledger and payment-date caption after a successful response', async () => {
    vi.spyOn(api, 'listExpenses').mockResolvedValue(emptyList);
    vi.spyOn(api, 'listExpenseCategories').mockResolvedValue([]);
    vi.spyOn(api, 'listExpenseAssociations').mockResolvedValue({ projects: [], tenants: [] });
    renderHome(admin, 'Série salva. 3 lançamentos projetados.');
    expect(
      await screen.findByText('Nenhuma despesa cadastrada. Use Nova despesa para registrar a primeira.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Data de pagamento')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova despesa' })).toHaveAttribute(
      'href',
      '/portal/financeiro/despesas/nova',
    );
    expect(screen.getByText('Série salva. 3 lançamentos projetados.')).toBeInTheDocument();
  });

  it('sends filters to the server and clears them', async () => {
    const list = vi.spyOn(api, 'listExpenses').mockResolvedValue(emptyList);
    vi.spyOn(api, 'listExpenseCategories').mockResolvedValue([]);
    vi.spyOn(api, 'listExpenseAssociations').mockResolvedValue({ projects: [], tenants: [] });
    renderHome(admin);
    await screen.findByText('Nenhuma despesa cadastrada. Use Nova despesa para registrar a primeira.');
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'pending' } });
    await screen.findByText('Nenhum lançamento para os filtros selecionados.');
    expect(list).toHaveBeenLastCalledWith(expect.stringContaining('status=pending'));
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await screen.findByText('Nenhuma despesa cadastrada. Use Nova despesa para registrar a primeira.');
  });

  it('denies other profiles', () => {
    renderHome(usuario);
    expect(screen.getByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    cleanup();
    renderHome(tenantAdmin);
    expect(screen.getByText('Você não tem acesso ao financeiro.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
  });
});
