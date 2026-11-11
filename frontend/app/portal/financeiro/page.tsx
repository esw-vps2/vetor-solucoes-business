'use client';

import { Suspense } from 'react';
import { FinanceHome } from '@/components/finance/finance-home';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';

export default function PortalFinanceiroPage() {
  return (
    <PortalPageFrame pageTitle="Contratos">
      {(session) => (
        <Suspense fallback={<p>Carregando...</p>}>
          <FinanceHome user={session.user} />
        </Suspense>
      )}
    </PortalPageFrame>
  );
}
