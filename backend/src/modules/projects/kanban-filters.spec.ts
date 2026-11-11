import { describe, expect, it } from 'vitest';
import { parseKanbanFilters } from './kanban-filters.js';

describe('parseKanbanFilters', () => {
  it('accepts start, end, and range dates', () => {
    expect(
      parseKanbanFilters({
        date: { endDate: null, mode: 'start', startDate: '2026-09-01' },
        status: ['ready'],
        taskCompletion: 'complete',
      }),
    ).toEqual({
      date: { endDate: null, mode: 'start', startDate: '2026-09-01' },
      status: ['ready'],
      taskCompletion: 'complete',
    });
    expect(
      parseKanbanFilters({
        date: { endDate: '2026-09-30', mode: 'end', startDate: null },
        status: [],
        taskCompletion: 'all',
      })?.date?.mode,
    ).toBe('end');
    expect(
      parseKanbanFilters({
        date: { endDate: '2026-09-01', mode: 'range', startDate: '2026-09-30' },
        status: [],
        taskCompletion: 'all',
      }),
    ).toBeNull();
  });
});
