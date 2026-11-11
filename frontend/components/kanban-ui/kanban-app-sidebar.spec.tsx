import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KanbanAppSidebar } from './kanban-app-sidebar';

describe('KanbanAppSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the default sidebar in Portuguese without a link', () => {
    render(<KanbanAppSidebar />);
    expect(screen.getByRole('img', { name: 'VETOR' })).toHaveAttribute('src', '/brand/logo_vetor.png');
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Início/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Usuários/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'APIs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assinatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajuda e suporte' })).toBeInTheDocument();
    expect(screen.getByText('Azunyan U. Wu')).toBeInTheDocument();
    expect(screen.getByText('Membro básico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/CC BY|slothui/i)).not.toBeInTheDocument();
  });

  it('renders the slim sidebar as icon buttons', () => {
    render(<KanbanAppSidebar variant="slim" />);
    expect(screen.getByRole('img', { name: 'VETOR' })).toHaveAttribute('src', '/brand/symbol-vetor.png');
    expect(screen.getByRole('button', { name: 'Início' })).toBeInTheDocument();
    expect(screen.queryByText('Azunyan U. Wu')).not.toBeInTheDocument();
  });

  it('renders only the mobile bar', () => {
    render(<KanbanAppSidebar variant="mobile" />);
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tarefas' })).not.toBeInTheDocument();
  });
});
