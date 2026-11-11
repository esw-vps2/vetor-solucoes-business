import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { PortalLayoutClient } from '@/components/layout/portal-layout-client';
import type { SafeUser } from '@/lib/api/client';

function apiOrigin(): string {
  const internal = process.env.API_INTERNAL_URL?.trim();

  if (internal) {
    return internal.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3001';
}

async function loadPortalUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiOrigin()}/api/v1/auth/session`, {
      cache: 'no-store',
      headers: { cookie: `access_token=${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SafeUser;
  } catch {
    return null;
  }
}

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const initialUser = await loadPortalUser();

  return <PortalLayoutClient initialUser={initialUser}>{children}</PortalLayoutClient>;
}
