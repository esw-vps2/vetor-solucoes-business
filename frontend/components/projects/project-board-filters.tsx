'use client';

import type { KanbanFilters } from '@/lib/api/client';
import { PROJECT_COPY } from '@/lib/project-kanban';

const controlClass =
  'inline-flex min-h-10 items-center rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-navy-100 dark:text-white';

export function ProjectBoardFilters({
  filters,
  lanes,
  onChange,
}: {
  filters: KanbanFilters;
  lanes: { key: string; label: string }[];
  onChange: (filters: KanbanFilters) => void;
}) {
  const dateMode = filters.date?.mode ?? '';

  function setDateMode(mode: '' | 'start' | 'end' | 'range') {
    if (!mode) {
      onChange({ ...filters, date: null });
      return;
    }

    onChange({
      ...filters,
      date: {
        endDate: mode === 'start' ? null : (filters.date?.endDate ?? null),
        mode,
        startDate: mode === 'end' ? null : (filters.date?.startDate ?? null),
      },
    });
  }

  function setDatePart(part: 'startDate' | 'endDate', value: string) {
    if (!filters.date) {
      return;
    }

    onChange({
      ...filters,
      date: {
        ...filters.date,
        [part]: value || null,
      },
    });
  }

  function toggleStatus(key: string) {
    const status = filters.status.includes(key)
      ? filters.status.filter((item) => item !== key)
      : [...filters.status, key];
    onChange({ ...filters, status });
  }

  return (
    <div
      aria-label={PROJECT_COPY.filters}
      className="flex flex-wrap items-center gap-2"
      role="group"
    >
      <div aria-label={PROJECT_COPY.filterStatus} className="flex flex-wrap gap-2" role="group">
        {lanes.map((lane) => (
          <button
            key={lane.key}
            type="button"
            aria-pressed={filters.status.includes(lane.key)}
            className={controlClass}
            onClick={() => toggleStatus(lane.key)}
          >
            {lane.label}
          </button>
        ))}
      </div>
      <label className={`${controlClass} gap-2`}>
        {PROJECT_COPY.filterDate}
        <select
          aria-label={PROJECT_COPY.filterDate}
          className="bg-transparent"
          value={dateMode}
          onChange={(event) => setDateMode(event.target.value as '' | 'start' | 'end' | 'range')}
        >
          <option value="">{PROJECT_COPY.filterDateAny}</option>
          <option value="start">{PROJECT_COPY.filterDateStart}</option>
          <option value="end">{PROJECT_COPY.filterDateEnd}</option>
          <option value="range">{PROJECT_COPY.filterDateRange}</option>
        </select>
      </label>
      {filters.date && filters.date.mode !== 'end' ? (
        <label className={`${controlClass} gap-2`}>
          {PROJECT_COPY.filterStartDate}
          <input
            type="date"
            value={filters.date.startDate ?? ''}
            onChange={(event) => setDatePart('startDate', event.target.value)}
          />
        </label>
      ) : null}
      {filters.date && filters.date.mode !== 'start' ? (
        <label className={`${controlClass} gap-2`}>
          {PROJECT_COPY.filterEndDate}
          <input
            type="date"
            value={filters.date.endDate ?? ''}
            onChange={(event) => setDatePart('endDate', event.target.value)}
          />
        </label>
      ) : null}
      <div aria-label={PROJECT_COPY.filterTasks} className="flex flex-wrap gap-2" role="group">
        {(
          [
            ['all', PROJECT_COPY.filterTasksAll],
            ['complete', PROJECT_COPY.filterTasksComplete],
            ['incomplete', PROJECT_COPY.filterTasksIncomplete],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.taskCompletion === value}
            className={controlClass}
            onClick={() => onChange({ ...filters, taskCompletion: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
