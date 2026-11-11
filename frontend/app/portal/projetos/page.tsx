'use client';

import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { ProjectsHome } from '@/components/projects/projects-home';

export default function PortalProjetosPage() {
  return (
    <PortalPageFrame pageTitle="Projetos">
      {(session) => <ProjectsHome onUserUpdated={session.onUserUpdated} user={session.user} />}
    </PortalPageFrame>
  );
}
