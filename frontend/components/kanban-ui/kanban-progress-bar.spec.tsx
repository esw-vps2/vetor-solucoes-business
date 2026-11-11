import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanProgressBar } from './kanban-progress-bar';

describe('KanbanProgressBar', () => {
  it('exposes the percent as aria-valuenow', () => {
    render(<KanbanProgressBar value={40} />);
    const bar = screen.getByRole('progressbar', { name: 'Progresso' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
