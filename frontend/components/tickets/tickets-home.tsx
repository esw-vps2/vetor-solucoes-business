'use client';

import { useEffect, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import Link from 'next/link';
import { ApiError, addTicketAttachment, listTenants, listTickets, createTicket } from '@/lib/api/client';
import type { SafeUser, TenantListItem, TicketSummary } from '@/lib/api/client';
import { Modal } from '@/components/ui/modal';
import {
  CARD_PRIORITIES,
  PROJECT_COPY,
  PROJECT_FILE_ACCEPT,
  cardAttachmentsToUpload,
} from '@/lib/project-kanban';
import {
  DEFAULT_TICKET_PRIORITY,
  TICKET_CATEGORIES,
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

const modalFieldClass =
  'mt-2 w-full rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const modalActionClass =
  'rounded-full bg-accent px-5 py-2 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60';

export function TicketsHome({ user }: { user: SafeUser }) {
  const company = isTicketCompany(user.profile);
  const [items, setItems] = useState<TicketSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [priority, setPriority] = useState(DEFAULT_TICKET_PRIORITY);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [banner, setBanner] = useState('');
  const [listVersion, setListVersion] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    listTickets({
      category: category || undefined,
      page,
      status: status || undefined,
      tenantId: company && tenantId ? tenantId : undefined,
    })
      .then((result) => {
        if (active) {
          setItems(result.items);
          setTotal(result.total);
          setError('');
        }
      })
      .catch((caught: unknown) => {
        if (active) {
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
  }, [category, company, listVersion, notice, page, status, tenantId]);

  useEffect(() => {
    if (!company) {
      return;
    }

    let active = true;

    listTenants()
      .then((rows) => {
        if (active) {
          setTenants(rows.toSorted((left, right) => left.name.localeCompare(right.name, 'pt-BR')));
        }
      })
      .catch(() => {
        if (active) {
          setTenants([]);
        }
      });

    return () => {
      active = false;
    };
  }, [company]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 3 || trimmedTitle.length > 160) {
      setFormError('Título deve ter entre 3 e 160 caracteres.');
      return;
    }

    if (!ticketCategory) {
      setFormError('Selecione uma categoria.');
      return;
    }

    if (trimmedDescription.length < 10 || trimmedDescription.length > 5000) {
      setFormError('Descrição deve ter entre 10 e 5000 caracteres.');
      return;
    }

    setSaving(true);
    setFormError('');

    let opened = false;

    try {
      const result = await createTicket({
        category: ticketCategory,
        description: trimmedDescription,
        priority,
        title: trimmedTitle,
      });
      opened = true;

      for (const file of files) {
        await addTicketAttachment(result.ticket.id, file);
      }

      setBanner('');
      setNotice(result.message);
      setOpen(false);
      setTitle('');
      setTicketCategory('');
      setPriority(DEFAULT_TICKET_PRIORITY);
      setDescription('');
      setFiles([]);
      setFileError('');
    } catch (caught) {
      const message = ticketFeedback(caught instanceof ApiError ? caught.status : 500);

      if (opened) {
        setOpen(false);
        setTitle('');
        setTicketCategory('');
        setPriority(DEFAULT_TICKET_PRIORITY);
        setDescription('');
        setFiles([]);
        setFileError('');
        setBanner(message);
        setListVersion((current) => current + 1);
      } else {
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  function rememberFiles(incoming: File[], existingCount: number) {
    const selected = cardAttachmentsToUpload(incoming, existingCount);

    if (!selected) {
      if (existingCount === 0) {
        setFiles([]);
      }

      setFileError(PROJECT_COPY.invalidFile);
      return;
    }

    setFileError('');
    setFiles(existingCount === 0 ? selected : (current) => [...current, ...selected]);
  }

  function onPasteFiles(event: ClipboardEvent<HTMLFormElement>) {
    const images = imageFilesFromClipboard(event.clipboardData);

    if (images.length === 0) {
      return;
    }

    event.preventDefault();
    rememberFiles(images, files.length);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className={company ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-2'}>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy dark:text-white">
            Filtrar por status
            <select
              className={fieldClass}
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                setStatus(event.target.value);
              }}
              value={status}
            >
              <option value="">Todos</option>
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ticketStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy dark:text-white">
            Filtrar por categoria
            <select
              className={fieldClass}
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                setCategory(event.target.value);
              }}
              value={category}
            >
              <option value="">Todas</option>
              {TICKET_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {ticketCategoryLabel(value)}
                </option>
              ))}
            </select>
          </label>
          {company ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-navy dark:text-white">
              Filtrar por tenant
              <select
                className={fieldClass}
                onChange={(event) => {
                  setLoading(true);
                  setPage(1);
                  setTenantId(event.target.value);
                }}
                value={tenantId}
              >
                <option value="">Todos</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {company ? null : (
          <button
            type="button"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            onClick={() => {
              setFormError('');
              setOpen(true);
            }}
          >
            Abrir chamado
          </button>
        )}
      </div>
      {notice ? (
        <p role="status" className="text-sm text-navy dark:text-white">
          {notice}
        </p>
      ) : null}
      {banner ? (
        <p role="alert" className="text-sm text-red-700">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="text-sm text-navy/70 dark:text-white/70">
          Carregando chamados.
        </p>
      ) : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-navy/70 dark:text-white/70">Nenhum chamado.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/portal/chamados/${item.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-navy/10 bg-white p-4 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/10 dark:bg-navy"
            >
              <span className="text-xs text-navy/60 dark:text-white/60">{item.id}</span>
              <span className="text-base font-semibold text-navy dark:text-white">
                {item.title}
              </span>
              <span className="text-sm text-navy/80 dark:text-white/80">
                {ticketCategoryLabel(item.category)} · {ticketStatusLabel(item.status)}
                {company ? ` · ${item.tenantName}` : ''}
              </span>
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${ticketPriorityPresentation(item.priority).chipClass}`}
              >
                {ticketPriorityPresentation(item.priority).label}
              </span>
              <span className="text-sm text-navy/70 dark:text-white/70">
                {formatTicketDate(item.updatedAt)}
              </span>
              {item.hasNewComments ? (
                <span className="text-sm font-semibold text-navy dark:text-white">
                  Comentário novo
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {total > 20 ? (
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
            disabled={page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((current) => current - 1);
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
            disabled={page * 20 >= total}
            onClick={() => {
              setLoading(true);
              setPage((current) => current + 1);
            }}
          >
            Próxima
          </button>
        </div>
      ) : null}
      <Modal
        labelledBy="abrir-chamado-titulo"
        onClose={() => setOpen(false)}
        open={open}
        showClose={false}
        tone="light"
      >
        <h2 id="abrir-chamado-titulo" className="text-xl font-semibold text-navy">
          Abrir chamado
        </h2>
        <div className="mt-4">
          <form
            className="grid min-w-0 gap-4 rounded-[24px] border border-navy/10 bg-white p-4 md:grid-cols-2 md:p-5"
            onPaste={onPasteFiles}
            onSubmit={onCreate}
          >
            <label className="block text-sm font-medium text-navy">
              Título
              <input
                className={modalFieldClass}
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Categoria
              <select
                className={modalFieldClass}
                onChange={(event) => setTicketCategory(event.target.value)}
                value={ticketCategory}
              >
                <option value="">Selecione</option>
                {TICKET_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {ticketCategoryLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy md:col-span-2">
              Descrição
              <textarea
                className={`${modalFieldClass} min-h-24`}
                maxLength={5000}
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              {PROJECT_COPY.priority}
              <select
                className={modalFieldClass}
                onChange={(event) => setPriority(event.target.value)}
                value={priority}
              >
                {CARD_PRIORITIES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label
                className="block text-sm font-medium text-navy"
                htmlFor="abrir-chamado-anexos"
              >
                {PROJECT_COPY.attach}
              </label>
              <input
                accept={PROJECT_FILE_ACCEPT}
                className={modalFieldClass}
                id="abrir-chamado-anexos"
                multiple
                onChange={(event) => {
                  rememberFiles(Array.from(event.target.files ?? []), 0);
                  event.target.value = '';
                }}
                type="file"
              />
              {files.length > 0 ? (
                <p className="mt-2 text-xs text-[#64748b]">{files.map((file) => file.name).join(', ')}</p>
              ) : null}
              <p className={`mt-2 text-xs ${fileError ? 'text-[#f43f5e]' : 'text-[#64748b]'}`}>
                {fileError || PROJECT_COPY.attachmentFileLimit}
              </p>
            </div>
            {formError ? (
              <p role="alert" className="text-xs text-[#f43f5e] md:col-span-2">
                {formError}
              </p>
            ) : null}
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={modalActionClass} disabled={saving}>
                Salvar
              </button>
              <button type="button" className={modalActionClass} onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </section>
  );
}
