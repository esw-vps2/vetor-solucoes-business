'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { listMyPowerBiReports } from '@/lib/api/client';
import type { PowerBiMyReport } from '@/lib/api/client';

const PowerBiEmbedViewer = dynamic(
  () => import('./powerbi-embed-viewer').then((module) => module.PowerBiEmbedViewer),
  { ssr: false },
);

function ReportCardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 15.5V11M12 15.5V8M16 15.5v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RelatoriosView() {
  const [reports, setReports] = useState<PowerBiMyReport[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listMyPowerBiReports()
      .then((items) => {
        if (active) {
          setReports(items);
          setError(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setReports(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (selectedId) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PowerBiEmbedViewer distributionId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-navy dark:text-white">
        Erro ao carregar relatórios
      </p>
    );
  }

  if (!reports) {
    return (
      <p role="status" className="text-navy dark:text-white">
        Carregando relatórios...
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold text-navy dark:text-white">Nenhum relatório disponível</h2>
        <p className="mt-4 text-sm leading-7 text-text-dark-secondary dark:text-text-secondary">
          Entre em contato com o administrador para ter relatórios configurados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => {
        const title = report.nomeExibicao || report.relatorio.nome;
        return (
          <button
            key={report.id}
            type="button"
            onClick={() => setSelectedId(report.id)}
            className="flex flex-col items-center gap-4 rounded-[28px] border border-navy/10 bg-white p-8 text-center transition hover:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/10 dark:bg-navy-100"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-navy">
              <ReportCardIcon />
            </span>
            <span className="text-lg font-semibold text-navy dark:text-white">{title}</span>
            {report.relatorio.descricao ? (
              <span className="text-sm text-text-dark-secondary dark:text-text-secondary">
                {report.relatorio.descricao}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
