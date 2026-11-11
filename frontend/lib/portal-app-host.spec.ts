import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PORTAL_HOME_URL,
  PORTAL_LOGIN_URL,
  isPortalAppHost,
  isPortalEntryPath,
  openDedicatedPortalHome,
  portalLoginUrl,
  shouldRedirectLeadpagePortalEntry,
} from './portal-app-host';

describe('portal app host', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('recognizes only the dedicated portal hostname', () => {
    expect(isPortalAppHost('app.vps2.com.br')).toBe(true);
    expect(isPortalAppHost('APP.VPS2.COM.BR:443')).toBe(true);
    expect(isPortalAppHost('localhost:3000')).toBe(false);
    expect(isPortalAppHost('portal.vps2.com.br')).toBe(false);
    expect(isPortalAppHost('www.app.vps2.com.br')).toBe(false);
  });

  it('keeps the password-change form outside the portal entry redirect', () => {
    expect(isPortalEntryPath('/portal')).toBe(true);
    expect(isPortalEntryPath('/portal/projetos/proj-1')).toBe(true);
    expect(isPortalEntryPath('/portal/change-password')).toBe(false);
    expect(isPortalEntryPath('/')).toBe(false);
  });

  it('redirects portal entry paths only on the leadpage host', () => {
    expect(shouldRedirectLeadpagePortalEntry('localhost:3000', '/portal')).toBe(true);
    expect(shouldRedirectLeadpagePortalEntry('www.vetor.tech', '/portal/relatorios')).toBe(true);
    expect(shouldRedirectLeadpagePortalEntry('app.vps2.com.br', '/portal')).toBe(false);
    expect(shouldRedirectLeadpagePortalEntry('localhost:3000', '/portal/change-password')).toBe(
      false,
    );
  });

  it('opens the fixed portal home and ignores a caller redirect', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign,
        hash: '',
        host: 'app.vps2.com.br',
        hostname: 'app.vps2.com.br',
        href: 'https://app.vps2.com.br/?redirect=https://evil.example',
        origin: 'https://app.vps2.com.br',
        pathname: '/',
        port: '',
        protocol: 'https:',
        search: '?redirect=https://evil.example',
      },
    });

    openDedicatedPortalHome();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(PORTAL_HOME_URL);
    expect(assign.mock.calls[0]?.[0]).not.toContain('evil.example');
    expect(PORTAL_LOGIN_URL).toBe('https://vps2.com.br/login');
    expect(portalLoginUrl('https://vps2.com.br')).toBe(PORTAL_LOGIN_URL);
    expect(portalLoginUrl('http://localhost:3000')).toBe('http://localhost:3000/login');
  });

  it('opens the portal on the principal host after sign-in and ignores a caller redirect', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign,
        hash: '',
        host: 'vps2.com.br',
        hostname: 'vps2.com.br',
        href: 'https://vps2.com.br/login?redirect=https://evil.example',
        origin: 'https://vps2.com.br',
        pathname: '/login',
        port: '',
        protocol: 'https:',
        search: '?redirect=https://evil.example',
      },
    });

    openDedicatedPortalHome();

    expect(assign).toHaveBeenCalledWith('https://vps2.com.br/portal');
    expect(assign.mock.calls[0]?.[0]).not.toContain('evil.example');
  });

  it('keeps a local dedicated host on its own origin after sign-in', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign,
        hash: '',
        host: 'app.vps2.com.br:3000',
        hostname: 'app.vps2.com.br',
        href: 'http://app.vps2.com.br:3000/?redirect=https://evil.example',
        origin: 'http://app.vps2.com.br:3000',
        pathname: '/',
        port: '3000',
        protocol: 'http:',
        search: '?redirect=https://evil.example',
      },
    });

    openDedicatedPortalHome();

    expect(assign).toHaveBeenCalledWith('http://app.vps2.com.br:3000/portal');
  });
});
