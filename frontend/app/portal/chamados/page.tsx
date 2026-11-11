'use client';

import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { TicketsHome } from '@/components/tickets/tickets-home';

export default function PortalChamadosPage() {
  return (
    <PortalPageFrame pageTitle="Suporte">
      {(session) => <TicketsHome user={session.user} />}
    </PortalPageFrame>
  );
}
