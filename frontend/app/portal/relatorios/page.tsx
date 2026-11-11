'use client';

import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { RelatoriosView } from '@/components/powerbi/relatorios-view';
import { canViewReports } from '@/lib/portal-actions';

export default function PortalRelatoriosPage() {
  return (
    <PortalPageFrame pageTitle="Relatórios">
      {(session) =>
        canViewReports(session.user) ? (
          <RelatoriosView />
        ) : (
          <p className="text-sm text-navy dark:text-white">Você não tem acesso a relatórios.</p>
        )
      }
    </PortalPageFrame>
  );
}
