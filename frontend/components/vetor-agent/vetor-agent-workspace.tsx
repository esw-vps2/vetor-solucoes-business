'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { AgentMessageContent } from './agent-message-content';
import {
  createAiConversation,
  getAiRun,
  deleteAiConversation,
  getAiPricing,
  aiAttachmentUrl,
  listAiConversations,
  listAiMessages,
  renameAiConversation,
  sendAiMessage,
  subscribeToAiRun,
  uploadAiAttachment,
  type AiAttachmentUpload,
  type AiConversationSummary,
  type AiMessage,
  type AiMessageAttachment,
} from '@/lib/api/ai-agent';

type Phase =
  | 'loading'
  | 'ready'
  | 'queued'
  | 'processing'
  | 'streaming'
  | 'reconnecting'
  | 'recovered'
  | 'failed';

const RUN_STATUS_SYNC_MS = 4000;
const focusRing = 'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';
const controlClass = `inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold ${focusRing}`;
const iconControlClass = `inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-navy/10 text-navy ${focusRing}`;
const userMessageClass =
  'rounded-2xl border border-accent bg-accent px-4 py-3 text-base leading-7 text-navy';
const agentMessageClass =
  'rounded-2xl border border-navy/10 bg-white px-4 py-3 text-base leading-7 text-navy';
const roleLabelClass = 'mb-1 block text-xs font-semibold tracking-[0.18em] text-navy/70 uppercase';
const transcriptFrame =
  'mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 rounded-[28px] border border-navy/10 p-4 md:p-6';

const PHASE_COPY: Record<Exclude<Phase, 'loading' | 'ready'>, string> = {
  failed: 'Não foi possível concluir a operação.',
  processing: 'Processando...',
  queued: 'Na fila...',
  reconnecting: 'Reconectando...',
  recovered: 'Resposta recuperada.',
  streaming: 'Processando...',
};

function conversationLabel(conversation: AiConversationSummary): string {
  const title = conversation.title?.trim();

  if (title) {
    return title;
  }

  const preview = conversation.preview.trim();

  if (preview) {
    return preview;
  }

  return 'Nova conversa';
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function AgentActivity() {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1 py-2">
      <span className="size-1.5 animate-pulse rounded-full bg-navy/50 motion-reduce:animate-none" />
      <span className="size-1.5 animate-pulse rounded-full bg-navy/50 [animation-delay:150ms] motion-reduce:animate-none" />
      <span className="size-1.5 animate-pulse rounded-full bg-navy/50 [animation-delay:300ms] motion-reduce:animate-none" />
    </span>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageAttachmentPreview({
  attachment,
  conversationId,
}: {
  attachment: AiMessageAttachment;
  conversationId: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const image = attachment.mimeType.toLowerCase().startsWith('image/');
  const url = aiAttachmentUrl(conversationId, attachment.id);

  useEffect(() => {
    if (!image) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void fetch(url, { credentials: 'include' })
      .then(async (response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image, url]);

  if (image && src) {
    return (
      <img
        alt={attachment.originalName}
        src={src}
        className="max-h-64 max-w-full rounded-2xl border border-navy/10 bg-white object-contain"
      />
    );
  }

  return (
    <a
      href={url}
      className="inline-flex max-w-full items-center rounded-full border border-navy/15 bg-white px-3 py-1 text-sm font-medium text-navy"
    >
      <span className="truncate">{attachment.originalName}</span>
    </a>
  );
}

function MessageAttachments({
  attachments,
  conversationId,
}: {
  attachments: AiMessageAttachment[];
  conversationId: string | null;
}): ReactNode {
  if (!conversationId || attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {attachments.map((attachment) => (
        <MessageAttachmentPreview
          key={attachment.id}
          attachment={attachment}
          conversationId={conversationId}
        />
      ))}
    </div>
  );
}

function formatUsageCost(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 16V6M8 10l4-4 4 4M5 18h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VetorAgentAccessDenied() {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-6 py-10">
      <p className="max-w-md text-base leading-7 text-navy">Você não tem acesso ao Vetor Agent.</p>
    </div>
  );
}

export function VetorAgentWorkspace({
  initialConversationId = null,
  initialConversations,
  initialMessages,
}: {
  initialConversationId?: string | null;
  initialConversations?: AiConversationSummary[];
  initialMessages?: AiMessage[];
} = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    initialConversations ?? [],
  );
  const [listPhase, setListPhase] = useState<'loading' | 'ready' | 'failed'>(
    initialConversations ? 'ready' : 'loading',
  );
  const [activeId, setActiveId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages ?? []);
  const [historyPhase, setHistoryPhase] = useState<'idle' | 'loading' | 'ready' | 'failed'>(
    initialMessages && initialMessages.length > 0 ? 'ready' : 'idle',
  );
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<AiAttachmentUpload[]>([]);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'failed'>('idle');
  const [usageCost, setUsageCost] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [conversationActionError, setConversationActionError] = useState('');
  const [phase, setPhase] = useState<Phase>('ready');
  const [streamText, setStreamText] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [streamGeneration, setStreamGeneration] = useState(0);
  const composerNoteId = useId();
  const uploadInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarWasOpen = useRef(false);
  const reconnects = useRef(0);
  const sending = useRef(false);
  const busy =
    phase === 'queued' ||
    phase === 'processing' ||
    phase === 'streaming' ||
    phase === 'reconnecting';

  useEffect(() => {
    if (sidebarOpen) {
      closeButtonRef.current?.focus();
    } else if (sidebarWasOpen.current) {
      openButtonRef.current?.focus();
    }

    sidebarWasOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const refreshUsageCost = useCallback((signal?: AbortSignal) => {
    void getAiPricing()
      .then((pricing) => {
        if (signal?.aborted || typeof pricing.usageCost !== 'number') {
          return;
        }

        setUsageCost(pricing.usageCost);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadConversations(controller.signal);
    refreshUsageCost(controller.signal);
    return () => controller.abort();
  }, [refreshUsageCost]);

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const controller = new AbortController();
    void listAiMessages(activeId)
      .then((items) => {
        if (!controller.signal.aborted) {
          setMessages(items);
          setHistoryPhase('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setHistoryPhase('failed');
        }
      });

    return () => controller.abort();
  }, [activeId]);

  useEffect(() => {
    if (!activeRunId || !activeId) {
      return;
    }

    const conversationId = activeId;
    const runId = activeRunId;
    let stopped = false;
    const stop = subscribeToAiRun(runId, {
      onDisconnect() {
        if (stopped) {
          return;
        }

        setPhase('reconnecting');
        void recover(conversationId, runId).then((stillActive) => {
          if (!stillActive || stopped || reconnects.current >= 1) {
            return;
          }

          reconnects.current += 1;
          setStreamGeneration((value) => value + 1);
        });
      },
      onEvent(event) {
        if (event.type === 'run.processing') {
          setPhase('processing');
        }

        if (event.type === 'run.delta' && event.delta) {
          setPhase('streaming');
          setStreamText((current) => current + event.delta);
        }

        if (event.type === 'run.completed') {
          stopped = true;
          stop();
          void listAiMessages(conversationId)
            .then((items) => {
              setMessages(items);
              setStreamText('');
              setPhase('ready');
              setActiveRunId(null);
              refreshUsageCost();
            })
            .catch(() => {
              setPhase('failed');
            });
        }

        if (event.type === 'run.failed') {
          stopped = true;
          stop();
          setPhase('failed');
          setStreamText('');
          setActiveRunId(null);
        }
      },
    });

    return () => {
      stopped = true;
      stop();
    };
  }, [activeId, activeRunId, refreshUsageCost, streamGeneration]);

  useEffect(() => {
    if (!activeRunId || !activeId) {
      return;
    }

    const conversationId = activeId;
    const runId = activeRunId;
    let stopped = false;

    async function syncRun(): Promise<void> {
      try {
        const run = await getAiRun(runId);

        if (
          stopped ||
          (run.status !== 'SUCCEEDED' && run.status !== 'FAILED' && run.status !== 'PROCESSING')
        ) {
          return;
        }

        if (run.status === 'PROCESSING') {
          setPhase((current) => (current === 'queued' ? 'processing' : current));
          return;
        }

        const items = await listAiMessages(conversationId);

        if (stopped) {
          return;
        }

        stopped = true;
        setMessages(items);
        setStreamText('');
        setActiveRunId(null);
        setPhase(run.status === 'SUCCEEDED' ? 'recovered' : 'failed');
        if (run.status === 'SUCCEEDED') {
          refreshUsageCost();
        }
      } catch {
        return;
      }
    }

    const timer = setInterval(() => {
      void syncRun();
    }, RUN_STATUS_SYNC_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [activeId, activeRunId, refreshUsageCost]);

  async function loadConversations(signal?: AbortSignal): Promise<void> {
    setListPhase((current) => (current === 'ready' ? current : 'loading'));

    try {
      const list = await listAiConversations();

      if (!signal?.aborted) {
        setConversations(list.items);
        setListPhase('ready');
      }
    } catch {
      if (!signal?.aborted) {
        setListPhase('failed');
      }
    }
  }

  async function recover(conversationId: string, runId: string): Promise<boolean> {
    setPhase('reconnecting');

    try {
      const [run, items] = await Promise.all([getAiRun(runId), listAiMessages(conversationId)]);
      setMessages(items);
      setStreamText('');

      if (run.status === 'SUCCEEDED') {
        setPhase('recovered');
        setActiveRunId(null);
        refreshUsageCost();
        return false;
      }

      if (run.status === 'FAILED') {
        setPhase('failed');
        setActiveRunId(null);
        return false;
      }

      setPhase(run.status === 'PROCESSING' ? 'processing' : 'queued');
      return true;
    } catch {
      setPhase('failed');
      return false;
    }
  }

  async function startNewChat(): Promise<void> {
    const created = await createAiConversation();
    setConversations((current) => [
      {
        createdAt: created.createdAt,
        id: created.id,
        preview: '',
        title: null,
        updatedAt: created.updatedAt,
      },
      ...current,
    ]);
    setActiveId(created.id);
    setMessages([]);
    setHistoryPhase('ready');
    setDraft('');
    setPendingAttachments([]);
    setStreamText('');
    setPhase('ready');
    setActiveRunId(null);
    setSidebarOpen(false);
  }

  function selectConversation(id: string): void {
    setActiveId(id);
    setHistoryPhase('loading');
    setDraft('');
    setPendingAttachments([]);
    setPendingAttachments([]);
    setStreamText('');
    setPhase('ready');
    setActiveRunId(null);
    setSidebarOpen(false);
  }

  function submitComposerFromKeyboard(event: ReactKeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (!activeId || busy || (draft.trim().length === 0 && pendingAttachments.length === 0)) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  async function dispatchMessage(content: string, clearDraft: boolean): Promise<void> {
    if (!activeId || busy || sending.current) {
      return;
    }

    const trimmed = content.trim();
    const attachmentIds = pendingAttachments.map((item) => item.id);

    if (!trimmed && attachmentIds.length === 0) {
      return;
    }

    const messageText = trimmed || 'Arquivos anexados.';
    const sentAttachments = clearDraft
      ? pendingAttachments.map((item) => ({
          id: item.id,
          mimeType: item.mimeType,
          originalName: item.originalName,
        }))
      : [];
    sending.current = true;

    try {
      const submission = await sendAiMessage(activeId, messageText, attachmentIds);
      reconnects.current = 0;

      if (clearDraft) {
        setDraft('');
        setPendingAttachments([]);
      }

      setStreamText('');
      setPhase('queued');
      setMessages((current) => [
        ...current,
        {
          attachments: sentAttachments,
          content: messageText,
          createdAt: new Date().toISOString(),
          id: submission.messageId,
          role: 'user',
          sequence: current.length + 1,
        },
      ]);
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== activeId) {
            return conversation;
          }

          const preview =
            conversation.preview.trim().length > 0
              ? conversation.preview
              : messageText.slice(0, 80);

          return { ...conversation, preview };
        }),
      );
      setActiveRunId(submission.runId);
      setStreamGeneration((value) => value + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.runId) {
        setPhase('queued');
        setActiveRunId(error.runId);
        setStreamGeneration((value) => value + 1);
        return;
      }

      setPhase('failed');
      setActiveRunId(null);
    } finally {
      sending.current = false;
    }
  }

  function beginRename(conversation: AiConversationSummary): void {
    setConversationActionError('');
    setRenamingId(conversation.id);
    setRenameDraft(conversationLabel(conversation));
  }

  function cancelRename(): void {
    setRenamingId(null);
    setRenameDraft('');
  }

  async function commitRename(conversationId: string): Promise<void> {
    const trimmed = renameDraft.trim();

    if (!trimmed) {
      cancelRename();
      return;
    }

    setConversationActionError('');

    try {
      const saved = await renameAiConversation(conversationId, trimmed);
      setConversations((current) =>
        current.map((conversation) => (conversation.id === saved.id ? saved : conversation)),
      );
      cancelRename();
    } catch {
      setConversationActionError('Não foi possível renomear a conversa.');
    }
  }

  async function removeConversation(conversationId: string): Promise<void> {
    if (busy) {
      return;
    }

    const label = conversationLabel(
      conversations.find((conversation) => conversation.id === conversationId) ?? {
        createdAt: '',
        id: conversationId,
        preview: '',
        title: null,
        updatedAt: '',
      },
    );

    if (!window.confirm(`Excluir a conversa "${label}"?`)) {
      return;
    }

    setConversationActionError('');

    try {
      await deleteAiConversation(conversationId);
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId),
      );

      if (activeId === conversationId) {
        setActiveId(null);
        setMessages([]);
        setDraft('');
        setPendingAttachments([]);
        setStreamText('');
        setPhase('ready');
        setActiveRunId(null);
      }

      if (renamingId === conversationId) {
        cancelRename();
      }
    } catch {
      setConversationActionError('Não foi possível excluir a conversa.');
    }
  }

  async function handleAttachmentPick(event: FormEvent<HTMLInputElement>): Promise<void> {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || !activeId || busy) {
      input.value = '';
      return;
    }

    setUploadPhase('uploading');

    try {
      const uploaded = await uploadAiAttachment(activeId, file);
      setPendingAttachments((current) => [...current, uploaded]);
      setUploadPhase('idle');
    } catch {
      setUploadPhase('failed');
    } finally {
      input.value = '';
    }
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await dispatchMessage(draft, true);
  }

  useEffect(() => {
    const node = transcriptRef.current;

    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [messages, phase, streamText]);

  const awaitingReply = busy && streamText.length === 0;
  const centerComposer =
    !activeId ||
    (historyPhase === 'ready' &&
      messages.length === 0 &&
      streamText.length === 0 &&
      !awaitingReply);
  const composerFrameClass = centerComposer
    ? 'shrink-0 px-6 md:px-8'
    : 'shrink-0 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8';
  const composerSpacerClass = centerComposer
    ? 'basis-0 grow transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none'
    : 'basis-0 grow-0 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none';
  const statusCopy =
    phase === 'queued' ||
    phase === 'processing' ||
    phase === 'streaming' ||
    phase === 'reconnecting' ||
    phase === 'recovered' ||
    phase === 'failed'
      ? PHASE_COPY[phase]
      : '';

  return (
    <div className="relative isolate flex h-full min-h-0 w-full flex-1 overflow-x-hidden bg-off-white p-0 font-sans motion-reduce:transition-none md:px-4 md:py-8">
      <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden rounded-none border border-navy/10 bg-white text-navy shadow-2xl md:rounded-[28px]">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Dispensar conversas"
            className={`absolute inset-0 z-30 bg-navy/80 backdrop-blur-md motion-reduce:backdrop-blur-none lg:hidden ${focusRing}`}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <nav
          id="vetor-agent-conversations"
          aria-label="Conversas"
          data-state={sidebarOpen ? 'open' : 'closed'}
          className={`${sidebarOpen ? 'flex' : 'hidden'} absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] flex-col border-r border-navy/10 bg-white px-4 py-6 transition-transform duration-200 motion-reduce:transition-none lg:static lg:flex lg:w-80 lg:max-w-none lg:translate-x-0`}
        >
          <div className="flex flex-col gap-2">
            {usageCost !== null ? (
              <p className="text-sm leading-6 text-text-dark-secondary">
                Custo do uso: {formatUsageCost(usageCost)}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-navy/50 uppercase">
                Conversas
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar conversas"
                className={`inline-flex size-10 items-center justify-center rounded-full border border-navy/10 text-navy lg:hidden ${focusRing}`}
                onClick={() => setSidebarOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
          </div>
          <button
            type="button"
            className={`${controlClass} mt-6 gap-2 bg-accent text-navy`}
            onClick={() => {
              void startNewChat();
            }}
          >
            <PlusIcon />
            Novo chat
          </button>
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            {listPhase === 'loading' ? (
              <p className="text-sm text-text-dark-secondary">Carregando...</p>
            ) : null}
            {listPhase === 'failed' ? (
              <button
                type="button"
                className={`${controlClass} border border-navy/10 text-navy`}
                onClick={() => {
                  void loadConversations();
                }}
              >
                Tentar de novo
              </button>
            ) : null}
            {listPhase === 'ready' && conversations.length === 0 ? (
              <p className="text-sm text-text-dark-secondary">Nenhuma conversa ainda.</p>
            ) : null}
            {conversationActionError ? (
              <p className="mb-3 text-sm text-red-700" role="alert">
                {conversationActionError}
              </p>
            ) : null}
            <ul className="flex flex-col gap-2">
              {conversations.map((conversation) => {
                const selected = conversation.id === activeId;
                const label = conversationLabel(conversation);
                const renaming = renamingId === conversation.id;

                return (
                  <li key={conversation.id} className="flex flex-col gap-2">
                    {renaming ? (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void commitRename(conversation.id);
                        }}
                      >
                        <label className="sr-only" htmlFor={`rename-${conversation.id}`}>
                          Renomear conversa
                        </label>
                        <input
                          id={`rename-${conversation.id}`}
                          value={renameDraft}
                          maxLength={120}
                          className={`min-h-10 w-full rounded-2xl border border-navy/20 bg-off-white px-3 text-sm text-navy ${focusRing}`}
                          onChange={(event) => setRenameDraft(event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" className={`${controlClass} bg-accent text-navy`}>
                            Salvar
                          </button>
                          <button
                            type="button"
                            className={`${controlClass} border border-navy/10 text-navy`}
                            onClick={cancelRename}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-pressed={selected}
                          title={label}
                          className={`${controlClass} min-w-0 flex-1 justify-start px-3 text-left font-medium ${
                            selected ? 'bg-navy/5 text-navy' : 'text-text-dark-secondary'
                          }`}
                          onClick={() => selectConversation(conversation.id)}
                        >
                          <span className="line-clamp-2">{label}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Renomear ${label}`}
                          className={iconControlClass}
                          onClick={() => beginRename(conversation)}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${label}`}
                          disabled={busy}
                          className={`${iconControlClass} disabled:opacity-60`}
                          onClick={() => {
                            void removeConversation(conversation.id);
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center px-4 pt-4 lg:hidden">
            <button
              ref={openButtonRef}
              type="button"
              aria-label="Abrir conversas"
              aria-expanded={sidebarOpen}
              aria-controls="vetor-agent-conversations"
              className={`inline-flex size-10 items-center justify-center rounded-full border border-navy/10 text-navy ${focusRing}`}
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              ref={transcriptRef}
              className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-6 py-8 md:px-8"
            >
              {centerComposer ? null : (
                <div className={`${transcriptFrame} vetor-agent-message-in`}>
                  {historyPhase === 'loading' ? (
                    <p className="text-sm text-text-dark-secondary">Carregando...</p>
                  ) : null}
                  {historyPhase === 'failed' ? (
                    <p className="text-sm text-navy">Não foi possível concluir a operação.</p>
                  ) : null}
                  <ol aria-label="Histórico da conversa" className="flex flex-col gap-4">
                    {messages.map((message) => (
                      <li
                        key={message.id}
                        className={`${message.role === 'user' ? userMessageClass : agentMessageClass} vetor-agent-message-in`}
                      >
                        <span className={roleLabelClass}>
                          {message.role === 'user' ? 'Você' : 'Vetor'}
                        </span>
                        <AgentMessageContent content={message.content} role={message.role} />
                        <MessageAttachments
                          attachments={message.attachments ?? []}
                          conversationId={activeId}
                        />
                        {message.role === 'user' ? (
                          <button
                            type="button"
                            className={`${controlClass} mt-3 border border-navy/20 bg-white text-navy disabled:opacity-60`}
                            disabled={!activeId || busy}
                            onClick={() => {
                              void dispatchMessage(message.content, false);
                            }}
                          >
                            Reprocessar
                          </button>
                        ) : null}
                      </li>
                    ))}
                    {streamText ? (
                      <li className={`${agentMessageClass} vetor-agent-message-in`}>
                        <span className={roleLabelClass}>Vetor</span>
                        <AgentMessageContent content={streamText} role="assistant" streaming />
                        <AgentActivity />
                      </li>
                    ) : null}
                    {awaitingReply ? (
                      <li className={`${agentMessageClass} vetor-agent-message-in`}>
                        <span className={roleLabelClass}>Vetor</span>
                        <AgentActivity />
                      </li>
                    ) : null}
                  </ol>
                  {statusCopy ? (
                    <p role="status" aria-live="polite" className="text-sm text-navy">
                      {statusCopy}
                    </p>
                  ) : null}
                  {phase === 'reconnecting' ? (
                    <button
                      type="button"
                      className={`${controlClass} border border-navy/10 text-navy`}
                      onClick={() => {
                        reconnects.current = 0;
                        setStreamGeneration((value) => value + 1);
                      }}
                    >
                      Tentar de novo
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            <form
              aria-label="Compositor de mensagem"
              data-composer-placement={centerComposer ? 'center' : 'dock'}
              className={composerFrameClass}
              onSubmit={(event) => {
                void submitMessage(event);
              }}
            >
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-[28px] border border-navy/10 bg-white p-6">
                <label
                  className="block text-sm font-semibold text-navy"
                  htmlFor="vetor-agent-composer"
                >
                  Mensagem para o agente
                </label>
                <textarea
                  id="vetor-agent-composer"
                  value={draft}
                  aria-describedby={composerNoteId}
                  disabled={!activeId || busy}
                  placeholder="Digite o prompt"
                  rows={4}
                  className={`min-h-28 w-full resize-none rounded-2xl border border-navy/20 bg-off-white px-4 py-3 text-base text-navy placeholder:text-navy/45 disabled:opacity-60 ${focusRing}`}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={submitComposerFromKeyboard}
                />
                {pendingAttachments.length > 0 ? (
                  <ul className="flex flex-col gap-2" aria-label="Arquivos anexados">
                    {pendingAttachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="rounded-2xl border border-navy/10 bg-off-white px-4 py-2 text-sm text-navy"
                      >
                        {attachment.originalName}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {uploadPhase === 'failed' ? (
                  <p className="text-sm text-red-700" role="alert">
                    Não foi possível enviar o arquivo.
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <p id={composerNoteId} className="sr-only">
                    A mensagem é enviada ao agente desta conversa. Enter envia. Shift+Enter insere
                    uma nova linha.
                  </p>
                  <input
                    ref={fileInputRef}
                    id={uploadInputId}
                    type="file"
                    className="sr-only"
                    disabled={!activeId || busy || uploadPhase === 'uploading'}
                    onChange={(event) => {
                      void handleAttachmentPick(event);
                    }}
                  />
                  <button
                    type="button"
                    disabled={!activeId || busy || uploadPhase === 'uploading'}
                    className={`${controlClass} border border-navy/10 text-navy disabled:opacity-60`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon />
                    Anexar arquivo
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !activeId ||
                      busy ||
                      uploadPhase === 'uploading' ||
                      (draft.trim().length === 0 && pendingAttachments.length === 0)
                    }
                    className={`${controlClass} bg-accent text-navy disabled:opacity-60`}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </form>
            <div aria-hidden="true" className={composerSpacerClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
