import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanLaunchCard } from './kanban-launch-card';

describe('KanbanLaunchCard', () => {
  it('renders cover, badges, date, and optional controls', () => {
    const onCheckedChange = vi.fn();
    const onThumbsUp = vi.fn();
    const { container } = render(
      <KanbanLaunchCard
        assignee={{ src: '/kanban-ui/avatar-1.png' }}
        badges={[
          { label: 'Iniciado', tone: 'solid-indigo' },
          { label: 'Em andamento', tone: 'solid-indigo' },
          { label: 'Não iniciado', tone: 'solid-slate' },
          { label: 'P1', tone: 'solid-amber' },
          { label: 'P2', tone: 'solid-rose' },
        ]}
        coverSrc="/kanban-ui/cover-fintech.jpg"
        dateLabel="Dec  2 -  8"
        onCheckedChange={onCheckedChange}
        onThumbsUp={onThumbsUp}
        thumbsUp={4}
        title="Lançamento do site"
      />,
    );
    const cover = container.querySelector('img[src="/kanban-ui/cover-fintech.jpg"]');
    expect(cover).not.toBeNull();
    expect(cover?.className).toContain('h-60');
    expect(cover?.className).toContain('rounded-[16px]');
    expect(screen.getByText(/Dec\s+2\s+-\s+8/)).toBeInTheDocument();
    const check = screen.getByRole('button', { name: 'Marcar Lançamento do site' });
    expect(check.className).toContain('focus-visible:outline-[#4f46e5]');
    fireEvent.click(check);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onThumbsUp).toHaveBeenCalledTimes(1);
  });
});
