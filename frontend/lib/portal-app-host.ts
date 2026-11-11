export const PORTAL_APP_HOSTNAME = 'app.vps2.com.br';
export const PRINCIPAL_HOSTNAME = 'vps2.com.br';
export const PORTAL_LOGIN_PATH = '/login';
export const PORTAL_LOGIN_URL = `https://${PRINCIPAL_HOSTNAME}${PORTAL_LOGIN_PATH}`;
export const PORTAL_HOME_URL = 'https://app.vps2.com.br/portal';

export function hostnameFromHostHeader(host: string): string {
  const trimmed = host.trim().toLowerCase();

  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end === -1 ? trimmed : trimmed.slice(0, end + 1);
  }

  return trimmed.replace(/:\d+$/, '');
}

export function isPortalAppHost(host: string): boolean {
  return hostnameFromHostHeader(host) === PORTAL_APP_HOSTNAME;
}

export function isPortalEntryPath(pathname: string): boolean {
  if (pathname === '/portal/change-password' || pathname.startsWith('/portal/change-password/')) {
    return false;
  }

  return pathname === '/portal' || pathname.startsWith('/portal/');
}

export function shouldRedirectLeadpagePortalEntry(host: string, pathname: string): boolean {
  return !isPortalAppHost(host) && isPortalEntryPath(pathname);
}

export function portalLoginUrl(origin: string): string {
  return new URL(PORTAL_LOGIN_PATH, origin).href;
}

export function openDedicatedPortalHome(): void {
  window.location.assign(new URL('/portal', window.location.origin).href);
}
