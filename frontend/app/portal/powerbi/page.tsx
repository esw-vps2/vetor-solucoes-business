'use client';

import { PowerBiAdmin } from '@/components/powerbi/powerbi-admin';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';

export default function PortalPowerBiPage() {
  return (
    <PortalPageFrame pageTitle="Power BI">
      {(session) => (session.user.profile === 'Administrador' ? <PowerBiAdmin /> : null)}
    </PortalPageFrame>
  );
}
