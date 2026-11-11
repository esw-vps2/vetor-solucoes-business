import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanBadge } from './kanban-badge';

describe('KanbanBadge', () => {
  it('renders the six tones', () => {
    const { container } = render(
      <div>
        <KanbanBadge>Importante</KanbanBadge>
        <KanbanBadge tone="solid-indigo">Iniciado</KanbanBadge>
        <KanbanBadge tone="solid-rose">P2</KanbanBadge>
        <KanbanBadge tone="solid-amber">P1</KanbanBadge>
        <KanbanBadge tone="solid-slate">Neutro</KanbanBadge>
        <KanbanBadge tone="white-on-indigo">25</KanbanBadge>
      </div>,
    );
    expect(screen.getByText('Importante').className).toContain('bg-[#eef2ff]');
    expect(screen.getByText('Iniciado').className).toContain('bg-[#4f46e5]');
    expect(screen.getByText('P2').className).toContain('bg-[#f43f5e]');
    expect(screen.getByText('P1').className).toContain('bg-[#f59e0b]');
    expect(screen.getByText('Neutro').className).toContain('bg-[#94a3b8]');
    expect(screen.getByText('25').className).toContain('bg-white');
    expect(container.querySelector('.rounded-full')).not.toBeNull();
  });
});
