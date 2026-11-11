'use client';

import { useEffect, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import {
  ApiError,
  addTicketAttachment,
  cardAttachmentSrc,
  createTicketComment,
  getTicket,
  markTicketRead,
  updateTicketStatus,
} from '@/lib/api/client';
import type { SafeUser, TicketDetail } from '@/lib/api/client';
import {
  PROJECT_COPY,
  PROJECT_FILE_ACCEPT,
  cardAttachmentsToUpload,
} from '@/lib/project-kanban';
import {
  TICKET_STATUSES,
  formatTicketDate,
  imageFilesFromClipboard,
  isTicketCompany,
  ticketCategoryLabel,
  ticketFeedback,
  ticketPriorityPresentation,
  ticketStatusLabel,
} from '@/lib/tickets';

const fieldClass =
  'w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:bg-navy dark:text-white';

export function TicketDetailView({ ticketId, user }: { ticketId: string; user: SafeUser }) {
  const company = isTicketCompany(user.profile);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    getTicket(ticketId)
      .then((result) => {
        if (active) {
          setTicket(result);
          setStatus(result.status);
          setError('');
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setTicket(null);
          setError(ticketFeedback(caught instanceof ApiError ? caught.status : 500));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [ticketId, notice]);

  async function onStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const result = await updateTicketStatus(ticketId, status);
      setNotice(result.message);
    } catch (caught) {
      setError(ticketFeedback(caught instanceof ApiError ? caught.status : 500));
    } finally {
      setSaving(false);
    }
  }

  async function onComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = comment.trim();

    if (body.length < 2 || body.length > 5000) {
      setError('Comentário deve ter entre 2 e 5000 caracteres.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await createTicketComment(ticketId, body);
      setComment('');
      setNotice(result.message);
    } catch (caught) {
      setError(ticketFeedback(caught instanceof ApiError ? caught.status : 500));
    } finally {
      setSaving(false);
    }
  }

  async function onRead() {
    setSaving(true);
    setError('');

    try {
      await markTicketRead(ticketId);
      setNotice('Operação realizada com sucesso.');
    } catch (caught) {
      setError(ticketFeedback(caught instanceof ApiError ? caught.status : 500));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="text-sm text-navy/70 dark:text-white/70">
        Carregando chamado.
      </p>
    );
  }

  if (!ticket) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error || 'Este registro não existe.'}
      </p>
    );
  }

  async function uploadFiles(incoming: File[]) {
    if (!ticket) {
      return;
    }

    const selected = cardAttachmentsToUpload(incoming, ticket.attachments.length);

    if (!selected) {
      setError(PROJECT_COPY.invalidFile);
      return;
    }

    if (selected.length === 0) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      for (const file of selected) {
        await addTicketAttachment(ticket.id, file);
      }

      setNotice('Operação realizada com sucesso.');
    } catch (caught) {
      setError(ticketFeedback(caught instanceof ApiError ? caught.status : 500));
    } finally {
      setSaving(false);
    }
  }

  function onPasteImages(event: ClipboardEvent<HTMLElement>) {
    const images = imageFilesFromClipboard(event.clipboardData);

    if (images.length === 0) {
      return;
    }

    event.preventDefault();
    void uploadFiles(images);
  }

  const priority = ticketPriorityPresentation(ticket.priority);

  return (
    <article className="flex flex-col gap-6" onPaste={onPasteImages}>
      {notice ? (
        <p role="status" className="text-sm text-navy dark:text-white">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <header className="flex flex-col gap-2">
        <p className="text-xs text-navy/60 dark:text-white/60">{ticket.id}</p>
        <h2 className="text-2xl font-semibold text-navy dark:text-white">{ticket.title}</h2>
        <p className="text-sm text-navy/80 dark:text-white/80">
          {ticketCategoryLabel(ticket.category)} · {ticketStatusLabel(ticket.status)}
        </p>
        <p className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${priority.chipClass}`}>
          {priority.label}
        </p>
        {ticket.hasNewComments ? (
          <p className="text-sm font-semibold text-navy dark:text-white">Comentário novo</p>
        ) : null}
      </header>
      <p className="whitespace-pre-wrap text-sm text-navy dark:text-white">{ticket.description}</p>
      <dl className="grid gap-3 text-sm text-navy sm:grid-cols-2 dark:text-white">
        <div>
          <dt className="font-medium">Cliente</dt>
          <dd>{ticket.tenant.displayName}</dd>
        </div>
        <div>
          <dt className="font-medium">Aberto por</dt>
          <dd>{ticket.openedBy.displayName}</dd>
        </div>
        <div>
          <dt className="font-medium">Criado em</dt>
          <dd>{formatTicketDate(ticket.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium">Atualizado em</dt>
          <dd>{formatTicketDate(ticket.updatedAt)}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="w-fit rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
        disabled={saving}
        onClick={() => {
          void onRead();
        }}
      >
        Marcar como visto
      </button>
      {company ? (
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onStatus}>
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-navy dark:text-white">
            Alterar status
            <select
              className={fieldClass}
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ticketStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            disabled={saving}
          >
            Salvar status
          </button>
        </form>
      ) : null}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-navy dark:text-white">{PROJECT_COPY.attachments}</h3>
        {ticket.attachments.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {ticket.attachments.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-navy"
              >
                <PaperclipIcon />
                <a
                  className="text-sm font-semibold text-navy underline dark:text-white"
                  href={cardAttachmentSrc(file.url)}
                >
                  {file.originalName}
                </a>
                <span className="text-xs text-navy/60 dark:text-white/60">
                  {PROJECT_COPY.uploadedBy} {file.createdByFirstName} {file.createdByLastName}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-navy/25 bg-white px-4 py-6 text-center transition-colors hover:border-accent/60 dark:border-white/25 dark:bg-navy dark:hover:bg-navy-100">
          <PaperclipIcon />
          <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy">
            {PROJECT_COPY.uploadFile}
          </span>
          <input
            accept={PROJECT_FILE_ACCEPT}
            aria-label={PROJECT_COPY.uploadFile}
            className="sr-only"
            disabled={saving}
            multiple
            onChange={(event) => {
              void uploadFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
            type="file"
          />
        </label>
        <p className="text-center text-xs text-navy/60 dark:text-white/60">
          {PROJECT_COPY.attachmentFileLimit}
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-navy dark:text-white">Comentários</h3>
        {ticket.comments.length === 0 ? (
          <p className="text-sm text-navy/70 dark:text-white/70">Nenhum comentário.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {ticket.comments.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-navy/10 bg-white p-4 dark:border-white/10 dark:bg-navy"
              >
                <p className="text-sm font-semibold text-navy dark:text-white">
                  {item.author.displayName}
                </p>
                <p className="text-xs text-navy/60 dark:text-white/60">
                  {formatTicketDate(item.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-navy dark:text-white">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        )}
        <form className="flex flex-col gap-3" onSubmit={onComment}>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy dark:text-white">
            Comentário
            <textarea
              className={fieldClass}
              maxLength={5000}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              value={comment}
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            disabled={saving}
          >
            Enviar comentário
          </button>
        </form>
      </section>
    </article>
  );
}

function PaperclipIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 fill-current text-navy dark:text-white" viewBox="0 0 16 16">
      <path d="M10.3 3.4 4.6 9.1a2.4 2.4 0 1 0 3.4 3.4l6.2-6.2a3.7 3.7 0 0 0-5.2-5.2L2.7 7.3a5 5 0 0 0 7.1 7.1l5.1-5.1.9.9-5.1 5.1A6.2 6.2 0 0 1 1.8 6.5l6.6-6.6a4.9 4.9 0 0 1 6.9 6.9l-6.2 6.2a3.6 3.6 0 1 1-5.1-5.1l5.7-5.7Z" />
    </svg>
  );
}
