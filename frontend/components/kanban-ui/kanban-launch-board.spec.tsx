import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KanbanLaunchBoard } from './kanban-launch-board';


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


describe('KanbanLaunchBoard', () => {
  afterEach(() => {
    cleanup();
    mockViewport(false);
  });

  it('renders the desktop launch composition', () => {
    mockViewport(false);
    const { container } = render(<KanbanLaunchBoard />);
    expect(screen.getByRole('heading', { name: 'Lançamento do site 2024' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveAttribute('placeholder', 'Buscar tarefas...');
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Público para todos' })).toBeInTheDocument();
    expect(screen.getByText('668')).toBeInTheDocument();
    expect(screen.getAllByText('88').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: /Lista/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Quadro/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Linha do tempo/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Calendário/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Progresso/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novos pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Atribuído' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aprovado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mobile App Wireframes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Localization & Linearization' })).toBeInTheDocument();
    expect(screen.getAllByText('Iniciado').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Customer Reporting' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upgrade and payment options' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mobile Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Offline Mode Functionality' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In-product education' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Linux version update' })).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getAllByText('Não iniciado').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dec\s+2\s+-\s+8/).length).toBeGreaterThan(0);
    expect(container.querySelector('img[src="/kanban-ui/cover-fintech.jpg"]')).not.toBeNull();
    expect(container.querySelector('img[src="/kanban-ui/cover-lens.jpg"]')).not.toBeNull();
    expect(container.querySelector('img[src="/kanban-ui/cover-steps.jpg"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.queryByText(/CC BY|slothui/i)).not.toBeInTheDocument();
  });

  it('renders the mobile launch composition below 768px', async () => {
    mockViewport(true);
    render(<KanbanLaunchBoard />);
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
