import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { VetorAgentWorkspace } from './vetor-agent-workspace';

const ai = vi.hoisted(() => ({
  aiAttachmentUrl: (conversationId: string, attachmentId: string) =>
    `/api/v1/ai/conversations/${conversationId}/attachments/${attachmentId}`,
  createAiConversation: vi.fn(),
  getAiPricing: vi.fn(),
  getAiRun: vi.fn(),
  listAiConversations: vi.fn(),
  listAiMessages: vi.fn(),
  sendAiMessage: vi.fn(),
  uploadAiAttachment: vi.fn(),
  subscribeToAiRun: vi.fn(
    (
      runId: string,
      handlers: {
        onDisconnect: () => void;
        onEvent: (event: object) => void;
      },
    ) => {
      void runId;
      void handlers;
      return () => undefined;
    },
  ),
}));

vi.mock('@/lib/api/ai-agent', () => ai);

describe('VetorAgentWorkspace', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    ai.getAiPricing.mockResolvedValue({ tokenCostPerMillion: 0.6, usageCost: 0 });
    ai.listAiConversations.mockResolvedValue({ items: [], limit: 20, page: 1 });
    ai.listAiMessages.mockResolvedValue([]);
    ai.createAiConversation.mockResolvedValue({
      createdAt: '2026-10-28T00:00:00.000Z',
      id: 'conversation-1',
      updatedAt: '2026-10-28T00:00:00.000Z',
    });
    ai.subscribeToAiRun.mockImplementation(() => () => undefined);
  });

  it('renders the chat workspace inside its own column', async () => {
    render(<VetorAgentWorkspace />);

    const workspace = screen.getByRole('navigation', { name: 'Conversas' }).parentElement;
    expect(workspace?.className).toContain('h-full');
    expect(workspace?.className).not.toContain('h-dvh');
    expect(screen.getByRole('button', { name: 'Novo chat' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma conversa ainda.')).toBeInTheDocument();
    expect(screen.getByText(/Custo do uso:/)).toHaveTextContent(/0,00/);
    expect(screen.queryByText(/por milhão de tokens/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exemplo/ })).not.toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Compositor de mensagem' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mensagem para o agente' })).toBeInTheDocument();
    expect(screen.queryByText(/Nenhuma mensagem é enviada/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Voltar ao portal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'VETOR' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vetor Agent' })).not.toBeInTheDocument();
  });

  it('opens and dismisses the conversation sidebar without writing storage', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<VetorAgentWorkspace />);
    await screen.findByText('Nenhuma conversa ainda.');

    const sidebar = screen.getByRole('navigation', { name: 'Conversas' });
    expect(sidebar).toHaveAttribute('data-state', 'closed');
    expect(sidebar.className).toContain('motion-reduce:transition-none');
    expect(document.querySelector('.overflow-x-hidden')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir conversas' }));
    expect(sidebar).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('button', { name: 'Fechar conversas' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Dispensar conversas' }));
    expect(sidebar).toHaveAttribute('data-state', 'closed');
    expect(screen.getByRole('button', { name: 'Abrir conversas' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir conversas' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(sidebar).toHaveAttribute('data-state', 'closed');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('keeps chat controls keyboard reachable and sends through the API client', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    ai.sendAiMessage.mockResolvedValue({
      conversationId: 'conversation-1',
      messageId: 'message-1',
      runId: 'run-1',
      status: 'QUEUED',
    });
    let emit: ((event: object) => void) | undefined;
    ai.subscribeToAiRun.mockImplementation(
      (_runId: string, handlers: { onEvent: (event: object) => void }) => {
        emit = handlers.onEvent;
        return () => undefined;
      },
    );
    render(<VetorAgentWorkspace />);

    const open = screen.getByRole('button', { name: 'Abrir conversas' });
    const create = screen.getByRole('button', { name: 'Novo chat' });
    expect(open.className).toMatch(/min-h-10|size-10/);
    expect(create.className).toMatch(/min-h-10|size-10/);
    create.focus();
    expect(create).toHaveFocus();

    fireEvent.click(create);
    const composer = screen.getByRole('textbox', { name: 'Mensagem para o agente' });
    await waitFor(() => {
      expect(composer).toBeEnabled();
    });
    expect(screen.queryByText('Comece uma nova conversa.')).not.toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Compositor de mensagem' })).toHaveAttribute(
      'data-composer-placement',
      'center',
    );
    expect(composer).toHaveAttribute('placeholder', 'Digite o prompt');
    expect(composer.className).toMatch(/min-h-28/);
    expect(composer.className).toMatch(/border/);
    fireEvent.change(composer, { target: { value: 'Qual o status?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(ai.sendAiMessage).toHaveBeenCalledWith('conversation-1', 'Qual o status?', []);
    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Compositor de mensagem' })).toHaveAttribute(
        'data-composer-placement',
        'dock',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Na fila...');
    expect(screen.getByText('Vetor')).toBeInTheDocument();
    emit?.({
      delta: 'Olá',
      runId: 'run-1',
      sequence: 2,
      type: 'run.delta',
    });
    expect(await screen.findByText('Olá')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Processando...');
    expect(screen.getByRole('status')).not.toHaveTextContent('Olá');
    expect(setItem).not.toHaveBeenCalled();

    ai.listAiMessages.mockResolvedValue([
      {
        content: 'Qual o status?',
        createdAt: '2026-10-28T00:00:00.000Z',
        id: 'message-1',
        role: 'user',
        sequence: 1,
      },
      {
        content: 'Olá',
        createdAt: '2026-10-28T00:00:01.000Z',
        id: 'message-2',
        role: 'assistant',
        sequence: 2,
      },
    ]);
    ai.getAiPricing.mockResolvedValue({ tokenCostPerMillion: 0.6, usageCost: 1.5 });
    emit?.({
      runId: 'run-1',
      sequence: 3,
      type: 'run.completed',
    });

    await waitFor(() => {
      expect(screen.getByText(/Custo do uso:/)).toHaveTextContent(/1,50/);
    });
  });

  it('sends the draft when Enter is pressed and keeps Shift+Enter as a line break', async () => {
    ai.sendAiMessage.mockResolvedValue({
      conversationId: 'conversation-1',
      messageId: 'message-1',
      runId: 'run-1',
      status: 'QUEUED',
    });
    ai.subscribeToAiRun.mockImplementation(() => () => undefined);
    render(<VetorAgentWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));
    const composer = await screen.findByRole('textbox', { name: 'Mensagem para o agente' });

    fireEvent.change(composer, { target: { value: '   ' } });
    fireEvent.keyDown(composer, { key: 'Enter' });
    expect(ai.sendAiMessage).not.toHaveBeenCalled();

    fireEvent.change(composer, { target: { value: 'Linha 1' } });
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: true });
    expect(ai.sendAiMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(composer, { isComposing: true, key: 'Enter' });
    expect(ai.sendAiMessage).not.toHaveBeenCalled();

    fireEvent.change(composer, { target: { value: 'Qual o status?' } });
    fireEvent.keyDown(composer, { key: 'Enter' });

    expect(ai.sendAiMessage).toHaveBeenCalledWith('conversation-1', 'Qual o status?', []);
    expect(await screen.findByRole('status')).toHaveTextContent('Na fila...');
  });

  it('recovers the final answer after the stream disconnects', async () => {
    ai.sendAiMessage.mockResolvedValue({
      conversationId: 'conversation-1',
      messageId: 'message-1',
      runId: 'run-1',
      status: 'QUEUED',
    });
    ai.getAiRun.mockResolvedValue({
      assistantContent: 'Resposta final',
      assistantMessageId: 'message-2',
      status: 'SUCCEEDED',
    });
    ai.listAiMessages.mockImplementation(async () => {
      if (ai.getAiRun.mock.calls.length === 0) {
        return [];
      }

      return [
        {
          content: 'Qual o status?',
          createdAt: '2026-10-28T00:00:00.000Z',
          id: 'message-1',
          role: 'user',
          sequence: 1,
        },
        {
          content: 'Resposta final',
          createdAt: '2026-10-28T00:00:01.000Z',
          id: 'message-2',
          role: 'assistant',
          sequence: 2,
        },
      ];
    });
    ai.subscribeToAiRun.mockImplementation(
      (_runId: string, handlers: { onDisconnect: () => void }) => {
        queueMicrotask(() => handlers.onDisconnect());
        return () => undefined;
      },
    );
    render(<VetorAgentWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Mensagem para o agente' }), {
      target: { value: 'Qual o status?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Resposta recuperada.');
    });
    expect(screen.getByText('Resposta final')).toBeInTheDocument();
  });

  it('loads a terminal run when the stream stays open without a terminal event', async () => {
    const polls: Array<() => void> = [];
    const interval = vi.spyOn(globalThis, 'setInterval').mockImplementation((handler) => {
      polls.push(handler as () => void);
      return 1 as unknown as ReturnType<typeof setInterval>;
    });
    const clear = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined);
    ai.sendAiMessage.mockResolvedValue({
      conversationId: 'conversation-1',
      messageId: 'message-1',
      runId: 'run-1',
      status: 'QUEUED',
    });
    ai.getAiRun.mockResolvedValue({ status: 'FAILED' });
    ai.listAiMessages.mockResolvedValue([
      {
        content: 'Qual o status?',
        createdAt: '2026-10-28T00:00:00.000Z',
        id: 'message-1',
        role: 'user',
        sequence: 1,
      },
    ]);
    ai.subscribeToAiRun.mockImplementation(() => () => undefined);

    try {
      render(<VetorAgentWorkspace />);
      fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));
      fireEvent.change(await screen.findByRole('textbox', { name: 'Mensagem para o agente' }), {
        target: { value: 'Qual o status?' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Na fila...');
      expect(polls.length).toBeGreaterThan(0);
      polls.at(-1)?.();

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Não foi possível concluir a operação.',
        );
      });
      expect(ai.getAiRun).toHaveBeenCalledWith('run-1');
    } finally {
      interval.mockRestore();
      clear.mockRestore();
    }
  });

  it('resends a user question from Reprocessar and keeps that question on the accent surface', async () => {
    ai.listAiMessages.mockResolvedValue([
      {
        content: 'Qual o status?',
        createdAt: '2026-10-28T00:00:00.000Z',
        id: 'message-1',
        role: 'user',
        sequence: 1,
      },
    ]);
    ai.sendAiMessage.mockResolvedValue({
      conversationId: 'conversation-1',
      messageId: 'message-2',
      runId: 'run-2',
      status: 'QUEUED',
    });
    render(
      <VetorAgentWorkspace
        initialConversationId="conversation-1"
        initialConversations={[
          {
            createdAt: '2026-10-28T00:00:00.000Z',
            id: 'conversation-1',
            preview: 'Qual o status?',
            title: null,
            updatedAt: '2026-10-28T00:00:00.000Z',
          },
        ]}
        initialMessages={[
          {
            content: 'Qual o status?',
            createdAt: '2026-10-28T00:00:00.000Z',
            id: 'message-1',
            role: 'user',
            sequence: 1,
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Qual o status?' })).toHaveTextContent(
      'Qual o status?',
    );
    expect(screen.getByRole('button', { name: 'Renomear Qual o status?' })).not.toHaveTextContent(
      'Renomear',
    );
    expect(screen.getByRole('button', { name: 'Excluir Qual o status?' })).not.toHaveTextContent(
      'Excluir',
    );

    const history = await screen.findByRole('list', { name: 'Histórico da conversa' });
    expect(history.parentElement?.className).toContain('border');
    const question = screen.getByText('Qual o status?').closest('li');
    expect(question?.className).toContain('bg-accent');
    fireEvent.click(screen.getByRole('button', { name: 'Reprocessar' }));

    await waitFor(() => {
      expect(ai.sendAiMessage).toHaveBeenCalledWith('conversation-1', 'Qual o status?', []);
    });
  });

  it('shows the uploaded file after the picker is cleared', async () => {
    ai.uploadAiAttachment.mockResolvedValue({
      conversationId: 'conversation-1',
      createdAt: '2026-11-04T00:00:00.000Z',
      expiresAt: '2026-11-06T00:00:00.000Z',
      id: 'file-1',
      mimeType: 'image/png',
      originalName: 'foto.png',
    });
    render(<VetorAgentWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));
    await screen.findByRole('textbox', { name: 'Mensagem para o agente' });
    const input = document.querySelector('input[type="file"]');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing file input');
    }

    fireEvent.change(input, {
      target: { files: [new File(['png'], 'foto.png', { type: 'image/png' })] },
    });

    expect(await screen.findByText('foto.png')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('keeps the composer when a run is already active', async () => {
    ai.sendAiMessage.mockRejectedValue(
      new ApiError('A run is already active for this conversation.', 409, 'run-active'),
    );
    ai.subscribeToAiRun.mockImplementation(() => () => undefined);
    render(<VetorAgentWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Novo chat' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Mensagem para o agente' }), {
      target: { value: 'Qual o status?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Na fila...');
    expect(screen.getByRole('textbox', { name: 'Mensagem para o agente' })).toHaveValue(
      'Qual o status?',
    );
  });

  it('shows an image attachment inside the user message', async () => {
    ai.listAiMessages.mockResolvedValue([
      {
        attachments: [
          {
            id: 'file-1',
            mimeType: 'image/png',
            originalName: 'foto.png',
          },
        ],
        content: 'o que é essa imagem',
        createdAt: '2026-10-28T00:00:00.000Z',
        id: 'message-1',
        role: 'user',
        sequence: 1,
      },
    ]);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:foto');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const fetchFile = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob(['png'], { type: 'image/png' }),
      ok: true,
    } as Response);
    render(
      <VetorAgentWorkspace
        initialConversationId="conversation-1"
        initialConversations={[
          {
            createdAt: '2026-10-28T00:00:00.000Z',
            id: 'conversation-1',
            preview: 'o que é essa imagem',
            title: null,
            updatedAt: '2026-10-28T00:00:00.000Z',
          },
        ]}
      />,
    );

    const image = await screen.findByRole('img', { name: 'foto.png' });
    expect(image).toHaveAttribute('src', 'blob:foto');
    expect(screen.getByText('o que é essa imagem')).toBeInTheDocument();
    expect(fetchFile).toHaveBeenCalledWith(
      '/api/v1/ai/conversations/conversation-1/attachments/file-1',
      { credentials: 'include' },
    );
    createObjectURL.mockRestore();
    fetchFile.mockRestore();
  });

  it('shows the safe failure copy and a retry for the conversation list', async () => {
    ai.listAiConversations.mockRejectedValueOnce(new Error('offline'));
    render(<VetorAgentWorkspace />);

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Nenhuma conversa ainda.')).toBeInTheDocument();
  });
});
