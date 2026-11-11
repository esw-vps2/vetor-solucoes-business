import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanBreadcrumbItem } from './kanban-breadcrumb';

describe('KanbanBreadcrumbItem', () => {
  it('renders the label and optional callback', () => {
    const onSelect = vi.fn();
    render(<KanbanBreadcrumbItem crumb={{ label: 'Painel', onSelect }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Painel' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
