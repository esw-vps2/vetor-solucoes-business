'use client';

import type { ReactNode } from 'react';
import { AuthenticatedPortal } from '@/components/layout/authenticated-portal';
import { PortalShell } from '@/components/layout/portal-shell';
import { usePortalSession, type PortalSession } from '@/components/layout/portal-session';

export function PortalPageFrame({
  children,
  flushMain,
  pageTitle,
}: {
  children?: ReactNode | ((session: PortalSession) => ReactNode);
  flushMain?: boolean;
  pageTitle?: string;
}) {
  const session = usePortalSession();
  const content =
    session && typeof children === 'function'
      ? children(session)
      : typeof children === 'function'
        ? null
        : (children ?? null);

  if (session) {
    return content;
  }

  return (
    <AuthenticatedPortal>
      {(next) => (
        <PortalShell {...next} flushMain={flushMain} pageTitle={pageTitle}>
          {typeof children === 'function' ? children(next) : children}
        </PortalShell>
      )}
    </AuthenticatedPortal>
  );
}
