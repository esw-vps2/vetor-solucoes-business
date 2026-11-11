import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanSidebarItem } from './kanban-sidebar-item';

describe('KanbanSidebarItem', () => {
  it('renders a bold row and an optional soft badge', () => {
    render(<KanbanSidebarItem badge="10" icon={<span>icon</span>} label="Início" />);
    const row = screen.getByRole('button', { name: /Início/ });
    expect(row.className).toContain('rounded-full');
    expect(row.className).toContain('focus-visible:outline-[#4f46e5]');
    expect(row.className).toContain('w-[280px]');
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
