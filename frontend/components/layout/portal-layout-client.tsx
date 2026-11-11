'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedPortal } from '@/components/layout/authenticated-portal';
import { PortalSessionProvider } from '@/components/layout/portal-session';
import { PortalShell } from '@/components/layout/portal-shell';
import type { SafeUser } from '@/lib/api/client';

function isPasswordResetPath(pathname: string): boolean {
  return pathname === '/portal/change-password' || pathname.startsWith('/portal/change-password/');
}

export function PortalLayoutClient({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SafeUser | null;
}) {
  const pathname = usePathname();

  if (isPasswordResetPath(pathname)) {
    return children;
  }

  return (
    <AuthenticatedPortal initialUser={initialUser}>
      {(session) => (
        <PortalSessionProvider session={session}>
          <PortalShell {...session}>{children}</PortalShell>
        </PortalSessionProvider>
      )}
    </AuthenticatedPortal>
  );
}
