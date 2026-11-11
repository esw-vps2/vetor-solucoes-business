import { LANE_KEY_PATTERN, MAX_KANBAN_LANES } from './kanban-lanes.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TASK_COMPLETION = ['all', 'complete', 'incomplete'] as const;

export type KanbanTaskCompletion = (typeof TASK_COMPLETION)[number];

export interface KanbanFilterDate {
  mode: 'start' | 'end' | 'range';
  startDate: string | null;
  endDate: string | null;
}

export interface KanbanFilters {
  status: string[];
  date: KanbanFilterDate | null;
  taskCompletion: KanbanTaskCompletion;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value);
}

function parseDate(value: unknown): KanbanFilterDate | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const date = value as Record<string, unknown>;

  if (
    date.mode === 'start' &&
    isIsoDate(date.startDate) &&
    date.endDate === null
  ) {
    return { endDate: null, mode: 'start', startDate: date.startDate };
  }

  if (
    date.mode === 'end' &&
    date.startDate === null &&
    isIsoDate(date.endDate)
  ) {
    return { endDate: date.endDate, mode: 'end', startDate: null };
  }

  if (
    date.mode === 'range' &&
    isIsoDate(date.startDate) &&
    isIsoDate(date.endDate) &&
    date.startDate <= date.endDate
  ) {
    return {
      endDate: date.endDate,
      mode: 'range',
      startDate: date.startDate,
    };
  }

  return null;
}

export function parseKanbanFilters(value: unknown): KanbanFilters | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    !Array.isArray(record.status) ||
    record.status.length > MAX_KANBAN_LANES
  ) {
    return null;
  }

  const status: string[] = [];

  for (const item of record.status) {
    if (typeof item !== 'string' || !LANE_KEY_PATTERN.test(item)) {
      return null;
    }

    if (status.includes(item)) {
      return null;
    }

    status.push(item);
  }

  if (
    record.taskCompletion !== 'all' &&
    record.taskCompletion !== 'complete' &&
    record.taskCompletion !== 'incomplete'
  ) {
    return null;
  }

  if (record.date === null) {
    return { date: null, status, taskCompletion: record.taskCompletion };
  }

  const date = parseDate(record.date);

  if (!date) {
    return null;
  }

  return { date, status, taskCompletion: record.taskCompletion };
}

export function readProjectKanbanFilters(
  metadata: Record<string, unknown> | null,
): KanbanFilters | null {
  if (!metadata) {
    return null;
  }

  return parseKanbanFilters(metadata.kanbanFilters);
}
