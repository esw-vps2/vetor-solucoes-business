'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { FinanceDocumentsContent } from './finance-documents-content';
import {
  createTenantNote,
  deleteContractFile,
  deleteFinanceProject,
  deleteTenantNote,
  downloadContractFile,
  getProjectFinance,
  listFinanceProjects,
  listTenantNotes,
  replaceFinanceCostLines,
  saveProjectContract,
  updateTenantNote,
  uploadContractFile,
} from '@/lib/api/client';
import type {
  FinanceProject,
  ProjectFinance,
  SafeUser,
  TenantNote,
} from '@/lib/api/client';
import {
  CONTRACT_STATUS_OPTIONS,
  contractStatusLabel,
  formatCentsBRL,
  isCalendarDate,
  parseInstallmentCount,
  parseReaisToCents,
  saoPauloCalendarDate,
} from '@/lib/finance';

const fieldClass =
  'min-h-10 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';
const buttonClass =
  'min-h-10 cursor-pointer rounded-full bg-accent px-4 text-sm font-semibold text-navy transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const ghostClass =
  'min-h-10 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const rowActionClass =
  'min-h-10 cursor-pointer rounded-full border border-navy/15 bg-white px-3 text-sm font-semibold text-navy transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10';

function reaisFromCents(cents: number): string {
  return cents > 0 ? (cents / 100).toFixed(2).replace('.', ',') : '';
}

interface CostLineDraft {
  label: string;
  amount: string;
}

interface InstallmentDraft {
  amount: string;
  dueOn: string;
}

function installmentDraftsFromDetail(detail: ProjectFinance, count: number): InstallmentDraft[] {
  const byPosition = new Map(detail.installments.map((item) => [item.position, item]));

  return Array.from({ length: count }, (_, index) => {
    const item = byPosition.get(index + 1);
    return {
      amount: reaisFromCents(item?.amountCents ?? 0),
      dueOn: item?.dueOn ?? '',
    };
  });
}

function resizeInstallmentDrafts(current: InstallmentDraft[], count: number): InstallmentDraft[] {
  const next = current.slice(0, count);

  while (next.length < count) {
    next.push({ amount: '', dueOn: '' });
  }

  return next;
}

function centsOrZero(value: string): number {
  if (value.trim() === '') {
    return 0;
  }

  return parseReaisToCents(value) ?? 0;
}

function installmentDatesValid(drafts: InstallmentDraft[]): boolean {
  return drafts.every((draft) => {
    const dueOn = draft.dueOn.trim();
    return dueOn === '' || isCalendarDate(dueOn);
  });
}

function derivedPaidCents(drafts: InstallmentDraft[], today: string): number {
  return drafts.reduce((sum, draft) => {
    const dueOn = draft.dueOn.trim();

    if (!dueOn || !isCalendarDate(dueOn) || dueOn > today) {
      return sum;
    }

    return sum + centsOrZero(draft.amount);
  }, 0);
}

function installmentPayload(
  drafts: InstallmentDraft[],
): { amountCents: number; dueOn: string | null }[] | null {
  const payload: { amountCents: number; dueOn: string | null }[] = [];

  for (const draft of drafts) {
    const dueOn = draft.dueOn.trim();

    if (draft.amount.trim() === '') {
      payload.push({ amountCents: 0, dueOn: dueOn || null });
      continue;
    }

    const cents = parseReaisToCents(draft.amount);

    if (cents === null) {
      return null;
    }

    payload.push({ amountCents: cents, dueOn: dueOn || null });
  }

  return payload;
}

function costLineError(lines: CostLineDraft[]): string | null {
  for (const line of lines) {
    const label = line.label.trim();
    const amount = line.amount.trim();

    if (!label && !amount) {
      continue;
    }

    if (label.length > 80) {
      return 'O nome do custo deve ter no máximo 80 caracteres.';
    }

    if (!label || !amount) {
      return 'Preencha todos os campos obrigatórios.';
    }

    const cents = parseReaisToCents(amount);

    if (cents === null || cents < 1) {
      return 'Informe um valor válido em reais.';
    }
  }

  return null;
}

function savedCostLines(lines: CostLineDraft[]): { label: string; amountCents: number }[] {
  return lines.flatMap((line) => {
    const label = line.label.trim();
    const amount = line.amount.trim();

    if (!label && !amount) {
      return [];
    }

    const amountCents = parseReaisToCents(amount);

    if (!label || amountCents === null || amountCents < 1) {
      return [];
    }

    return [{ amountCents, label }];
  });
}

export function FinanceHome({ user }: { user: SafeUser }) {
  if (user.profile !== 'Administrador') {
    return <p className="text-navy dark:text-white">Você não tem acesso ao financeiro.</p>;
  }

  return <FinanceDesk />;
}

function FinanceDesk() {
  const [projects, setProjects] = useState<FinanceProject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [editor, setEditor] = useState<{ projectId: string; detail: ProjectFinance | null } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<FinanceProject | null>(null);
  const [documentsProject, setDocumentsProject] = useState<FinanceProject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [noteCreateTick, setNoteCreateTick] = useState(0);

  async function reload() {
    const list = await listFinanceProjects();
    setProjects(list.projects);
    return list;
  }

  useEffect(() => {
    let active = true;

    listFinanceProjects()
      .then((list) => {
        if (!active) {
          return;
        }

        setProjects(list.projects);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar o financeiro.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function openEditor(projectId: string) {
    setMessage(null);
    setError(null);
    setEditor({ detail: null, projectId });

    if (!projectId) {
      return;
    }

    void getProjectFinance(projectId)
      .then((detail) => {
        setEditor((current) =>
          current?.projectId === projectId ? { detail, projectId } : current,
        );
      })
      .catch(() => {
        setError('Não foi possível carregar o financeiro.');
        setEditor(null);
      });
  }

  if (loading) {
    return (
      <p role="status" className="text-navy dark:text-white">
        Carregando...
      </p>
    );
  }

  if (!projects) {
    return (
      <p role="alert" className="text-navy dark:text-white">
        {error}
      </p>
    );
  }

  const tenantOptions = [
    ...new Map(projects.map((project) => [project.tenantId, project.tenantName])),
  ]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }));
  const visibleProjects =
    tenantFilter === 'all'
      ? projects
      : projects.filter((project) => project.tenantId === tenantFilter);
  const totals = visibleProjects.reduce(
    (sum, project) => ({
      costAmountCents: sum.costAmountCents + project.costAmountCents,
      openAmountCents: sum.openAmountCents + project.openAmountCents,
      paidAmountCents: sum.paidAmountCents + project.paidAmountCents,
      totalAmountCents: sum.totalAmountCents + project.totalAmountCents,
    }),
    {
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      totalAmountCents: 0,
    },
  );

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-4">
      <section
        aria-label="Filtros e ações"
        className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-navy/10 bg-white p-4 dark:border-white/10 dark:bg-navy-100 sm:p-5"
      >
        <label className="block w-full max-w-sm text-sm font-medium text-navy dark:text-white">
          Tenant
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-navy/10 bg-off-white px-4 py-3 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:bg-navy-50 dark:text-white"
            value={tenantFilter}
            onChange={(event) => {
              setTenantFilter(event.target.value);
              setNoteCreateTick(0);
            }}
          >
            <option value="all">Todas</option>
            {tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end">
          {tenantFilter !== 'all' ? (
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setMessage(null);
                setError(null);
                setNoteCreateTick((tick) => tick + 1);
              }}
            >
              Nova anotação
            </button>
          ) : null}
          <button type="button" className={buttonClass} onClick={() => openEditor('')}>
            Novo Projeto
          </button>
        </div>
      </section>
      {message ? (
        <p
          role="status"
          className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-navy dark:text-white"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-300/20 dark:bg-red-950/30 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}
      <Totals amounts={totals} />
      <section
        aria-label="Projetos financeiros"
        className="overflow-hidden rounded-[28px] border border-navy/10 bg-white dark:border-white/10 dark:bg-navy-100"
      >
        {visibleProjects.length === 0 ? (
          <p className="p-6 text-sm text-text-dark-secondary dark:text-text-secondary">
            Nenhum projeto neste tenant.
          </p>
        ) : (
          <div
            className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Tabela de projetos financeiros"
          >
            <table className="w-full min-w-[1100px] text-left text-sm text-navy dark:text-white">
              <caption className="sr-only">Projetos financeiros</caption>
              <thead className="bg-warm-gray/70 dark:bg-navy-50">
                <tr className="border-b border-navy/10 dark:border-white/10">
                  {[
                    'Tenant',
                    'Workspace',
                    'Projeto',
                    'Situação',
                    'Valor do contrato',
                    'Pago',
                    'Valor Pendente',
                    'Parcelas',
                    'Custo',
                  ].map((label, index) => (
                    <th
                      key={label}
                      scope="col"
                      className={`whitespace-nowrap px-2 py-3 font-semibold ${
                        index >= 4 ? 'text-right' : ''
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10 dark:divide-white/10">
                {visibleProjects.map((project) => (
                  <tr
                    key={project.projectId}
                    className="transition-colors hover:bg-navy/[0.025] dark:hover:bg-white/[0.04]"
                  >
                    <td className="whitespace-nowrap px-2 py-4 text-text-dark-secondary dark:text-text-secondary">
                      {project.tenantName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-text-dark-secondary dark:text-text-secondary">
                      {project.workspaceName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 font-semibold">
                      {project.projectName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${contractStatusClass(project.contract?.status)}`}
                      >
                        {contractStatusLabel(project.contract?.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right font-medium tabular-nums">
                      {formatCentsBRL(project.totalAmountCents)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right font-medium tabular-nums">
                      {formatCentsBRL(project.paidAmountCents)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right font-medium tabular-nums">
                      {formatCentsBRL(project.openAmountCents)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right tabular-nums">
                      {project.installmentCount ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right font-medium tabular-nums">
                      {formatCentsBRL(project.costAmountCents)}
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex flex-nowrap gap-2">
                        <button
                          type="button"
                          className={rowActionClass}
                          aria-label={`Editar ${project.projectName}`}
                          onClick={() => openEditor(project.projectId)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={rowActionClass}
                          aria-label={`Excluir ${project.projectName}`}
                          onClick={() => {
                            setMessage(null);
                            setError(null);
                            setPendingDelete(project);
                          }}
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          className={rowActionClass}
                          aria-label={`Arquivos do projeto ${project.projectName}`}
                          onClick={() => {
                            setMessage(null);
                            setError(null);
                            setDocumentsProject(project);
                          }}
                        >
                          Arquivos do projeto
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {tenantFilter !== 'all' ? (
        <TenantNotesSection
          createTick={noteCreateTick}
          tenantId={tenantFilter}
          onMessage={setMessage}
          onError={setError}
        />
      ) : null}
      <Modal
        labelledBy="finance-documents-title"
        open={documentsProject !== null}
        onClose={() => setDocumentsProject(null)}
        tone="light"
      >
        {documentsProject ? (
          <FinanceDocumentsContent
            key={documentsProject.projectId}
            project={documentsProject}
            onMessage={setMessage}
          />
        ) : null}
      </Modal>
      <Modal
        labelledBy="finance-project-title"
        open={editor !== null}
        onClose={() => setEditor(null)}
        tone="light"
      >
        {editor ? (
          <ProjectFinanceForm
            key={editor.projectId || 'new'}
            detail={editor.detail}
            pendingProjectId={editor.projectId}
            projects={visibleProjects}
            onClose={() => setEditor(null)}
            onProjectChange={openEditor}
            onSaved={async () => {
              await reload();
              setEditor(null);
              setMessage('Operação realizada com sucesso.');
            }}
          />
        ) : null}
      </Modal>
      <Modal
        labelledBy="finance-delete-title"
        open={pendingDelete !== null}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        tone="light"
      >
        {pendingDelete ? (
          <div className="flex flex-col gap-4 text-navy">
            <h2 id="finance-delete-title" className="pr-10 text-2xl font-semibold text-navy">
              Excluir este projeto e todos os cards?
            </h2>
            <p>
              {pendingDelete.tenantName} · {pendingDelete.workspaceName} ·{' '}
              {pendingDelete.projectName}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className={ghostClass}
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={deleting}
                onClick={() => {
                  const projectId = pendingDelete.projectId;
                  setDeleting(true);
                  void deleteFinanceProject(projectId)
                    .then(() => reload())
                    .then(() => {
                      setPendingDelete(null);
                      setMessage('Operação realizada com sucesso.');
                    })
                    .catch(() => {
                      setError('Não foi possível concluir a operação.');
                      setPendingDelete(null);
                    })
                    .finally(() => {
                      setDeleting(false);
                    });
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function contractStatusClass(status: string | undefined): string {
  if (status === 'active') {
    return 'bg-accent/20 text-navy dark:text-white';
  }

  if (status === 'closed') {
    return 'bg-navy/10 text-navy dark:bg-white/10 dark:text-white';
  }

  if (status === 'cancelled') {
    return 'bg-red-100 text-red-800 dark:bg-red-300/15 dark:text-red-200';
  }

  if (status === 'draft') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200';
  }

  return 'bg-warm-gray text-text-dark-secondary dark:bg-navy-50 dark:text-text-secondary';
}

const NOTE_POSTIT_ROTATIONS = [
  '-rotate-1',
  'rotate-1',
  '-rotate-2',
  'rotate-2',
  'rotate-0',
] as const;

function TenantNotesSection({
  tenantId,
  createTick,
  onMessage,
  onError,
}: {
  tenantId: string;
  createTick: number;
  onMessage: (value: string | null) => void;
  onError: (value: string | null) => void;
}) {
  const [notes, setNotes] = useState<TenantNote[] | null>(null);
  const [notesTenantId, setNotesTenantId] = useState(tenantId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    note: TenantNote | null;
    title: string;
    body: string;
  } | null>(null);
  const [openedTick, setOpenedTick] = useState(createTick);
  const [pendingDelete, setPendingDelete] = useState<TenantNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (notesTenantId !== tenantId) {
    setNotesTenantId(tenantId);
    setNotes(null);
    setLoadError(null);
  }

  if (openedTick !== createTick) {
    setOpenedTick(createTick);
    if (createTick !== 0) {
      setEditor({ body: '', note: null, title: '' });
    }
  }

  useEffect(() => {
    let active = true;

    listTenantNotes(tenantId)
      .then((list) => {
        if (active) {
          setNotes(list);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('Não foi possível carregar as anotações.');
          setNotes([]);
        }
      });

    return () => {
      active = false;
    };
  }, [tenantId]);

  async function reloadNotes() {
    const list = await listTenantNotes(tenantId);
    setNotes(list);
    setLoadError(null);
    return list;
  }

  return (
    <section className="flex flex-col gap-5 rounded-[28px] border border-navy/10 bg-white p-5 dark:border-white/10 dark:bg-navy-100 sm:p-6">
      <h2 className="text-lg font-semibold text-navy dark:text-white">Anotações</h2>
      {loadError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-300/20 dark:bg-red-950/30 dark:text-red-200"
        >
          {loadError}
        </p>
      ) : null}
      {notes === null ? (
        <p role="status" className="text-sm text-text-dark-secondary dark:text-text-secondary">
          Carregando...
        </p>
      ) : notes.length === 0 && !loadError ? (
        <p className="text-sm text-text-dark-secondary dark:text-text-secondary">
          Nenhuma anotação neste tenant.
        </p>
      ) : (
        <ul className="flex flex-wrap items-start gap-4">
          {notes.map((note, index) => (
            <li key={note.id}>
              <button
                type="button"
                className={`flex h-36 w-36 cursor-pointer items-start overflow-hidden rounded-xl border border-amber-900/15 bg-[#F5E6A3] p-3 text-left shadow-[2px_3px_0_rgba(15,40,70,0.12)] transition hover:-translate-y-0.5 hover:shadow-[3px_4px_0_rgba(15,40,70,0.16)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-amber-100/20 dark:bg-[#D4B84A] dark:shadow-[2px_3px_0_rgba(0,0,0,0.35)] ${NOTE_POSTIT_ROTATIONS[index % NOTE_POSTIT_ROTATIONS.length]}`}
                onClick={() => {
                  onMessage(null);
                  onError(null);
                  setEditor({ body: note.body, note, title: note.title });
                }}
              >
                <span className="line-clamp-5 w-full break-words text-sm font-semibold leading-snug text-navy">
                  {note.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal
        labelledBy="finance-note-title"
        open={editor !== null}
        onClose={() => {
          if (!saving) {
            setEditor(null);
          }
        }}
        tone="light"
      >
        {editor ? (
          <form
            className="flex flex-col gap-5 text-navy"
            onSubmit={(event) => {
              event.preventDefault();
              const title = editor.title.trim();
              const body = editor.body.trim();

              if (!title || !body) {
                onError('Não foi possível concluir a operação.');
                return;
              }

              setSaving(true);
              const request = editor.note
                ? updateTenantNote(tenantId, editor.note.id, { body, title })
                : createTenantNote(tenantId, { body, title });

              void request
                .then(() => reloadNotes())
                .then(() => {
                  setEditor(null);
                  onMessage('Operação realizada com sucesso.');
                  onError(null);
                })
                .catch(() => {
                  onError('Não foi possível concluir a operação.');
                })
                .finally(() => {
                  setSaving(false);
                });
            }}
          >
            <h2 id="finance-note-title" className="pr-10 text-2xl font-semibold text-navy">
              {editor.note ? 'Editar anotação' : 'Nova anotação'}
            </h2>
            <label className="block text-sm font-medium text-navy">
              Título
              <input
                className={`mt-2 ${fieldClass}`}
                value={editor.title}
                maxLength={120}
                required
                onChange={(event) =>
                  setEditor((current) =>
                    current ? { ...current, title: event.target.value } : current,
                  )
                }
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Anotação
              <textarea
                className={`${fieldClass} mt-2 min-h-32 py-2`}
                value={editor.body}
                maxLength={4000}
                required
                onChange={(event) =>
                  setEditor((current) =>
                    current ? { ...current, body: event.target.value } : current,
                  )
                }
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={ghostClass}
                disabled={saving}
                onClick={() => setEditor(null)}
              >
                Cancelar
              </button>
              {editor.note ? (
                <button
                  type="button"
                  className={ghostClass}
                  disabled={saving}
                  onClick={() => {
                    if (editor.note) {
                      setPendingDelete(editor.note);
                    }
                  }}
                >
                  Excluir
                </button>
              ) : null}
              <button type="submit" className={buttonClass} disabled={saving}>
                Salvar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
      <Modal
        labelledBy="finance-note-delete-title"
        open={pendingDelete !== null}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        tone="light"
      >
        {pendingDelete ? (
          <div className="flex flex-col gap-4 text-navy">
            <h2 id="finance-note-delete-title" className="pr-10 text-2xl font-semibold text-navy">
              Excluir esta anotação?
            </h2>
            <p>{pendingDelete.title}</p>
            <div className="flex gap-3">
              <button
                type="button"
                className={ghostClass}
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={deleting}
                onClick={() => {
                  const id = pendingDelete.id;
                  setDeleting(true);
                  void deleteTenantNote(tenantId, id)
                    .then(() => reloadNotes())
                    .then(() => {
                      setPendingDelete(null);
                      setEditor(null);
                      onMessage('Operação realizada com sucesso.');
                      onError(null);
                    })
                    .catch(() => {
                      onError('Não foi possível concluir a operação.');
                      setPendingDelete(null);
                    })
                    .finally(() => {
                      setDeleting(false);
                    });
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

function Totals({
  amounts,
}: {
  amounts: {
    totalAmountCents: number;
    paidAmountCents: number;
    openAmountCents: number;
    costAmountCents: number;
  };
}) {
  const items = [
    ['Valor do contrato', amounts.totalAmountCents],
    ['Pago', amounts.paidAmountCents],
    ['Valor Pendente', amounts.openAmountCents],
    ['Custo', amounts.costAmountCents],
  ] as const;

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, cents]) => (
        <div
          key={label}
          className="min-h-28 rounded-[28px] border border-navy/10 border-t-4 border-t-accent bg-white p-5 dark:border-white/10 dark:bg-navy-100"
        >
          <dt className="block text-xs font-semibold tracking-[0.08em] text-text-dark-secondary uppercase dark:text-text-secondary">
            {label}
          </dt>
          <dd className="mt-3 block text-xl font-semibold tracking-[-0.02em] text-navy tabular-nums dark:text-white">
            {formatCentsBRL(cents)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectFinanceForm({
  projects,
  pendingProjectId,
  detail,
  onProjectChange,
  onSaved,
  onClose,
}: {
  projects: FinanceProject[];
  pendingProjectId: string;
  detail: ProjectFinance | null;
  onProjectChange: (projectId: string) => void;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const selected = projects.find((project) => project.projectId === pendingProjectId);

  return (
    <div className="flex flex-col gap-5 text-navy">
      <h2 id="finance-project-title" className="pr-10 text-2xl font-semibold text-navy">
        {selected?.projectName ?? 'Novo Projeto'}
      </h2>
      <label className="text-sm font-semibold">
        Projeto
        <select
          className={`${fieldClass} mt-2`}
          value={pendingProjectId}
          onChange={(event) => onProjectChange(event.target.value)}
        >
          <option value="">Selecione um projeto</option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.tenantName} · {project.workspaceName} · {project.projectName}
            </option>
          ))}
        </select>
      </label>
      {detail ? (
        <ProjectFinanceFields
          key={detail.projectId}
          detail={detail}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : pendingProjectId ? (
        <p role="status">Carregando...</p>
      ) : null}
    </div>
  );
}

function ProjectFinanceFields({
  detail,
  onSaved,
  onClose,
}: {
  detail: ProjectFinance;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const contract = detail.contract;
  const [title, setTitle] = useState(contract?.title ?? detail.projectName);
  const [signedOn, setSignedOn] = useState(contract?.signedOn ?? '');
  const [startsOn, setStartsOn] = useState(contract?.startsOn ?? '');
  const [endsOn, setEndsOn] = useState(contract?.endsOn ?? '');
  const [amount, setAmount] = useState(reaisFromCents(contract?.totalAmountCents ?? 0));
  const initialInstallmentCount = contract?.installmentCount ?? detail.installmentCount ?? 1;
  const [installments, setInstallments] = useState(String(initialInstallmentCount));
  const [installmentDrafts, setInstallmentDrafts] = useState(() =>
    installmentDraftsFromDetail(detail, initialInstallmentCount),
  );
  const [costLines, setCostLines] = useState<CostLineDraft[]>(() =>
    detail.costs.map((entry) => ({
      amount: reaisFromCents(entry.amountCents),
      label: entry.label,
    })),
  );
  const [status, setStatus] = useState(contract?.status ?? 'draft');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmFile, setConfirmFile] = useState(false);
  const installmentCount = parseInstallmentCount(installments);
  const installmentTotal = installmentDrafts.reduce((sum, draft) => sum + centsOrZero(draft.amount), 0);
  const costTotal = costLines.reduce((sum, line) => sum + centsOrZero(line.amount), 0);
  const today = saoPauloCalendarDate();
  const derivedPaid = derivedPaidCents(installmentDrafts, today);
  const contractCents = amount.trim() === '' ? null : parseReaisToCents(amount);
  const pendingLabel =
    contractCents === null ? '—' : formatCentsBRL(contractCents - derivedPaid);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const cents = parseReaisToCents(amount);
        const nextInstallmentCount = parseInstallmentCount(installments);
        const nextDrafts =
          nextInstallmentCount === null
            ? null
            : resizeInstallmentDrafts(installmentDrafts, nextInstallmentCount);
        const nextInstallments = nextDrafts === null ? null : installmentPayload(nextDrafts);
        const lineError = costLineError(costLines);

        if (!title.trim() || !status) {
          setFormError('Preencha todos os campos obrigatórios.');
          return;
        }

        if (nextInstallmentCount === null) {
          setFormError('Informe o número de parcelas entre 1 e 120.');
          return;
        }

        if (cents === null || nextInstallments === null) {
          setFormError('Informe um valor válido em reais.');
          return;
        }

        if (nextDrafts !== null && !installmentDatesValid(nextDrafts)) {
          setFormError('Informe uma data de vencimento válida.');
          return;
        }

        if (lineError) {
          setFormError(lineError);
          return;
        }

        if (startsOn && endsOn && endsOn < startsOn) {
          setFormError('A data de fim deve ser igual ou posterior à data de início.');
          return;
        }

        setFormError(null);
        setPending(true);
        void saveProjectContract(detail.projectId, {
          endsOn: endsOn || undefined,
          installments: nextInstallments,
          installmentCount: nextInstallmentCount,
          signedOn: signedOn || undefined,
          startsOn: startsOn || undefined,
          status,
          title: title.trim(),
          totalAmountCents: cents,
        })
          .then(() =>
            replaceFinanceCostLines(detail.projectId, { lines: savedCostLines(costLines) }),
          )
          .then(() => (file ? uploadContractFile(detail.projectId, file) : undefined))
          .then(() => onSaved())
          .catch(() => {
            setFormError('Não foi possível concluir a operação.');
          })
          .finally(() => {
            setPending(false);
          });
      }}
    >
      <p className="text-sm font-semibold">
        {detail.tenantName} · {detail.workspaceName} · {detail.projectName}
      </p>
      <div className="rounded-2xl border border-navy/10 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold md:col-span-2">
            Número ou título
            <input
              className={`${fieldClass} mt-2`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Data de assinatura
            <input
              className={`${fieldClass} mt-2`}
              type="date"
              value={signedOn}
              onChange={(event) => setSignedOn(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Início
            <input
              className={`${fieldClass} mt-2`}
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Fim
            <input
              className={`${fieldClass} mt-2`}
              type="date"
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="rounded-2xl border border-navy/10 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Valor do contrato
            <input
              className={`${fieldClass} mt-2`}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Número de parcelas
            <input
              className={`${fieldClass} mt-2`}
              inputMode="numeric"
              value={installments}
              onChange={(event) => {
                const value = event.target.value;
                setInstallments(value);
                const count = parseInstallmentCount(value);
                if (count !== null) {
                  setInstallmentDrafts((current) => resizeInstallmentDrafts(current, count));
                }
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Situação
            <select
              className={`${fieldClass} mt-2`}
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {installmentCount !== null ? (
          <div className="mt-4 flex flex-col gap-3">
            {installmentDrafts.map((draft, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  {`Parcela ${index + 1}`}
                  <input
                    className={`${fieldClass} mt-2`}
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(event) => {
                      const next = event.target.value;
                      setInstallmentDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, amount: next } : item,
                        ),
                      );
                    }}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Vencimento
                  <input
                    className={`${fieldClass} mt-2`}
                    type="date"
                    value={draft.dueOn}
                    onChange={(event) => {
                      const next = event.target.value;
                      setInstallmentDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, dueOn: next } : item,
                        ),
                      );
                    }}
                  />
                </label>
              </div>
            ))}
            <p className="text-sm font-semibold">
              Total das parcelas {formatCentsBRL(installmentTotal)}
            </p>
            <p className="text-sm font-semibold">Valor pago {formatCentsBRL(derivedPaid)}</p>
            <p className="text-sm font-semibold">Valor Pendente {pendingLabel}</p>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Custos</p>
          {costLines.map((line, index) => (
            <div
              key={index}
              className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end"
            >
              <label className="text-sm font-semibold">
                Nome do custo
                <input
                  className={`${fieldClass} mt-2`}
                  value={line.label}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCostLines((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: next } : item,
                      ),
                    );
                  }}
                />
              </label>
              <label className="text-sm font-semibold">
                Valor
                <input
                  className={`${fieldClass} mt-2`}
                  inputMode="decimal"
                  value={line.amount}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCostLines((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, amount: next } : item,
                      ),
                    );
                  }}
                />
              </label>
              <button
                type="button"
                className={ghostClass}
                onClick={() => {
                  setCostLines((current) => current.filter((_, itemIndex) => itemIndex !== index));
                }}
              >
                Excluir
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className={ghostClass}
              onClick={() => {
                setCostLines((current) => [...current, { amount: '', label: '' }]);
              }}
            >
              Adicionar custo
            </button>
          </div>
          <p className="text-sm font-semibold">Total dos custos {formatCentsBRL(costTotal)}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-navy/10 p-4 text-sm">
        <p className="font-semibold">Anexo do contrato</p>
        <label className={`${ghostClass} mt-2 inline-flex cursor-pointer items-center`}>
          Enviar PDF
          <input
            accept="application/pdf"
            className="sr-only"
            type="file"
            onChange={(event) => {
              const next = event.target.files?.[0];
              event.target.value = '';

              if (!next || next.type !== 'application/pdf' || next.size > 10 * 1024 * 1024) {
                setFormError('O anexo deve ser um PDF de no máximo 10 MB.');
                setFile(null);
                return;
              }

              setFormError(null);
              setFile(next);
            }}
          />
        </label>
        {file ? <p className="mt-3 break-all text-sm text-text-dark-secondary">{file.name}</p> : null}
        {contract?.hasFile && contract.originalName ? (
          <span className="mt-2 flex flex-wrap items-center gap-3">
            <span className="min-w-0 break-all text-text-dark-secondary">{contract.originalName}</span>
            <button
              type="button"
              className={ghostClass}
              onClick={() =>
                downloadContractFile(detail.projectId, contract.originalName ?? 'contract.pdf')
              }
            >
              Baixar
            </button>
            <button type="button" className={ghostClass} onClick={() => setConfirmFile(true)}>
              Excluir anexo
            </button>
          </span>
        ) : null}
      </div>
      {confirmFile ? (
        <div className="rounded-2xl border border-navy/10 bg-off-white p-4">
          <p className="font-semibold">Excluir o anexo do contrato?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className={ghostClass} onClick={() => setConfirmFile(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={pending}
              onClick={() => {
                setPending(true);
                void deleteContractFile(detail.projectId)
                  .then(() => onSaved())
                  .catch(() => {
                    setFormError('Não foi possível concluir a operação.');
                    setPending(false);
                  });
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      ) : null}
      {formError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3 border-t border-navy/10 pt-4">
        <button type="button" className={ghostClass} onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className={buttonClass} disabled={pending}>
          Salvar
        </button>
      </div>
    </form>
  );
}
