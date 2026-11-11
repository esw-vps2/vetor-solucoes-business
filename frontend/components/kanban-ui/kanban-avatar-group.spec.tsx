import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanAvatarGroup } from './kanban-avatar-group';

describe('KanbanAvatarGroup', () => {
  it('overlaps photos and shows the overflow chip', () => {
    const { container } = render(
      <KanbanAvatarGroup
        overflow={3}
        people={[{ src: '/kanban-ui/avatar-1.png' }, { src: '/kanban-ui/avatar-2.png' }]}
      />,
    );
    expect(screen.getByText('+3').className).toContain('font-extrabold');
    expect(container.querySelector('.-ml-2')).not.toBeNull();
  });
});
