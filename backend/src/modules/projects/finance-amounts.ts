export const MAX_MONEY_CENTS = 99999999999;
export const MAX_FINANCE_ENTRIES = 500;
export const MAX_INSTALLMENTS = 120;
export const MAX_CONTRACT_PDF_BYTES = 10 * 1024 * 1024;

export const CONTRACT_STATUSES = [
  'draft',
  'active',
  'closed',
  'cancelled',
] as const;
export const COST_CATEGORIES = [
  'team',
  'third_party',
  'infrastructure',
  'other',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  infrastructure: 'Infraestrutura',
  other: 'Outro',
  team: 'Equipe',
  third_party: 'Terceiro',
};

export function calendarDate(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function saoPauloCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(now);
}

export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface FinanceAmountTotals {
  totalAmountCents: number;
  paidAmountCents: number;
  openAmountCents: number;
  costAmountCents: number;
  resultAmountCents: number;
  contractedResultAmountCents: number;
}

export function financeAmounts(
  contractCents: number,
  paidCents: number,
  costCents: number,
): FinanceAmountTotals {
  return {
    contractedResultAmountCents: contractCents - costCents,
    costAmountCents: costCents,
    openAmountCents: contractCents - paidCents,
    paidAmountCents: paidCents,
    resultAmountCents: paidCents - costCents,
    totalAmountCents: contractCents,
  };
}

export function sumFinanceAmounts(
  rows: FinanceAmountTotals[],
): FinanceAmountTotals {
  return rows.reduce(
    (totals, row) => ({
      contractedResultAmountCents:
        totals.contractedResultAmountCents + row.contractedResultAmountCents,
      costAmountCents: totals.costAmountCents + row.costAmountCents,
      openAmountCents: totals.openAmountCents + row.openAmountCents,
      paidAmountCents: totals.paidAmountCents + row.paidAmountCents,
      resultAmountCents: totals.resultAmountCents + row.resultAmountCents,
      totalAmountCents: totals.totalAmountCents + row.totalAmountCents,
    }),
    {
      contractedResultAmountCents: 0,
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      resultAmountCents: 0,
      totalAmountCents: 0,
    },
  );
}
