import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KanbanAnalyticsBoard } from './kanban-analytics-board';


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


describe('KanbanAnalyticsBoard', () => {
  afterEach(() => {
    cleanup();
    mockViewport(false);
  });

  it('renders the desktop composition at 768px and above', () => {
    mockViewport(false);
    const { container } = render(<KanbanAnalyticsBoard />);
    expect(screen.getByRole('heading', { name: 'Painel de análises' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Início/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Por status/ })).toBeInTheDocument();
    expect(screen.getByText('Ordenar por')).toBeInTheDocument();
    expect(screen.getByText('Mais recentes')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Em progresso/ })).getByText('25')).toBeInTheDocument();
    const reviewed = screen.getByRole('button', { name: /Revisado/ });
    expect(reviewed.className).toContain('bg-[#f59e0b]');
    expect(within(reviewed).getByText('8')).toBeInTheDocument();
    const completed = screen.getByRole('button', { name: /Concluído/ });
    expect(completed.className).toContain('bg-[#00c345]');
    expect(within(completed).getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Healthcare app wireframe flow' })).toBeInTheDocument();
    expect(screen.getByText('Prioridade alta')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Blog Copywriting (Low priority 😅)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Landing page for Azunyan senpai' })).toBeInTheDocument();
    expect(screen.getByText('Não tão importante')).toBeInTheDocument();
    expect(screen.getByText('Não sei')).toBeInTheDocument();
    expect(screen.getByText('Talvez importante')).toBeInTheDocument();
    expect(screen.getByText('Acho que')).toBeInTheDocument();
    expect(screen.getByText('108k')).toBeInTheDocument();
    expect(screen.getByText('997')).toBeInTheDocument();
    expect(screen.getByText('987')).toBeInTheDocument();
    expect(screen.getByText('21,8k')).toBeInTheDocument();
    expect(screen.getByText('888')).toBeInTheDocument();
    expect(screen.getByText('487')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('221')).toBeInTheDocument();
    expect(screen.getByText('87,2k')).toBeInTheDocument();
    expect(screen.getAllByText('Prioridade baixa').length).toBeGreaterThan(0);
    expect(container.querySelector('img[src*="/kanban-ui/avatar-"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.queryByText(/CC BY|slothui/i)).not.toBeInTheDocument();
  });

  it('renders the mobile composition below 768px', async () => {
    mockViewport(true);
    render(<KanbanAnalyticsBoard />);
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tarefas' })).not.toBeInTheDocument();
  });
});
