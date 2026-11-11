import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SafeUser } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { TicketsHome } from './tickets-home';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const client: SafeUser = {
  age: 30,
  email: 'ana@example.com',
  enabledActions: [],
  firstName: 'Ana',
  id: '11111111-1111-4111-8111-111111111111',
  lastName: 'Cliente',
  photoUrl: '',
  profile: 'Usuario',
  sex: 'F',
  tenantId: '22222222-2222-4222-8222-222222222222',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

const company: SafeUser = { ...client, profile: 'Administrador', tenantName: 'VETOR' };

const ticket = {
  category: 'duvida',
  createdAt: '2026-10-26T15:00:00.000Z',
  hasNewComments: true,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  priority: 'low',
  status: 'aberto',
  tenantId: client.tenantId,
  tenantName: 'Acme',
  title: 'Acesso ao portal',
  updatedAt: '2026-10-26T15:00:00.000Z',
};

describe('TicketsHome', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the client create control and hides it from the company', async () => {
    vi.spyOn(api, 'listTickets').mockResolvedValue({
      items: [ticket],
      limit: 20,
      page: 1,
      total: 1,
    });

    const view = render(<TicketsHome user={client} />);
    expect(await screen.findByRole('link', { name: /Acesso ao portal/ })).toHaveAttribute(
      'href',
      `/portal/chamados/${ticket.id}`,
    );
    expect(screen.getByText('Comentário novo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir chamado' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Filtrar por tenant' })).not.toBeInTheDocument();
    expect(screen.queryByText('VETOR')).not.toBeInTheDocument();

    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: client.tenantId, name: 'Acme', slug: 'acme' },
    ]);
    view.rerender(<TicketsHome user={company} />);
    expect(screen.queryByRole('button', { name: 'Abrir chamado' })).not.toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Filtrar por tenant' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Acme/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por status' })).toBeInTheDocument();
  });

  it('filters the company list by tenant', async () => {
    const list = vi.spyOn(api, 'listTickets').mockResolvedValue({
      items: [ticket],
      limit: 20,
      page: 1,
      total: 1,
    });
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: '33333333-3333-4333-8333-333333333333', name: 'North', slug: 'north' },
      { id: client.tenantId, name: 'Acme', slug: 'acme' },
    ]);

    render(<TicketsHome user={company} />);

    expect(await screen.findByRole('option', { name: 'Acme' })).toBeInTheDocument();
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options.indexOf('Acme')).toBeLessThan(options.indexOf('North'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por tenant' }), {
      target: { value: client.tenantId },
    });

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, tenantId: client.tenantId }),
      );
    });
  });

  it('creates a ticket and shows the success message', async () => {
    vi.spyOn(api, 'listTickets').mockResolvedValue({ items: [], limit: 20, page: 1, total: 0 });
    const create = vi.spyOn(api, 'createTicket').mockResolvedValue({
      message: 'Operação realizada com sucesso.',
      ticket: {
        ...ticket,
        attachments: [],
        comments: [],
        description: 'Preciso de ajuda.',
        openedBy: { displayName: 'Ana', id: client.id },
        openedById: client.id,
        tenant: { displayName: 'Acme', id: client.tenantId },
      },
    });

    render(<TicketsHome user={client} />);
    expect(await screen.findByText('Nenhum chamado.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('bg-white');
    expect(dialog.className).toContain('text-navy');
    expect(dialog.className).toContain('border-navy/10');
    expect(dialog.className).toContain('md:max-w-xl');
    expect(screen.queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Abrir chamado' }).className).toContain('text-navy');
    fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
      target: { value: 'Acesso ao portal' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), {
      target: { value: 'duvida' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Preciso de ajuda com o acesso.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        category: 'duvida',
        description: 'Preciso de ajuda com o acesso.',
        priority: 'low',
        title: 'Acesso ao portal',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
  });

  it('sends a pasted image and a chosen priority with the ticket', async () => {
    vi.spyOn(api, 'listTickets').mockResolvedValue({ items: [], limit: 20, page: 1, total: 0 });
    const create = vi.spyOn(api, 'createTicket').mockResolvedValue({
      message: 'Operação realizada com sucesso.',
      ticket: {
        ...ticket,
        attachments: [],
        comments: [],
        description: 'Preciso de ajuda.',
        openedBy: { displayName: 'Ana', id: client.id },
        openedById: client.id,
        tenant: { displayName: 'Acme', id: client.tenantId },
      },
    });
    const upload = vi.spyOn(api, 'addTicketAttachment').mockResolvedValue({
      byteSize: 3,
      contentType: 'image/png',
      createdByFirstName: 'Ana',
      createdByLastName: 'Cliente',
      createdByUserId: client.id,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      originalName: 'cola.png',
      ticketId: ticket.id,
      url: `/api/v1/tickets/${ticket.id}/attachments/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
    });
    const image = new File(['png'], 'cola.png', { type: 'image/png' });

    render(<TicketsHome user={client} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir chamado' }));
    expect(screen.getByRole('combobox', { name: 'Prioridade' })).toHaveValue('low');
    fireEvent.change(screen.getByRole('combobox', { name: 'Prioridade' }), {
      target: { value: 'high' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
      target: { value: 'Acesso ao portal' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), {
      target: { value: 'duvida' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Preciso de ajuda com o acesso.' },
    });
    fireEvent.paste(screen.getByRole('textbox', { name: 'Descrição' }), {
      clipboardData: {
        items: [
          {
            getAsFile: () => image,
            kind: 'file',
            type: 'image/png',
          },
        ],
      },
    });
    expect(screen.getByText('cola.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        category: 'duvida',
        description: 'Preciso de ajuda com o acesso.',
        priority: 'high',
        title: 'Acesso ao portal',
      });
    });
    expect(upload).toHaveBeenCalledWith(ticket.id, image);
  });

  it('closes Abrir chamado with Cancelar', async () => {
    vi.spyOn(api, 'listTickets').mockResolvedValue({ items: [], limit: 20, page: 1, total: 0 });

    render(<TicketsHome user={client} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir chamado' }));
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toContain('bg-accent');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows forbidden feedback from the API status', async () => {
    vi.spyOn(api, 'listTickets').mockRejectedValue(new ApiError('Access denied.', 403));

    render(<TicketsHome user={client} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você não tem permissão para esta ação.',
    );
  });
});
