import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanBreadcrumb } from './kanban-breadcrumb';

describe('KanbanBreadcrumb', () => {
  it('names the trail and marks the current item', () => {
    render(
      <KanbanBreadcrumb
        items={[{ label: 'Painel' }, { label: 'Projeto' }, { current: true, label: 'Project PlanetX' }]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Project PlanetX' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Início' })).toBeInTheDocument();
  });
});
