'use client';

import { useParams } from 'next/navigation';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { ProjectBoardView } from '@/components/projects/project-board';

export default function PortalProjetoBoardPage() {
  const params = useParams<{ id: string }>();

  return (
    <PortalPageFrame pageTitle="Projetos">
      {(session) => <ProjectBoardView projectId={params.id} user={session.user} />}
    </PortalPageFrame>
  );
}
