import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanButton } from './kanban-button';

describe('KanbanButton', () => {
  it('renders a filled button and a text button', () => {
    const onClick = vi.fn();
    render(
      <div>
        <KanbanButton onClick={onClick}>Compartilhar</KanbanButton>
        <KanbanButton variant="text">Dispensar</KanbanButton>
      </div>,
    );
    const filled = screen.getByRole('button', { name: 'Compartilhar' });
    expect(filled.className).toContain('bg-[#4f46e5]');
    expect(filled.className).toContain('min-h-10');
    fireEvent.click(filled);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Dispensar' }).className).toContain('h-5');
  });
});
