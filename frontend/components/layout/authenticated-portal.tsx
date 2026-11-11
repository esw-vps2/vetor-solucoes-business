'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PortalLoginPage } from '@/components/forms/portal-login-page';
import { ApiError, getSession, logout, refreshSession } from '@/lib/api/client';
import type { SafeUser } from '@/lib/api/client';
import type { PortalSession } from '@/components/layout/portal-session';
import {
  openDedicatedPortalHome,
  PORTAL_LOGIN_PATH,
  portalLoginUrl,
  shouldRedirectLeadpagePortalEntry,
} from '@/lib/portal-app-host';

interface AuthenticatedPortalProps {
  children: (session: PortalSession) => ReactNode;
  initialUser?: SafeUser | null;
}

export function AuthenticatedPortal({ children, initialUser = null }: AuthenticatedPortalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SafeUser | null>(initialUser);
  const [loading, setLoading] = useState(initialUser === null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    getSession()
      .then((session) => {
        if (active) {
          setUser(session);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const refreshInterval = window.setInterval(
      () => {
        refreshSession().catch(() => {
          if (active) {
            setUser(null);
          }
        });
      },
      12 * 60 * 1000,
    );

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        setLoggingOut(false);
        return;
      }
    }

    router.push(PORTAL_LOGIN_PATH);
  }

  const redirectLeadpageEntry =
    !loading && !user && shouldRedirectLeadpagePortalEntry(window.location.host, pathname);

  useEffect(() => {
    if (!redirectLeadpageEntry) {
      return;
    }

    window.location.assign(portalLoginUrl(window.location.origin));
  }, [redirectLeadpageEntry]);

  if (loading || redirectLeadpageEntry) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy px-6 text-text-secondary">
        <p role="status">Validando sua sessão...</p>
      </main>
    );
  }

  if (!user) {
    return <PortalLoginPage onAuthenticated={openDedicatedPortalHome} />;
  }

  return (
    <>
      {children({
        loggingOut,
        onLogout: handleLogout,
        onUserUpdated: setUser,
        user,
      })}
    </>
  );
}
