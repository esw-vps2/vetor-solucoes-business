import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KanbanProjectBoard } from './kanban-project-board';


function mockViewport(narrow: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: narrow && query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
}


describe('KanbanProjectBoard', () => {
  afterEach(() => {
    cleanup();
    mockViewport(false);
  });

  it('renders the desktop project composition', () => {
    mockViewport(false);
    render(<KanbanProjectBoard />);
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project PlanetX' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A fazer' })).toBeInTheDocument();
    expect(screen.getByText('(8)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Em progresso' })).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Concluído' })).toBeInTheDocument();
    expect(screen.getByText('(7)')).toBeInTheDocument();
    const lane = screen.getByRole('heading', { name: 'A fazer' }).closest('section');
    expect(lane).not.toBeNull();
    expect(within(lane as HTMLElement).getByRole('button', { name: 'A fazer' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visualização em lista', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visualização em colunas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visualização em linhas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ordenar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar dados' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convidar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Machine Learning Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learn Computer Science' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Do some usual chores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Write a few articles for slothUI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transform into a cyborg' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Design 100 landing page for client' })).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getAllByText('Feito').length).toBeGreaterThan(0);
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'User flow confirmation for fintech App' })).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img', { name: 'VETOR' }).every((img) => img.getAttribute('src') === '/brand/symbol-vetor.png')).toBe(
      true,
    );
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('renders the mobile project composition below 768px', async () => {
    mockViewport(true);
    render(<KanbanProjectBoard />);
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Trilha' })).not.toBeInTheDocument();
  });
});
