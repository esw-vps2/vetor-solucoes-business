'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { SafeUser } from '@/lib/api/client';

export interface PortalSession {
  loggingOut: boolean;
  onLogout: () => void;
  onUserUpdated: (user: SafeUser) => void;
  user: SafeUser;
}

const PortalSessionContext = createContext<PortalSession | null>(null);

export function PortalSessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: PortalSession;
}) {
  return <PortalSessionContext.Provider value={session}>{children}</PortalSessionContext.Provider>;
}

export function usePortalSession(): PortalSession | null {
  return useContext(PortalSessionContext);
}
