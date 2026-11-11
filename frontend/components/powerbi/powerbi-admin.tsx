'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ApiError,
  createPowerBiDistribution,
  importPowerBiReport,
  listPowerBiCatalog,
  listPowerBiDistributions,
  listPowerBiWorkspaces,
  listPowerBiWorkspaceReportPages,
  listPowerBiWorkspaceReports,
  listTenants,
  updatePowerBiDistribution,
  updatePowerBiDistributionStatus,
  updatePowerBiReport,
  updatePowerBiReportStatus,
} from '@/lib/api/client';
import type {
  PowerBiCatalogReport,
  PowerBiDistribution,
  PowerBiPage,
  PowerBiRemoteReport,
  PowerBiWorkspace,
  TenantListItem,
} from '@/lib/api/client';
import { Modal } from '@/components/ui/modal';

type AdminTab = 'catalogo' | 'distribuicao';
type Feedback = { tone: 'success' | 'error'; text: string } | null;

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

export function PowerBiAdmin() {
  const [tab, setTab] = useState<AdminTab>('catalogo');
  const [reports, setReports] = useState<PowerBiCatalogReport[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [editReport, setEditReport] = useState<PowerBiCatalogReport | null>(null);
  const [filterReportId, setFilterReportId] = useState('');
  const [distributions, setDistributions] = useState<PowerBiDistribution[]>([]);
  const [editDistribution, setEditDistribution] = useState<PowerBiDistribution | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: 'report'; report: PowerBiCatalogReport }
    | { kind: 'distribution'; distribution: PowerBiDistribution }
    | null
  >(null);

  async function refreshCatalog() {
    setReports(await listPowerBiCatalog());
  }

  async function refreshDistributions(reportId: string) {
    setDistributions(await listPowerBiDistributions(reportId));
  }

  useEffect(() => {
    let active = true;

    listPowerBiCatalog()
      .then((items) => {
        if (active) {
          setReports(items);
        }
      })
      .catch(() => {
        if (active) {
          setFeedback({ text: 'Erro ao atualizar relatório', tone: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!filterReportId) {
      return;
    }

    let active = true;

    listPowerBiDistributions(filterReportId)
      .then((items) => {
        if (active) {
          setDistributions(items);
        }
      })
      .catch(() => {
        if (active) {
          setFeedback({ text: 'Erro ao atualizar distribuição', tone: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, [filterReportId]);

  async function toggleReport(report: PowerBiCatalogReport, ativo: boolean) {
    if (!ativo) {
      setConfirm({ kind: 'report', report });
      return;
    }

    try {
      await updatePowerBiReportStatus(report.id, true);
      await refreshCatalog();
      setFeedback({ text: 'Status atualizado', tone: 'success' });
    } catch {
      setFeedback({ text: 'Erro ao atualizar status', tone: 'error' });
    }
  }

  async function toggleDistribution(distribution: PowerBiDistribution, ativo: boolean) {
    if (!ativo) {
      setConfirm({ kind: 'distribution', distribution });
      return;
    }

    try {
      await updatePowerBiDistributionStatus(distribution.id, true);
      await refreshDistributions(distribution.relatorioId);
      setFeedback({ text: 'Status da distribuição atualizado', tone: 'success' });
    } catch {
      setFeedback({ text: 'Erro ao atualizar distribuição', tone: 'error' });
    }
  }

  async function confirmDeactivate() {
    if (!confirm) {
      return;
    }

    try {
      if (confirm.kind === 'report') {
        await updatePowerBiReportStatus(confirm.report.id, false);
        await refreshCatalog();
        setFeedback({ text: 'Status atualizado', tone: 'success' });
      } else {
        await updatePowerBiDistributionStatus(confirm.distribution.id, false);
        await refreshDistributions(confirm.distribution.relatorioId);
        setFeedback({ text: 'Status da distribuição atualizado', tone: 'success' });
      }
    } catch {
      setFeedback({
        text:
          confirm.kind === 'report' ? 'Erro ao atualizar status' : 'Erro ao atualizar distribuição',
        tone: 'error',
      });
    } finally {
      setConfirm(null);
    }
  }

  const activeReports = reports.filter((report) => report.ativo);

  return (
    <div>
      <div className="flex gap-2">
        <TabButton active={tab === 'catalogo'} onClick={() => setTab('catalogo')}>
          Catálogo
        </TabButton>
        <TabButton active={tab === 'distribuicao'} onClick={() => setTab('distribuicao')}>
          Distribuição
        </TabButton>
      </div>
      {feedback ? (
        <p
          role="status"
          className={`mt-6 text-sm ${
            feedback.tone === 'success' ? 'text-navy dark:text-white' : 'text-red-400'
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
      {tab === 'catalogo' ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-navy dark:text-white">
              Relatórios Importados
            </h2>
            <button
              type="button"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              onClick={() => setImportOpen(true)}
            >
              Importar Relatório
            </button>
          </div>
          {reports.length === 0 ? (
            <div className="mt-10 max-w-xl">
              <p className="text-lg font-semibold text-navy dark:text-white">
                Nenhum relatório importado
              </p>
              <p className="mt-3 text-sm text-text-dark-secondary dark:text-text-secondary">
                Clique em &quot;Importar Relatório&quot; para começar
              </p>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-navy/10 bg-white p-6 dark:border-white/10 dark:bg-navy-100"
                >
                  <div>
                    <p className="text-lg font-semibold text-navy dark:text-white">{report.nome}</p>
                    {report.descricao ? (
                      <p className="mt-1 text-sm text-text-dark-secondary dark:text-text-secondary">
                        {report.descricao}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-navy dark:text-white">
                      {report.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy dark:border-white/15 dark:text-white"
                      onClick={() => setEditReport(report)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={report.ativo}
                      aria-label={`${report.ativo ? 'Desativar' : 'Ativar'} ${report.nome}`}
                      className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy dark:border-white/15 dark:text-white"
                      onClick={() => void toggleReport(report, !report.ativo)}
                    >
                      {report.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-navy dark:text-white">Distribuições</h2>
            <button
              type="button"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              onClick={() => setDistributeOpen(true)}
            >
              Distribuir Relatório
            </button>
          </div>
          <label className="mt-8 block max-w-md text-sm font-semibold text-navy dark:text-white">
            Filtrar por relatório
            <select
              className="mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy dark:border-white/15 dark:bg-navy dark:text-white"
              value={filterReportId}
              onChange={(event) => setFilterReportId(event.target.value)}
            >
              <option value="">Selecione um relatório</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.nome}
                </option>
              ))}
            </select>
          </label>
          {filterReportId ? (
            distributions.length === 0 ? (
              <p className="mt-8 text-navy dark:text-white">
                Nenhuma distribuição para este relatório
              </p>
            ) : (
              <ul className="mt-8 grid gap-4">
                {distributions.map((distribution) => (
                  <li
                    key={distribution.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-navy/10 bg-white p-6 dark:border-white/10 dark:bg-navy-100"
                  >
                    <div>
                      <p className="text-lg font-semibold text-navy dark:text-white">
                        {distribution.tenantName} ({distribution.tenantSlug})
                      </p>
                      <p className="mt-1 text-sm text-text-dark-secondary dark:text-text-secondary">
                        {distribution.nomeExibicao || 'Nome padrão'} · Ordem {distribution.ordem}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-navy dark:text-white">
                        {distribution.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy dark:border-white/15 dark:text-white"
                        onClick={() => setEditDistribution(distribution)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={distribution.ativo}
                        aria-label={`${distribution.ativo ? 'Desativar' : 'Ativar'} distribuição`}
                        className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy dark:border-white/15 dark:text-white"
                        onClick={() => void toggleDistribution(distribution, !distribution.ativo)}
                      >
                        {distribution.ativo ? 'Ativa' : 'Inativa'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </section>
      )}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={async () => {
          setImportOpen(false);
          await refreshCatalog();
          setFeedback({ text: 'Relatório importado com sucesso', tone: 'success' });
        }}
        onFeedback={setFeedback}
      />
      <DistributeModal
        open={distributeOpen}
        reports={activeReports}
        onClose={() => setDistributeOpen(false)}
        onDistributed={async (reportId) => {
          setDistributeOpen(false);
          setFilterReportId(reportId);
          await refreshDistributions(reportId);
          setFeedback({ text: 'Relatório distribuído com sucesso', tone: 'success' });
        }}
        onFeedback={setFeedback}
      />
      <EditReportModal
        report={editReport}
        onClose={() => setEditReport(null)}
        onSaved={async () => {
          setEditReport(null);
          await refreshCatalog();
          setFeedback({ text: 'Relatório atualizado', tone: 'success' });
        }}
        onFeedback={setFeedback}
      />
      <EditDistributionModal
        distribution={editDistribution}
        onClose={() => setEditDistribution(null)}
        onSaved={async (reportId) => {
          setEditDistribution(null);
          await refreshDistributions(reportId);
          setFeedback({ text: 'Distribuição atualizada', tone: 'success' });
        }}
        onFeedback={setFeedback}
      />
      <Modal
        labelledBy="confirmar-desativacao"
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        tone="light"
      >
        <h2 id="confirmar-desativacao" className="pr-10 text-2xl font-semibold text-navy">
          Confirmar desativação
        </h2>
        <p className="mt-6 text-sm leading-7 text-text-dark-secondary">
          {confirm?.kind === 'distribution'
            ? 'Desativar esta distribuição removerá o acesso do cliente a este relatório.'
            : 'Desativar este relatório o tornará indisponível para todos os clientes.'}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
            onClick={() => setConfirm(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy"
            onClick={() => void confirmDeactivate()}
          >
            Desativar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
        active
          ? 'bg-accent text-navy'
          : 'border border-navy/15 text-navy dark:border-white/15 dark:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ImportModal({
  onClose,
  onFeedback,
  onImported,
  open,
}: {
  onClose: () => void;
  onFeedback: (feedback: Feedback) => void;
  onImported: () => Promise<void>;
  open: boolean;
}) {
  const [workspaces, setWorkspaces] = useState<PowerBiWorkspace[]>([]);
  const [reportsState, setReportsState] = useState<{
    items: PowerBiRemoteReport[];
    workspaceId: string;
  }>({ items: [], workspaceId: '' });
  const [pagesState, setPagesState] = useState<{
    items: PowerBiPage[];
    reportId: string;
    workspaceId: string;
  }>({ items: [], reportId: '', workspaceId: '' });
  const [workspaceId, setWorkspaceId] = useState('');
  const [reportId, setReportId] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const reports = reportsState.workspaceId === workspaceId ? reportsState.items : [];
  const pages =
    pagesState.workspaceId === workspaceId && pagesState.reportId === reportId
      ? pagesState.items
      : [];
  const pagesLoading =
    Boolean(workspaceId && reportId) &&
    pages.length === 0 &&
    !(pagesState.workspaceId === workspaceId && pagesState.reportId === reportId);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    listPowerBiWorkspaces()
      .then((items) => {
        if (active) {
          setWorkspaces(items);
        }
      })
      .catch(() => {
        if (active) {
          onFeedback({ text: 'Erro ao importar relatório', tone: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, [onFeedback, open]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const requestedWorkspaceId = workspaceId;
    let active = true;

    listPowerBiWorkspaceReports(requestedWorkspaceId)
      .then((items) => {
        if (active) {
          setReportsState({ items, workspaceId: requestedWorkspaceId });
        }
      })
      .catch(() => {
        if (active) {
          onFeedback({ text: 'Erro ao importar relatório', tone: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, [onFeedback, workspaceId]);

  useEffect(() => {
    if (!workspaceId || !reportId) {
      return;
    }

    const requestedWorkspaceId = workspaceId;
    const requestedReportId = reportId;
    let active = true;

    listPowerBiWorkspaceReportPages(requestedWorkspaceId, requestedReportId)
      .then((items) => {
        if (active) {
          setPagesState({
            items,
            reportId: requestedReportId,
            workspaceId: requestedWorkspaceId,
          });
        }
      })
      .catch(() => {
        if (active) {
          setPagesState({
            items: [],
            reportId: requestedReportId,
            workspaceId: requestedWorkspaceId,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [reportId, workspaceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await importPowerBiReport({
        descricao: descricao.trim() || undefined,
        nome: nome.trim(),
        reportId,
        workspaceId,
      });
      await onImported();
    } catch (error) {
      onFeedback({
        text:
          error instanceof ApiError && error.status === 409
            ? 'Este relatório já está cadastrado'
            : 'Erro ao importar relatório',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal labelledBy="importar-relatorio" open={open} onClose={onClose} tone="light">
      <h2 id="importar-relatorio" className="pr-10 text-2xl font-semibold text-navy">
        Importar Relatório
      </h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-semibold text-navy">
          Workspace
          <select
            required
            className={fieldClass}
            value={workspaceId}
            onChange={(event) => {
              setWorkspaceId(event.target.value);
              setReportId('');
              setNome('');
              setDescricao('');
            }}
          >
            <option value="">Selecione um workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Relatório
          <select
            required
            className={fieldClass}
            value={reportId}
            onChange={(event) => {
              const nextId = event.target.value;
              setReportId(nextId);
              const selected = reports.find((item) => item.id === nextId);
              setNome(selected?.name ?? '');
            }}
          >
            <option value="">Selecione um relatório</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.name}
              </option>
            ))}
          </select>
        </label>
        {reportId ? (
          <div>
            <p className="text-sm text-text-dark-secondary">
              {pagesLoading ? 'Carregando páginas...' : `${pages.length} página(s) encontrada(s)`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pages.map((page) => (
                <span
                  key={page.name}
                  className="rounded-full border border-navy/15 px-3 py-1 text-xs text-navy"
                >
                  {page.displayName}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <label className="text-sm font-semibold text-navy">
          Nome do relatório
          <input
            required
            className={fieldClass}
            placeholder="Nome para exibição"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Descrição (opcional)
          <textarea
            className={fieldClass}
            placeholder="Descrição do relatório"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          Importar Relatório
        </button>
      </form>
    </Modal>
  );
}

function DistributeModal({
  onClose,
  onDistributed,
  onFeedback,
  open,
  reports,
}: {
  onClose: () => void;
  onDistributed: (reportId: string) => Promise<void>;
  onFeedback: (feedback: Feedback) => void;
  open: boolean;
  reports: PowerBiCatalogReport[];
}) {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [pagesState, setPagesState] = useState<{
    items: PowerBiPage[];
    reportId: string;
  }>({ items: [], reportId: '' });
  const [reportId, setReportId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [icone, setIcone] = useState('');
  const [ordem, setOrdem] = useState('0');
  const [paginaPadrao, setPaginaPadrao] = useState('');
  const pages = pagesState.reportId === reportId ? pagesState.items : [];

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    listTenants()
      .then((items) => {
        if (active) {
          setTenants(items);
        }
      })
      .catch(() => {
        if (active) {
          onFeedback({ text: 'Erro ao distribuir relatório', tone: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, [onFeedback, open]);

  useEffect(() => {
    const selected = reports.find((report) => report.id === reportId);
    if (!selected) {
      return;
    }

    const requestedReportId = reportId;
    let active = true;

    listPowerBiWorkspaceReportPages(selected.workspaceId, selected.reportId)
      .then((items) => {
        if (active) {
          setPagesState({ items, reportId: requestedReportId });
        }
      })
      .catch(() => {
        if (active) {
          setPagesState({ items: [], reportId: requestedReportId });
        }
      });

    return () => {
      active = false;
    };
  }, [reportId, reports]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createPowerBiDistribution(reportId, {
        icone: icone.trim() || undefined,
        nomeExibicao: nomeExibicao.trim() || undefined,
        ordem: Number(ordem),
        paginaPadrao: paginaPadrao || undefined,
        tenantId,
      });
      await onDistributed(reportId);
    } catch (error) {
      onFeedback({
        text:
          error instanceof ApiError && error.status === 409
            ? 'Este relatório já está distribuído para este tenant'
            : 'Erro ao distribuir relatório',
        tone: 'error',
      });
    }
  }

  return (
    <Modal labelledBy="distribuir-relatorio" open={open} onClose={onClose} tone="light">
      <h2 id="distribuir-relatorio" className="pr-10 text-2xl font-semibold text-navy">
        Distribuir Relatório
      </h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-semibold text-navy">
          Relatório
          <select
            required
            className={fieldClass}
            value={reportId}
            onChange={(event) => setReportId(event.target.value)}
          >
            <option value="">Selecione um relatório</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Tenant
          <select
            required
            className={fieldClass}
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
          >
            <option value="">Selecione um tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Nome de exibição (opcional)
          <input
            className={fieldClass}
            placeholder="Nome personalizado para o cliente"
            value={nomeExibicao}
            onChange={(event) => setNomeExibicao(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Ícone (opcional)
          <input
            className={fieldClass}
            value={icone}
            onChange={(event) => setIcone(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Ordem de exibição
          <input
            className={fieldClass}
            type="number"
            value={ordem}
            onChange={(event) => setOrdem(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Página padrão (opcional)
          <select
            className={fieldClass}
            value={paginaPadrao}
            onChange={(event) => setPaginaPadrao(event.target.value)}
          >
            <option value="">Nenhuma (primeira página)</option>
            {pages.map((page) => (
              <option key={page.name} value={page.name}>
                {page.displayName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy"
        >
          Distribuir Relatório
        </button>
      </form>
    </Modal>
  );
}

function EditReportModal({
  onClose,
  onFeedback,
  onSaved,
  report,
}: {
  onClose: () => void;
  onFeedback: (feedback: Feedback) => void;
  onSaved: () => Promise<void>;
  report: PowerBiCatalogReport | null;
}) {
  return (
    <Modal labelledBy="editar-relatorio" open={Boolean(report)} onClose={onClose} tone="light">
      {report ? (
        <EditReportForm key={report.id} onFeedback={onFeedback} onSaved={onSaved} report={report} />
      ) : null}
    </Modal>
  );
}

function EditReportForm({
  onFeedback,
  onSaved,
  report,
}: {
  onFeedback: (feedback: Feedback) => void;
  onSaved: () => Promise<void>;
  report: PowerBiCatalogReport;
}) {
  const [nome, setNome] = useState(report.nome);
  const [descricao, setDescricao] = useState(report.descricao ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updatePowerBiReport(report.id, { descricao, nome });
      await onSaved();
    } catch {
      onFeedback({ text: 'Erro ao atualizar relatório', tone: 'error' });
    }
  }

  return (
    <>
      <h2 id="editar-relatorio" className="pr-10 text-2xl font-semibold text-navy">
        Editar Relatório
      </h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-semibold text-navy">
          Nome
          <input
            required
            className={fieldClass}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Descrição
          <textarea
            className={fieldClass}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={!nome.trim()}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          Salvar
        </button>
      </form>
    </>
  );
}

function EditDistributionModal({
  distribution,
  onClose,
  onFeedback,
  onSaved,
}: {
  distribution: PowerBiDistribution | null;
  onClose: () => void;
  onFeedback: (feedback: Feedback) => void;
  onSaved: (reportId: string) => Promise<void>;
}) {
  return (
    <Modal labelledBy="editar-distribuicao" open={Boolean(distribution)} onClose={onClose} tone="light">
      {distribution ? (
        <EditDistributionForm
          key={distribution.id}
          distribution={distribution}
          onFeedback={onFeedback}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function EditDistributionForm({
  distribution,
  onFeedback,
  onSaved,
}: {
  distribution: PowerBiDistribution;
  onFeedback: (feedback: Feedback) => void;
  onSaved: (reportId: string) => Promise<void>;
}) {
  const [nomeExibicao, setNomeExibicao] = useState(distribution.nomeExibicao ?? '');
  const [icone, setIcone] = useState(distribution.icone ?? '');
  const [ordem, setOrdem] = useState(String(distribution.ordem));
  const [paginaPadrao, setPaginaPadrao] = useState(distribution.paginaPadrao ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updatePowerBiDistribution(distribution.id, {
        icone,
        nomeExibicao,
        ordem: Number(ordem),
        paginaPadrao,
      });
      await onSaved(distribution.relatorioId);
    } catch {
      onFeedback({ text: 'Erro ao atualizar distribuição', tone: 'error' });
    }
  }

  return (
    <>
      <h2 id="editar-distribuicao" className="pr-10 text-2xl font-semibold text-navy">
        Editar Distribuição
      </h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-semibold text-navy">
          Nome de exibição
          <input
            className={fieldClass}
            value={nomeExibicao}
            onChange={(event) => setNomeExibicao(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Ícone
          <input
            className={fieldClass}
            value={icone}
            onChange={(event) => setIcone(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Ordem
          <input
            className={fieldClass}
            type="number"
            value={ordem}
            onChange={(event) => setOrdem(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-navy">
          Página padrão
          <input
            className={fieldClass}
            value={paginaPadrao}
            onChange={(event) => setPaginaPadrao(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy"
        >
          Salvar
        </button>
      </form>
    </>
  );
}
