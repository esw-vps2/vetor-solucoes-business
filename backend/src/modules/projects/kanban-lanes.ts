import { randomBytes } from 'node:crypto';

export const MAX_KANBAN_LANES = 12;

export const MAX_LANE_LABEL_LENGTH = 40;

export const LANE_KEY_PATTERN = /^[a-z0-9-]{1,20}$/;

export interface KanbanLaneDefinition {
  key: string;
  label: string;
  color: string;
}

export const DEFAULT_KANBAN_LANES: KanbanLaneDefinition[] = [
  { color: '#64748B', key: 'backlog', label: 'Backlog' },
  { color: '#3D9CF0', key: 'ready', label: 'Pronto' },
  { color: '#F5A524', key: 'working', label: 'Trabalhando' },
  { color: '#7B6CFF', key: 'review', label: 'Revisão' },
  { color: '#2EC4B6', key: 'deploy', label: 'Deploy' },
  { color: '#BDDA2B', key: 'done', label: 'Finalizado' },
];

export const KANBAN_LANE_PALETTE = [
  '#64748B',
  '#3D9CF0',
  '#F5A524',
  '#7B6CFF',
  '#2EC4B6',
  '#BDDA2B',
  '#E85D8C',
  '#FF6B4A',
  '#16A34A',
  '#D946EF',
  '#1D4ED8',
  '#B45309',
] as const;

export function readProjectLanes(
  metadata: Record<string, unknown> | null,
): KanbanLaneDefinition[] {
  const stored = parseStoredLanes(metadata?.kanbanLanes);
  return (
    assignUniqueLaneColors(stored) ??
    DEFAULT_KANBAN_LANES.map((lane) => ({ ...lane }))
  );
}

export function applyKanbanLanes(
  current: KanbanLaneDefinition[],
  incoming: { key?: string; label: string }[],
  cardCountByLane: ReadonlyMap<string, number>,
): KanbanLaneDefinition[] | null {
  if (incoming.length < 1 || incoming.length > MAX_KANBAN_LANES) {
    return null;
  }

  const labels = incoming.map((lane) => lane.label.trim());

  if (
    labels.some(
      (label) => label.length < 1 || label.length > MAX_LANE_LABEL_LENGTH,
    )
  ) {
    return null;
  }

  const folded = labels.map((label) => label.toLocaleLowerCase('en-US'));

  if (new Set(folded).size !== folded.length) {
    return null;
  }

  const currentByKey = new Map(current.map((lane) => [lane.key, lane]));

  for (const lane of current) {
    if ((cardCountByLane.get(lane.key) ?? 0) === 0) {
      continue;
    }

    const next = incoming.find((item) => item.key === lane.key);

    if (!next || next.label.trim() !== lane.label) {
      return null;
    }
  }

  const used = new Set<string>();
  const next: KanbanLaneDefinition[] = [];

  for (const [index, item] of incoming.entries()) {
    const label = labels[index];

    if (item.key !== undefined) {
      if (!LANE_KEY_PATTERN.test(item.key) || used.has(item.key)) {
        return null;
      }

      const existing = currentByKey.get(item.key);

      if (!existing) {
        return null;
      }

      used.add(item.key);
      next.push({ color: existing.color, key: existing.key, label });
      continue;
    }

    const key = createLaneKey(new Set([...currentByKey.keys(), ...used]));
    const color = unusedLaneColor(next);

    if (!color) {
      return null;
    }

    used.add(key);
    next.push({ color, key, label });
  }

  return assignUniqueLaneColors(next);
}

export function laneConfigurationChanges(
  current: KanbanLaneDefinition[],
  next: KanbanLaneDefinition[],
): {
  created: boolean;
  deleted: boolean;
  renamed: boolean;
  reordered: boolean;
} {
  const currentLabels = new Map(current.map((lane) => [lane.key, lane.label]));
  const nextKeys = next.map((lane) => lane.key);
  const nextKeySet = new Set(nextKeys);

  return {
    created: next.some((lane) => !currentLabels.has(lane.key)),
    deleted: current.some((lane) => !nextKeySet.has(lane.key)),
    renamed: next.some((lane) => {
      const label = currentLabels.get(lane.key);
      return label !== undefined && label !== lane.label;
    }),
    reordered:
      current.map((lane) => lane.key).join('\0') !== nextKeys.join('\0') &&
      current.length === next.length &&
      current.every((lane) => nextKeySet.has(lane.key)),
  };
}

function parseStoredLanes(value: unknown): KanbanLaneDefinition[] | null {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_KANBAN_LANES
  ) {
    return null;
  }

  const lanes: KanbanLaneDefinition[] = [];
  const keys = new Set<string>();
  const labels = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const record = item as Record<string, unknown>;

    if (
      typeof record.key !== 'string' ||
      !LANE_KEY_PATTERN.test(record.key) ||
      typeof record.label !== 'string' ||
      typeof record.color !== 'string' ||
      !/^#[0-9A-Fa-f]{6}$/.test(record.color)
    ) {
      return null;
    }

    const label = record.label.trim();

    if (label.length < 1 || label.length > MAX_LANE_LABEL_LENGTH) {
      return null;
    }

    const folded = label.toLocaleLowerCase('en-US');

    if (keys.has(record.key) || labels.has(folded)) {
      return null;
    }

    keys.add(record.key);
    labels.add(folded);
    lanes.push({ color: record.color.toUpperCase(), key: record.key, label });
  }

  return lanes;
}

function assignUniqueLaneColors(
  lanes: KanbanLaneDefinition[] | null,
): KanbanLaneDefinition[] | null {
  if (!lanes) {
    return null;
  }

  const canonical = new Map(
    DEFAULT_KANBAN_LANES.map((lane) => [lane.key, lane.color]),
  );
  const claimed = new Set<string>();
  const resolved = lanes.map((lane) => ({ ...lane }));

  for (const lane of resolved) {
    if (canonical.get(lane.key) === lane.color) {
      claimed.add(lane.color);
    }
  }

  for (const lane of resolved) {
    if (canonical.get(lane.key) === lane.color) {
      continue;
    }

    if (!claimed.has(lane.color)) {
      claimed.add(lane.color);
      continue;
    }

    const color = KANBAN_LANE_PALETTE.find((item) => !claimed.has(item));

    if (!color) {
      return null;
    }

    lane.color = color;
    claimed.add(color);
  }

  return resolved;
}

function unusedLaneColor(lanes: KanbanLaneDefinition[]): string | null {
  const used = new Set(lanes.map((lane) => lane.color));
  return KANBAN_LANE_PALETTE.find((color) => !used.has(color)) ?? null;
}

function createLaneKey(used: Set<string>): string {
  let key = '';

  do {
    key = `c${randomBytes(4).toString('hex')}`;
  } while (used.has(key));

  return key;
}
