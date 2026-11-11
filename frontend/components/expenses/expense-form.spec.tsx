import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { ExpenseForm } from './expense-form';

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

describe('ExpenseForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('blocks a one-off save until the required fields are valid', async () => {
    vi.spyOn(api, 'listExpenseCategories').mockResolvedValue([
      {
        active: true,
        expenseCount: 0,
        id: 'category',
        name: 'Infraestrutura e Cloud',
        position: 1,
        slug: 'infraestrutura-e-cloud',
        subcategories: [],
      },
    ]);
    vi.spyOn(api, 'listExpenseAssociations').mockResolvedValue({ projects: [], tenants: [] });
    const create = vi.spyOn(api, 'createExpense');
    render(<ExpenseForm user={admin} />);
    expect(await screen.findByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe a descrição.');
    expect(create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), { target: { value: 'AWS' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione a categoria.');
  });
});
