import type { ExpenseInterval, ExpenseSort, ExpenseStatus, ExpenseType } from './expense.constants.js';

export interface ExpenseListRow {
  amountCents: number;
  categoryId: string;
  categoryName: string;
  clientTenantId: string | null;
  clientTenantName: string | null;
  competenceMonth: string;
  createdAt: string;
  description: string;
  dueOn: string | null;
  expenseType: ExpenseType;
  id: string;
  notes: string | null;
  paidOn: string | null;
  paymentMethod: string | null;
  projectId: string | null;
  projectName: string | null;
  recurrence: ExpenseInterval | null;
  seriesDetached: boolean;
  seriesId: string | null;
  seriesIndex: number | null;
  status: ExpenseStatus;
  subcategoryId: string | null;
  subcategoryName: string | null;
  supplierName: string | null;
  updatedAt: string;
}

export interface ExpenseQuery {
  categoryId?: string;
  competence: string;
  direction: 'asc' | 'desc';
  limit: number;
  page: number;
  projectId?: string;
  q?: string;
  sort: ExpenseSort;
  status?: ExpenseStatus;
  subcategoryId?: string;
  supplier?: string;
  type?: ExpenseType;
}

export interface ExpenseSummary {
  count: number;
  paidTotalCents: number;
  pendingTotalCents: number;
  periodTotalCents: number;
}

function contains(value: string | null, needle: string): boolean {
  return (value ?? '').toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

function matchesDimensions(
  row: ExpenseListRow,
  query: ExpenseQuery,
  options: { competence: boolean; status: boolean },
): boolean {
  if (options.competence && row.competenceMonth !== query.competence) {
    return false;
  }

  if (query.categoryId && row.categoryId !== query.categoryId) {
    return false;
  }

  if (query.subcategoryId && row.subcategoryId !== query.subcategoryId) {
    return false;
  }

  if (options.status && query.status && row.status !== query.status) {
    return false;
  }

  if (query.supplier && !contains(row.supplierName, query.supplier)) {
    return false;
  }

  if (query.type && row.expenseType !== query.type) {
    return false;
  }

  if (query.projectId && row.projectId !== query.projectId) {
    return false;
  }

  if (query.q && !contains(row.description, query.q) && !contains(row.supplierName, query.q)) {
    return false;
  }

  return true;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
}

function compareNullableDate(
  left: string | null,
  right: string | null,
  direction: 'asc' | 'desc',
): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  const order = left < right ? -1 : left > right ? 1 : 0;
  return direction === 'desc' ? -order : order;
}

function compareField(
  left: ExpenseListRow,
  right: ExpenseListRow,
  sort: ExpenseSort,
  direction: 'asc' | 'desc',
): number {
  if (sort === 'dueOn') {
    return compareNullableDate(left.dueOn, right.dueOn, direction);
  }

  if (sort === 'amount') {
    const order = left.amountCents - right.amountCents;
    return direction === 'desc' ? -order : order;
  }

  const leftValue =
    sort === 'description'
      ? left.description
      : sort === 'category'
        ? left.categoryName
        : sort === 'supplier'
          ? (left.supplierName ?? '')
          : sort === 'competence'
            ? left.competenceMonth
            : sort === 'status'
              ? left.status
              : (left.recurrence ?? '');
  const rightValue =
    sort === 'description'
      ? right.description
      : sort === 'category'
        ? right.categoryName
        : sort === 'supplier'
          ? (right.supplierName ?? '')
          : sort === 'competence'
            ? right.competenceMonth
            : sort === 'status'
              ? right.status
              : (right.recurrence ?? '');
  const order = compareText(leftValue, rightValue);
  return direction === 'desc' ? -order : order;
}

function compareRows(left: ExpenseListRow, right: ExpenseListRow, query: ExpenseQuery): number {
  const primary = compareField(left, right, query.sort, query.direction);

  if (primary !== 0) {
    return primary;
  }

  const competence = compareText(right.competenceMonth, left.competenceMonth);

  if (competence !== 0) {
    return competence;
  }

  const due = compareNullableDate(left.dueOn, right.dueOn, 'asc');

  if (due !== 0) {
    return due;
  }

  const description = compareText(left.description, right.description);

  if (description !== 0) {
    return description;
  }

  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

export function queryExpenses(rows: ExpenseListRow[], query: ExpenseQuery) {
  const tableRows = rows.filter((row) => matchesDimensions(row, query, { competence: true, status: true }));
  const sorted = tableRows.toSorted((left, right) => compareRows(left, right, query));
  const start = (query.page - 1) * query.limit;
  const competenceRows = tableRows.filter((row) => row.status !== 'cancelled');
  const paidTotalCents =
    query.status === 'pending' || query.status === 'cancelled'
      ? 0
      : rows
          .filter(
            (row) =>
              row.status === 'paid' &&
              row.paidOn?.slice(0, 7) === query.competence &&
              matchesDimensions(row, query, { competence: false, status: false }),
          )
          .reduce((total, row) => total + row.amountCents, 0);

  return {
    items: sorted.slice(start, start + query.limit).map((row) => {
      const { notes: _notes, ...item } = row;
      return item;
    }),
    limit: query.limit,
    page: query.page,
    summary: {
      count: competenceRows.length,
      paidTotalCents,
      pendingTotalCents: competenceRows
        .filter((row) => row.status === 'pending')
        .reduce((total, row) => total + row.amountCents, 0),
      periodTotalCents: competenceRows.reduce((total, row) => total + row.amountCents, 0),
    } satisfies ExpenseSummary,
    total: tableRows.length,
  };
}
