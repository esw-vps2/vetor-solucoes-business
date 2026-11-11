export const EXPENSE_TYPES = ['fixed', 'variable', 'occasional'] as const;
export const EXPENSE_STATUSES = ['pending', 'paid', 'cancelled'] as const;
export const EXPENSE_INTERVALS = ['monthly', 'yearly'] as const;
export const EXPENSE_SORTS = [
  'description',
  'category',
  'supplier',
  'competence',
  'dueOn',
  'amount',
  'status',
  'recurrence',
] as const;
export const CREATE_EXPENSE_STATUSES = ['pending', 'paid'] as const;
export const EXPENSE_SCOPES = ['occurrence', 'series'] as const;

export const MAX_EXPENSE_AMOUNT_CENTS = 99999999999;
export const MAX_EXPENSE_PAGE_LIMIT = 100;
export const DEFAULT_EXPENSE_PAGE_LIMIT = 20;
export const MAX_SERIES_COUNT = 120;
export const MAX_EXPENSE_DOCUMENTS = 20;
export const MAX_EXPENSE_DOCUMENT_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_CATEGORY_NAME = 80;
export const MAX_DESCRIPTION = 160;
export const MAX_NOTES = 2000;
export const MAX_PAYMENT_METHOD = 80;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type ExpenseInterval = (typeof EXPENSE_INTERVALS)[number];
export type ExpenseSort = (typeof EXPENSE_SORTS)[number];
export type ExpenseScope = (typeof EXPENSE_SCOPES)[number];
