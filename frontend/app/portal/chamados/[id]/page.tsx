'use client';

import { useParams } from 'next/navigation';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { TicketDetailView } from '@/components/tickets/ticket-detail';

export default function PortalChamadoPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <PortalPageFrame pageTitle="Suporte">
      {(session) => <TicketDetailView ticketId={ticketId} user={session.user} />}
    </PortalPageFrame>
  );
}
