'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { models, type Report } from 'powerbi-client';
import { ApiError, createPowerBiEmbedToken } from '@/lib/api/client';
import type { PowerBiEmbedToken } from '@/lib/api/client';
import {
  applyPowerBiPageFill,
  embedRenewDelayMs,
  POWER_BI_DEFAULT_PAGE_SIZE,
  reportIdFromEmbedUrl,
  resolvePowerBiPageSize,
} from '@/lib/powerbi-embed';

const PowerBIEmbed = dynamic(
  () => import('powerbi-client-react').then((module) => module.PowerBIEmbed),
  { ssr: false },
);

interface PowerBiEmbedViewerProps {
  distributionId: string;
  onBack: () => void;
}

export function PowerBiEmbedViewer({ distributionId, onBack }: PowerBiEmbedViewerProps) {
  const [payload, setPayload] = useState<PowerBiEmbedToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'denied' | 'generic' | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const reportRef = useRef<Report | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pageSizeRef = useRef(POWER_BI_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function loadToken(silent: boolean) {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const next = await createPowerBiEmbedToken(distributionId);
        if (!active) {
          return;
        }

        setPayload(next);
        setError(null);
        timer = window.setTimeout(() => {
          void loadToken(true);
        }, embedRenewDelayMs(next.expiration));
      } catch (caught) {
        if (!active) {
          return;
        }

        setPayload(null);
        setError(caught instanceof ApiError && caught.status === 403 ? 'denied' : 'generic');
      } finally {
        if (active && !silent) {
          setLoading(false);
        }
      }
    }

    void loadToken(false);

    return () => {
      active = false;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [distributionId, reloadNonce]);

  useEffect(() => {
    const node = frameRef.current;

    function fillFrame() {
      if (!node) {
        return;
      }

      if (document.fullscreenElement) {
        const iframe = node.querySelector('iframe');
        if (iframe instanceof HTMLIFrameElement) {
          iframe.style.height = '100%';
          iframe.style.transform = 'none';
          iframe.style.width = '100%';
        }
        return;
      }

      applyPowerBiPageFill(node, pageSizeRef.current.width, pageSizeRef.current.height);
    }

    async function syncPageFill() {
      const report = reportRef.current;
      if (report) {
        try {
          const pages = await report.getPages();
          const page = pages.find((item) => item.isActive) ?? pages[0];
          pageSizeRef.current = resolvePowerBiPageSize(page?.defaultSize);
        } catch {
          pageSizeRef.current = POWER_BI_DEFAULT_PAGE_SIZE;
        }
      }

      fillFrame();
    }

    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      fillFrame();
    });
    observer.observe(node);
    document.addEventListener('fullscreenchange', fillFrame);
    void syncPageFill();

    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', fillFrame);
    };
  }, [payload?.id]);

  if (loading && !payload) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <p role="status">Carregando relatório...</p>
      </div>
    );
  }

  if (error === 'denied') {
    return (
      <div>
        <BackButton onBack={onBack} />
        <p role="alert" className="mt-8 text-navy dark:text-white">
          Acesso negado a este relatório
        </p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div>
        <BackButton onBack={onBack} />
        <p role="alert" className="mt-8 text-navy dark:text-white">
          Erro ao carregar relatório. Tente novamente.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          onClick={() => {
            setPayload(null);
            setError(null);
            setLoading(true);
            setReloadNonce((value) => value + 1);
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton onBack={onBack} />
          <h2 className="truncate text-lg font-semibold text-navy dark:text-white">{payload.nome}</h2>
        </div>
        <button
          type="button"
          className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
          onClick={() => {
            const iframe = frameRef.current?.querySelector('iframe');
            if (iframe instanceof HTMLIFrameElement) {
              iframe.style.height = '100%';
              iframe.style.transform = 'none';
              iframe.style.width = '100%';
            }
            void reportRef.current?.fullscreen();
          }}
        >
          Tela cheia
        </button>
      </div>
      <div
        ref={frameRef}
        className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-navy/10 bg-white dark:border-white/10 dark:bg-navy-100"
      >
        <PowerBIEmbed
          cssClassName="powerbi-embed-frame"
          embedConfig={{
            accessToken: payload.embedToken,
            embedUrl: payload.embedUrl,
            id: reportIdFromEmbedUrl(payload.embedUrl),
            pageName: payload.paginaPadrao ?? undefined,
            settings: {
              background: models.BackgroundType.Default,
              bars: {
                statusBar: { visible: false },
              },
              customLayout: {
                displayOption: models.DisplayOption.FitToWidth,
                reportAlignment: models.ReportAlignment.Center,
              },
              layoutType: models.LayoutType.Custom,
              panes: {
                filters: { visible: false },
                pageNavigation: { visible: true },
              },
            },
            tokenType: models.TokenType.Embed,
            type: 'report',
          }}
          getEmbeddedComponent={(embedded) => {
            const report = embedded as Report;
            reportRef.current = report;
            const fill = () => {
              const node = frameRef.current;
              if (!node || document.fullscreenElement) {
                return;
              }

              void report.getPages().then((pages) => {
                const page = pages.find((item) => item.isActive) ?? pages[0];
                pageSizeRef.current = resolvePowerBiPageSize(page?.defaultSize);
                applyPowerBiPageFill(node, pageSizeRef.current.width, pageSizeRef.current.height);
              });
            };
            report.on('loaded', fill);
            report.on('rendered', fill);
            report.on('pageChanged', fill);
          }}
        />
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-white/15 dark:text-white"
      onClick={onBack}
    >
      Voltar
    </button>
  );
}
