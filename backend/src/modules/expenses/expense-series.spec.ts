import { describe, expect, it } from 'vitest';
import { applySeriesPatch, projectSeries, type SeriesRecord } from './expense-series.js';

const shared = {
  amountCents: 1000,
  categoryId: 'category',
  clientTenantId: null,
  description: 'Cloud',
  expenseType: 'fixed' as const,
  notes: null,
  paymentMethod: null,
  projectId: null,
  subcategoryId: null,
  supplierName: 'AWS',
};

function series(count = 3): SeriesRecord {
  return {
    active: true,
    id: 'series',
    interval: 'monthly',
    occurrenceCount: count,
    shared,
    startsOn: '2026-10-27',
  };
}

describe('expense series projection', () => {
  it('projects one pending expense per step and does not add the series itself', () => {
    const rows = projectSeries(series(), () => 'generated');
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.dueOn)).toEqual(['2026-10-27', '2026-11-27', '2026-12-27']);
    expect(rows.every((row) => row.status === 'pending' && row.paidOn === null)).toBe(true);
  });

  it('does not insert a second row for a competence that already exists', () => {
    const initial = projectSeries(series(), (() => {
      let n = 0;
      return () => `row-${n++}`;
    })());
    const again = applySeriesPatch(series(), initial, { count: 3 }, () => 'extra');
    expect(again.expenses).toHaveLength(3);
  });

  it('detaches an occurrence from later series amount edits and adjusts the pending tail', () => {
    const initial = projectSeries(series(), (() => {
      let n = 0;
      return () => `row-${n++}`;
    })());
    const detached = initial.map((row) =>
      row.seriesIndex === 1 ? { ...row, seriesDetached: true, shared: { ...row.shared, amountCents: 50 } } : row,
    );
    const raised = applySeriesPatch(
      series(),
      detached,
      { count: 4, shared: { amountCents: 2000 } },
      () => 'row-3',
    );
    const follower = raised.expenses.find((row) => row.seriesIndex === 0);
    const alone = raised.expenses.find((row) => row.seriesIndex === 1);
    const appended = raised.expenses.find((row) => row.seriesIndex === 3);
    expect(follower?.shared.amountCents).toBe(2000);
    expect(alone?.shared.amountCents).toBe(50);
    expect(alone?.seriesDetached).toBe(true);
    expect(appended?.status).toBe('pending');
    expect(appended?.paidOn).toBeNull();

    const lowered = applySeriesPatch(raised.series, raised.expenses, { count: 2 }, () => 'unused');
    expect(lowered.expenses.find((row) => row.seriesIndex === 3)?.status).toBe('cancelled');
    expect(lowered.expenses.find((row) => row.seriesIndex === 0)?.status).toBe('pending');
  });
});
