import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanAvatar } from './kanban-avatar';

describe('KanbanAvatar', () => {
  it('renders the three sizes from a kit photo', () => {
    const { container } = render(
      <div>
        <KanbanAvatar src="/kanban-ui/avatar-1.png" />
        <KanbanAvatar alt="Ana" size="md" src="/kanban-ui/avatar-2.png" />
        <KanbanAvatar size="lg" src="/kanban-ui/avatar-3.png" />
      </div>,
    );
    const frames = container.querySelectorAll('div.relative');
    expect(frames[0]?.className).toContain('size-8');
    expect(frames[1]?.className).toContain('size-10');
    expect(frames[2]?.className).toContain('size-12');

    const ana = screen.getByRole('img', { name: 'Ana' });
    expect(ana.className).toContain('object-cover');
    expect(ana.className).toContain('absolute');
  });

  it('can fit the full image inside the frame', () => {
    render(<KanbanAvatar alt="Logo" fit="contain" size="md" src="/kanban-ui/avatar-1.png" />);
    expect(screen.getByRole('img', { name: 'Logo' }).className).toContain('object-contain');
  });
});
