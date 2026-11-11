import { describe, expect, it } from 'vitest';
import {
  applyKanbanLanes,
  DEFAULT_KANBAN_LANES,
  KANBAN_LANE_PALETTE,
  readProjectLanes,
} from './kanban-lanes.js';

describe('kanban lane colors', () => {
  it('uses twelve distinct palette colors', () => {
    expect(KANBAN_LANE_PALETTE).toHaveLength(12);
    expect(new Set(KANBAN_LANE_PALETTE).size).toBe(12);
  });

  it('assigns the first unused color to a new lane', () => {
    const next = applyKanbanLanes(
      DEFAULT_KANBAN_LANES,
      [
        ...DEFAULT_KANBAN_LANES.map((lane) => ({
          key: lane.key,
          label: lane.label,
        })),
        { label: 'QA' },
      ],
      new Map(),
    );

    expect(next?.[6]?.color).toBe('#E85D8C');
    expect(new Set(next?.map((lane) => lane.color)).size).toBe(7);
  });

  it('keeps the default lane color when a custom lane repeats it', () => {
    const lanes = readProjectLanes({
      kanbanLanes: [
        { color: '#64748B', key: 'backlog', label: 'Backlog' },
        { color: '#3D9CF0', key: 'ready', label: 'Pronto' },
        { color: '#BDDA2B', key: 'ce9fb881d', label: 'Trabalhando' },
        { color: '#7B6CFF', key: 'review', label: 'Revisão' },
        { color: '#2EC4B6', key: 'deploy', label: 'Deploy' },
        { color: '#BDDA2B', key: 'done', label: 'Finalizado' },
      ],
    });

    expect(lanes.find((lane) => lane.key === 'done')?.color).toBe('#BDDA2B');
    expect(lanes.find((lane) => lane.key === 'ce9fb881d')?.color).toBe(
      '#F5A524',
    );
    expect(new Set(lanes.map((lane) => lane.color)).size).toBe(lanes.length);
  });
});
