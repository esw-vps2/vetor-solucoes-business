import { randomUUID } from 'node:crypto';
import type { ExpenseInterval, ExpenseType } from './expense.constants.js';
import { occurrenceDueDate } from './expense-dates.js';

export interface SharedExpenseFields {
  amountCents: number;
  categoryId: string;
  clientTenantId: string | null;
  description: string;
  expenseType: ExpenseType;
  notes: string | null;
  paymentMethod: string | null;
  projectId: string | null;
  subcategoryId: string | null;
  supplierName: string | null;
}

export interface SeriesRecord {
  active: boolean;
  id: string;
  interval: ExpenseInterval;
  occurrenceCount: number;
  shared: SharedExpenseFields;
  startsOn: string;
}

export interface SeriesExpenseRecord {
  competenceMonth: string;
  dueOn: string | null;
  id: string;
  paidOn: string | null;
  seriesDetached: boolean;
  seriesId: string;
  seriesIndex: number;
  shared: SharedExpenseFields;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface SeriesPatch {
  count?: number;
  shared?: Partial<SharedExpenseFields>;
  startsOn?: string;
}

export function projectSeries(
  series: SeriesRecord,
  createId: () => string = randomUUID,
): SeriesExpenseRecord[] {
  return Array.from({ length: series.occurrenceCount }, (_, index) => {
    const dueOn = occurrenceDueDate(series.startsOn, series.interval, index);

    return {
      competenceMonth: dueOn.slice(0, 7),
      dueOn,
      id: createId(),
      paidOn: null,
      seriesDetached: false,
      seriesId: series.id,
      seriesIndex: index,
      shared: { ...series.shared },
      status: 'pending',
    };
  });
}

export function applySeriesPatch(
  series: SeriesRecord,
  expenses: SeriesExpenseRecord[],
  patch: SeriesPatch,
  createId: () => string = randomUUID,
): { expenses: SeriesExpenseRecord[]; series: SeriesRecord } {
  const nextSeries: SeriesRecord = {
    ...series,
    occurrenceCount: patch.count ?? series.occurrenceCount,
    shared: { ...series.shared, ...patch.shared },
    startsOn: patch.startsOn ?? series.startsOn,
  };
  const count = nextSeries.occurrenceCount;
  const slots = Array.from({ length: count }, (_, index) => {
    const dueOn = occurrenceDueDate(nextSeries.startsOn, nextSeries.interval, index);

    return { dueOn, index, month: dueOn.slice(0, 7) };
  });
  let rows = expenses.map((row) =>
    row.seriesDetached ? row : { ...row, shared: { ...nextSeries.shared } },
  );
  const plannedMonth = (row: SeriesExpenseRecord) => {
    if (!row.seriesDetached && row.status === 'pending' && row.seriesIndex < count) {
      return slots[row.seriesIndex]?.month ?? row.competenceMonth;
    }

    return row.competenceMonth;
  };
  const grouped = new Map<string, SeriesExpenseRecord[]>();

  for (const row of rows) {
    const month = plannedMonth(row);
    grouped.set(month, [...(grouped.get(month) ?? []), row]);
  }

  const keepOriginal = new Set<string>();

  for (const group of grouped.values()) {
    if (group.length < 2) {
      continue;
    }

    for (const row of group) {
      if (plannedMonth(row) !== row.competenceMonth) {
        keepOriginal.add(row.id);
      }
    }
  }

  rows = rows.map((row) => {
    if (
      row.seriesDetached ||
      row.status !== 'pending' ||
      row.seriesIndex >= count ||
      keepOriginal.has(row.id)
    ) {
      return row;
    }

    const slot = slots[row.seriesIndex];

    if (!slot) {
      return row;
    }

    return { ...row, competenceMonth: slot.month, dueOn: slot.dueOn };
  });
  rows = rows.map((row) => {
    if (row.seriesDetached || row.status !== 'pending' || row.seriesIndex < count) {
      return row;
    }

    return { ...row, status: 'cancelled' };
  });
  const reopened = new Set<string>();

  for (const slot of slots) {
    const occupant = rows.find((row) => row.competenceMonth === slot.month);

    if (occupant) {
      if (!occupant.seriesDetached && occupant.status === 'cancelled') {
        const indexTaken = rows.some(
          (row) => row.id !== occupant.id && row.seriesIndex === slot.index,
        );
        rows = rows.map((row) =>
          row.id === occupant.id
            ? {
                ...row,
                competenceMonth: slot.month,
                dueOn: slot.dueOn,
                paidOn: null,
                seriesIndex: indexTaken ? row.seriesIndex : slot.index,
                shared: { ...nextSeries.shared },
                status: 'pending',
              }
            : row,
        );
        reopened.add(occupant.id);
      }

      continue;
    }

    if (rows.some((row) => row.seriesIndex === slot.index)) {
      continue;
    }

    rows = [
      ...rows,
      {
        competenceMonth: slot.month,
        dueOn: slot.dueOn,
        id: createId(),
        paidOn: null,
        seriesDetached: false,
        seriesId: series.id,
        seriesIndex: slot.index,
        shared: { ...nextSeries.shared },
        status: 'pending',
      },
    ];
  }

  rows = rows.map((row) => {
    if (reopened.has(row.id)) {
      return row;
    }

    if (row.seriesDetached || row.status !== 'pending' || row.seriesIndex < count) {
      return row;
    }

    return { ...row, status: 'cancelled' };
  });

  return {
    expenses: rows,
    series: {
      ...nextSeries,
      active: rows.some((row) => row.status !== 'cancelled'),
    },
  };
}
