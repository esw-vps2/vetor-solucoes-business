import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanFeaturedCard } from './kanban-featured-card';

describe('KanbanFeaturedCard', () => {
  it('renders the Portuguese featured card and does not navigate', () => {
    const onDismiss = vi.fn();
    render(<KanbanFeaturedCard onDismiss={onDismiss} />);
    expect(
      screen.getByText('Tenha acesso ilimitado ao aplicativo por um pequeno valor mensal.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('complementary').className).toContain('rounded-[24px]');
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Seja Pro' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
