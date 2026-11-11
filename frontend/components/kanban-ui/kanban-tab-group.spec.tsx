import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanTabGroup } from './kanban-tab-group';

const tabs = [
  { id: 'status', label: 'Por status' },
  { badge: '12', id: 'total', label: 'Por total de tarefas' },
  { id: 'due', label: 'Tarefas a vencer' },
  { id: 'extra', label: 'Tarefas extras' },
  { id: 'done', label: 'Tarefas concluídas' },
];

describe('KanbanTabGroup', () => {
  it('selects one tab and moves with arrow keys', () => {
    render(<KanbanTabGroup label="Visões" tabs={tabs} />);
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Por total de tarefas');
    fireEvent.keyDown(screen.getByRole('tab', { selected: true }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Tarefas a vencer');
    fireEvent.keyDown(screen.getByRole('tab', { selected: true }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Por total de tarefas');
  });
});
