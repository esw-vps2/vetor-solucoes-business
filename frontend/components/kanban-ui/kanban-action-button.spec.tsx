import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanActionButton } from './kanban-action-button';

describe('KanbanActionButton', () => {
  it('shows the read count and Portuguese status', () => {
    render(<KanbanActionButton count="25" label="Em progresso" />);
    const button = screen.getByRole('button', { name: /Em progresso/ });
    expect(button.className).toContain('bg-[#4f46e5]');
    expect(button.className).toContain('focus-visible:outline-[#4f46e5]');
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});
