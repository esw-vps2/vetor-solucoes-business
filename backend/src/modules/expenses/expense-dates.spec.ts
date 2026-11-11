import { describe, expect, it } from 'vitest';
import { addMonthsClamped, currentCompetenceMonth, occurrenceDueDate } from './expense-dates.js';

describe('expense dates', () => {
  it('clamps each occurrence to the start day of that month', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsClamped('2026-01-31', 2)).toBe('2026-03-31');
    expect(occurrenceDueDate('2026-10-27', 'monthly', 0)).toBe('2026-10-27');
    expect(occurrenceDueDate('2026-10-27', 'monthly', 1)).toBe('2026-11-27');
    expect(occurrenceDueDate('2026-10-27', 'monthly', 2)).toBe('2026-12-27');
    expect(occurrenceDueDate('2026-10-27', 'yearly', 1)).toBe('2027-10-27');
  });

  it('uses the Sao Paulo calendar month', () => {
    expect(currentCompetenceMonth(new Date('2026-10-27T02:30:00.000Z'))).toBe('2026-10');
    expect(currentCompetenceMonth(new Date('2026-01-01T02:30:00.000Z'))).toBe('2025-12');
  });
});
