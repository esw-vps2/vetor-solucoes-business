import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanTaskCard } from './kanban-task-card';

describe('KanbanTaskCard', () => {
  it('renders the opened slots', () => {
    const { container } = render(
      <KanbanTaskCard
        avatars={[{ src: '/kanban-ui/avatar-1.png' }, { src: '/kanban-ui/avatar-2.png' }]}
        badge="Importante"
        checkCount={187}
        commentCount={11}
        description="Lorem ipsum dolor sit amet, libre unst consectetur adispicing elit."
        overflow={3}
        progress={0}
        title="UI/UX Design in the age of AI"
      />,
    );
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'UI/UX Design in the age of AI' })).toBeInTheDocument();
    expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('187')).toBeInTheDocument();
    expect(container.querySelector('img[src="/kanban-ui/avatar-1.png"]')).not.toBeNull();
  });
});
