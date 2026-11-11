'use client';

import { PortalLoginPage } from '@/components/forms/portal-login-page';
import { openDedicatedPortalHome } from '@/lib/portal-app-host';

export function DedicatedPortalLogin() {
  return <PortalLoginPage onAuthenticated={openDedicatedPortalHome} />;
}
