import {
  FINANCE_DOCUMENT_EXTENSIONS,
  financeDocumentExtension,
  type FinanceDocumentMime,
} from '../projects/finance-document-file.js';

const EXPENSE_DOCUMENT_POINTER = new RegExp(
  `^expenses/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${FINANCE_DOCUMENT_EXTENSIONS.join('|')})$`,
  'i',
);

export function expenseDocumentPointerFor(
  expenseId: string,
  documentId: string,
  mime: FinanceDocumentMime,
): string {
  return `expenses/${expenseId}/${documentId}.${financeDocumentExtension(mime)}`;
}

export function isExpenseDocumentPointer(value: string): boolean {
  return EXPENSE_DOCUMENT_POINTER.test(value);
}
