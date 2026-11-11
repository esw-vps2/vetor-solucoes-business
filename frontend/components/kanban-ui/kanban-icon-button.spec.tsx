import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KanbanIconButton } from './kanban-icon-button';
import { PlusIcon } from './icons/plus';

describe('KanbanIconButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('exposes the accessible name and the outline and selected frames', () => {
    render(
      <div>
        <KanbanIconButton accessibleName="Adicionar">
          <PlusIcon />
        </KanbanIconButton>
        <KanbanIconButton accessibleName="Enviar" variant="outline">
          <PlusIcon />
        </KanbanIconButton>
        <KanbanIconButton accessibleName="Início" variant="selected">
          <PlusIcon />
        </KanbanIconButton>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Adicionar' }).className).toContain('size-10');
    expect(screen.getByRole('button', { name: 'Adicionar' }).className).toContain('shrink-0');
    expect(screen.getByRole('button', { name: 'Enviar' }).className).toContain('border');
    expect(screen.getByRole('button', { name: 'Início' }).className).toContain('size-12');
  });

  it('fails an accessible-name query when the name is missing', () => {
    render(
      <KanbanIconButton accessibleName="">
        <PlusIcon />
      </KanbanIconButton>,
    );
    expect(() => screen.getByRole('button', { name: 'Adicionar' })).toThrow();
  });
});
