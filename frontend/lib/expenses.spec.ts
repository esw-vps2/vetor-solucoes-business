import { describe, expect, it } from 'vitest';
import {
  competenceLabel,
  competenceShort,
  currentCompetenceMonth,
  expenseQueryString,
  validateExpenseForm,
  type ExpenseFormInput,
} from './expenses';

const form = (overrides: Partial<ExpenseFormInput> = {}): ExpenseFormInput => ({
  amount: '10,00',
  categoryId: 'category',
  clientTenantId: '',
  competenceMonth: '2026-10',
  count: '3',
  description: 'AWS',
  dueOn: '',
  expenseType: 'fixed',
  interval: 'monthly',
  notes: '',
  paidOn: '',
  paymentMethod: '',
  projectId: '',
  recurring: false,
  scope: '',
  seriesFollows: false,
  startsOn: '2026-10-27',
  status: 'pending',
  subcategoryId: '',
  supplierName: '',
  ...overrides,
});

describe('expense form helpers', () => {
  it('formats the Sao Paulo month', () => {
    expect(currentCompetenceMonth(new Date('2026-10-27T02:30:00.000Z'))).toBe('2026-10');
    expect(competenceLabel('2026-10')).toBe('Outubro 2026');
    expect(competenceShort('2026-10')).toBe('Out/2026');
  });

  it('sends the list query and blocks invalid money and dates', () => {
    expect(expenseQueryString({
      categoryId: '',
      competence: '2026-10',
      direction: 'desc',
      page: 1,
      projectId: '',
      q: ' aws ',
      sort: 'competence',
      status: '',
      subcategoryId: '',
      supplier: '',
      type: '',
    })).toContain('q=aws');
    expect(validateExpenseForm(form({ amount: '0,00' }))).toBe('Informe um valor válido em reais.');
    expect(validateExpenseForm(form({ expenseType: '' }))).toBe('Selecione o tipo de despesa.');
    expect(validateExpenseForm(form({ competenceMonth: '' }))).toBe('Informe a competência.');
    expect(validateExpenseForm(form({ paidOn: '2026-10-27', status: 'pending' }))).toBe(
      'A data de pagamento só pode ser informada quando a despesa estiver paga.',
    );
    expect(validateExpenseForm(form({ status: 'paid' }))).toBe('Informe a data de pagamento.');
    expect(validateExpenseForm(form({ seriesFollows: true }))).toBe(
      'Selecione se a alteração vale para este lançamento ou para a série.',
    );
    expect(validateExpenseForm(form())).toBeNull();
  });
});
