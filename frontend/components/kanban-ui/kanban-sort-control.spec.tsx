import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanSortControl } from './kanban-sort-control';

describe('KanbanSortControl', () => {
  it('shows Ordenar por and the read badge', () => {
    render(<KanbanSortControl value="Mais recentes" />);
    expect(screen.getByText('Ordenar por')).toBeInTheDocument();
    expect(screen.getByText('Mais recentes')).toBeInTheDocument();
  });
});
