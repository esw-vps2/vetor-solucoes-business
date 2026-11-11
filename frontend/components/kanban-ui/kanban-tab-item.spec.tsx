import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanTabItem } from './kanban-tab-group';

describe('KanbanTabItem', () => {
  it('exposes the selected state, label, and badge', () => {
    render(
      <KanbanTabItem
        badge="12"
        label="Por total de tarefas"
        selected
        tabIndex={0}
        onKeyDown={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    const tab = screen.getByRole('tab', { name: /Por total de tarefas/ });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
