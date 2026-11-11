import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanLaneHeader } from './kanban-lane-header';

describe('KanbanLaneHeader', () => {
  it('renders the project form without a menu', () => {
    render(<KanbanLaneHeader count={8} title="A fazer" />);
    expect(screen.getByRole('heading', { name: 'A fazer' })).toBeInTheDocument();
    expect(screen.getByText('(8)')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the pill form with a count chip and add control', () => {
    render(
      <KanbanLaneHeader
        addLabel="Adicionar card em Backlog"
        count={1}
        dotColor="#64748B"
        title="Backlog"
        variant="pill"
        onAdd={() => undefined}
      />,
    );
    const pill = screen.getByRole('heading', { name: 'Backlog' }).parentElement;
    expect(pill).toHaveClass('rounded-full');
    expect(pill).toHaveStyle({ backgroundColor: '#64748B' });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('(1)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar card em Backlog' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir raia' })).not.toBeInTheDocument();
  });

  it('places a remove control beside the add control', () => {
    render(
      <KanbanLaneHeader
        addLabel="Adicionar card em Trabalhando"
        count={0}
        removeLabel="Excluir raia"
        title="Trabalhando"
        variant="pill"
        onAdd={() => undefined}
        onRemove={() => undefined}
      />,
    );
    const add = screen.getByRole('button', { name: 'Adicionar card em Trabalhando' });
    const remove = screen.getByRole('button', { name: 'Excluir raia' });
    expect(remove.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the launch form with plus and dots', () => {
    const { container } = render(<KanbanLaneHeader title="Novos pedidos" variant="launch" />);
    expect(screen.getByRole('heading', { name: 'Novos pedidos' })).toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(2);
  });
});
