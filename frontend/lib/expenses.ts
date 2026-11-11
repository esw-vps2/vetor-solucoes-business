import { formatCentsBRL, parseReaisToCents } from './finance';

export const EXPENSE_PAGE_LIMIT = 20;

export type ExpenseType = 'fixed' | 'variable' | 'occasional';
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';
export type ExpenseInterval = 'monthly' | 'yearly';
export type ExpenseSort =
  | 'description'
  | 'category'
  | 'supplier'
  | 'competence'
  | 'dueOn'
  | 'amount'
  | 'status'
  | 'recurrence';

export interface ExpenseFilters {
  categoryId: string;
  competence: string;
  direction: 'asc' | 'desc';
  page: number;
  projectId: string;
  q: string;
  sort: ExpenseSort;
  status: '' | ExpenseStatus;
  subcategoryId: string;
  supplier: string;
  type: '' | ExpenseType;
}

export function currentCompetenceMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

export function defaultExpenseFilters(now = new Date()): ExpenseFilters {
  return {
    categoryId: '',
    competence: currentCompetenceMonth(now),
    direction: 'desc',
    page: 1,
    projectId: '',
    q: '',
    sort: 'competence',
    status: '',
    subcategoryId: '',
    supplier: '',
    type: '',
  };
}

export function expenseMonthOptions(now = new Date()): string[] {
  const [yearText, monthText] = currentCompetenceMonth(now).split('-');
  const cursor = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 - 24, 1));
  return Array.from({ length: 145 }, () => {
    const month = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    return month;
  });
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function competenceLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  return `${MONTHS[Number(monthNumber) - 1] ?? month} ${year}`;
}

export function competenceShort(month: string): string {
  const [year, monthNumber] = month.split('-');
  return `${SHORT_MONTHS[Number(monthNumber) - 1] ?? month}/${year}`;
}

export function formatIsoDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function expenseTypeLabel(value: string | null): string {
  if (value === 'fixed') {
    return 'Fixa';
  }

  if (value === 'variable') {
    return 'Variável';
  }

  if (value === 'occasional') {
    return 'Eventual';
  }

  return '—';
}

export function expenseStatusLabel(value: string): string {
  if (value === 'paid') {
    return 'Pago';
  }

  if (value === 'cancelled') {
    return 'Cancelado';
  }

  return 'Pendente';
}

export function recurrenceLabel(value: string | null): string {
  if (value === 'monthly') {
    return 'Mensal';
  }

  if (value === 'yearly') {
    return 'Anual';
  }

  return '—';
}

export function expenseQueryString(filters: ExpenseFilters): string {
  const params = new URLSearchParams();
  params.set('competence', filters.competence);
  params.set('page', String(filters.page));
  params.set('limit', String(EXPENSE_PAGE_LIMIT));
  params.set('sort', filters.sort);
  params.set('direction', filters.direction);

  if (filters.categoryId) {
    params.set('categoryId', filters.categoryId);
  }

  if (filters.subcategoryId) {
    params.set('subcategoryId', filters.subcategoryId);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.supplier.trim()) {
    params.set('supplier', filters.supplier.trim());
  }

  if (filters.type) {
    params.set('type', filters.type);
  }

  if (filters.projectId) {
    params.set('projectId', filters.projectId);
  }

  if (filters.q.trim()) {
    params.set('q', filters.q.trim());
  }

  return params.toString();
}

export function filtersAreDefault(filters: ExpenseFilters, now = new Date()): boolean {
  const defaults = defaultExpenseFilters(now);
  return (
    filters.categoryId === defaults.categoryId &&
    filters.competence === defaults.competence &&
    filters.projectId === defaults.projectId &&
    filters.q.trim() === '' &&
    filters.status === '' &&
    filters.subcategoryId === '' &&
    filters.supplier.trim() === '' &&
    filters.type === ''
  );
}

export interface ExpenseFormInput {
  amount: string;
  categoryId: string;
  clientTenantId: string;
  competenceMonth: string;
  count: string;
  description: string;
  dueOn: string;
  expenseType: string;
  notes: string;
  paidOn: string;
  paymentMethod: string;
  projectId: string;
  recurring: boolean;
  scope: '' | 'occurrence' | 'series';
  seriesFollows: boolean;
  startsOn: string;
  status: string;
  subcategoryId: string;
  supplierName: string;
  interval: string;
}

export function validateExpenseForm(input: ExpenseFormInput): string | null {
  if (input.description.trim().length < 1 || input.description.trim().length > 160) {
    return 'Informe a descrição.';
  }

  if (!input.categoryId) {
    return 'Selecione a categoria.';
  }

  const cents = parseReaisToCents(input.amount);

  if (cents == null || cents < 1) {
    return 'Informe um valor válido em reais.';
  }

  if (!input.expenseType) {
    return 'Selecione o tipo de despesa.';
  }

  if (input.seriesFollows && !input.scope) {
    return 'Selecione se a alteração vale para este lançamento ou para a série.';
  }

  if (input.recurring) {
    return validateSeriesBounds(input, true);
  }

  if (input.scope === 'series') {
    return validateSeriesBounds(input, false);
  }

  if (!/^\d{4}-\d{2}$/.test(input.competenceMonth)) {
    return 'Informe a competência.';
  }

  if (input.status === 'pending' && input.paidOn) {
    return 'A data de pagamento só pode ser informada quando a despesa estiver paga.';
  }

  if (input.status === 'paid' && !/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) {
    return 'Informe a data de pagamento.';
  }

  return null;
}

export function reaisFromCents(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return `${whole},${fraction}`;
}

function validateSeriesBounds(input: ExpenseFormInput, required: boolean): string | null {
  if (!input.count.trim()) {
    return required ? 'Informe um número entre 1 e 120.' : null;
  }

  if (!/^\d{1,3}$/.test(input.count.trim())) {
    return 'Informe um número entre 1 e 120.';
  }

  const count = Number(input.count);

  if (count < 1 || count > 120) {
    return 'Informe um número entre 1 e 120.';
  }

  if (required && !/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn)) {
    return 'Informe a data de início do pagamento.';
  }

  if (input.startsOn && !/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn)) {
    return 'Informe a data de início do pagamento.';
  }

  return null;
}

export { formatCentsBRL };
