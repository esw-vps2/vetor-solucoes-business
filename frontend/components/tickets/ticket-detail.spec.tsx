import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SafeUser, TicketDetail } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { TicketDetailView } from './ticket-detail';

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

const ticket: TicketDetail = {
  category: 'erro_falha',
  comments: [
    {
      author: { displayName: 'Ana Cliente', id: client.id },
      authorId: client.id,
      body: 'A tela falhou.',
      createdAt: '2026-10-26T16:00:00.000Z',
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      ticketId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      updatedAt: '2026-10-26T16:00:00.000Z',
    },
  ],
  createdAt: '2026-10-26T15:00:00.000Z',
  attachments: [],
  description: 'A tela de login falhou hoje.',
  hasNewComments: true,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  openedBy: { displayName: 'Ana Cliente', id: client.id },
  openedById: client.id,
  priority: 'low',
  status: 'aberto',
  tenant: { displayName: 'Acme', id: client.tenantId },
  tenantId: client.tenantId,
  tenantName: 'Acme',
  title: 'Falha no login',
  updatedAt: '2026-10-26T16:00:00.000Z',
};

describe('TicketDetailView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows ticket data and hides status changes from the client', async () => {
    vi.spyOn(api, 'getTicket').mockResolvedValue(ticket);

    render(<TicketDetailView ticketId={ticket.id} user={client} />);

    expect(await screen.findByRole('heading', { name: 'Falha no login' })).toBeInTheDocument();
    expect(screen.getByText(ticket.id)).toBeInTheDocument();
    expect(screen.getByText('Erro/falha · Aberto')).toBeInTheDocument();
    expect(screen.getByText('A tela de login falhou hoje.')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Cliente').length).toBeGreaterThan(0);
    expect(screen.getByText('A tela falhou.')).toBeInTheDocument();
    expect(screen.getByText('Comentário novo')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Alterar status' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como visto' })).toBeInTheDocument();
  });

  it('lets the company change status and both actors comment', async () => {
    vi.spyOn(api, 'getTicket').mockResolvedValue(ticket);
    const update = vi.spyOn(api, 'updateTicketStatus').mockResolvedValue({
      message: 'Operação realizada com sucesso.',
      ticket: { ...ticket, status: 'em_analise' },
    });
    const comment = vi.spyOn(api, 'createTicketComment').mockResolvedValue({
      comment: ticket.comments[0],
      message: 'Operação realizada com sucesso.',
    });
    const read = vi.spyOn(api, 'markTicketRead').mockResolvedValue(undefined);

    render(
      <TicketDetailView ticketId={ticket.id} user={{ ...client, profile: 'Administrador' }} />,
    );

    expect(await screen.findByRole('combobox', { name: 'Alterar status' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Alterar status' }), {
      target: { value: 'em_analise' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar status' }));
    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(ticket.id, 'em_analise');
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Comentário' }), {
      target: { value: 'Estamos analisando.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comentário' }));
    await waitFor(() => {
      expect(comment).toHaveBeenCalledWith(ticket.id, 'Estamos analisando.');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como visto' }));
    await waitFor(() => {
      expect(read).toHaveBeenCalledWith(ticket.id);
    });
  });

  it('uploads an image pasted on the ticket screen', async () => {
    vi.spyOn(api, 'getTicket').mockResolvedValue(ticket);
    const upload = vi.spyOn(api, 'addTicketAttachment').mockResolvedValue({
      byteSize: 4,
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

    render(<TicketDetailView ticketId={ticket.id} user={client} />);
    expect(await screen.findByText('Baixa')).toBeInTheDocument();
    expect(screen.getByText('Cada arquivo até 5 MB.')).toBeInTheDocument();
    fireEvent.paste(screen.getByRole('textbox', { name: 'Comentário' }), {
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

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith(ticket.id, image);
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
  });
});
