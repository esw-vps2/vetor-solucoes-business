import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PORTAL_HOME_URL, portalLoginUrl } from '@/lib/portal-app-host';
import PortalPage from './page';

const usuario: api.SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: ['painel'],
  firstName: 'Ana',
  id: 'user-id',
  lastName: 'Silva',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Usuario',
  sex: 'F',
  tenantId: 'tenant-id',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

function setLocation(url: string) {
  const parsed = new URL(url);
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      assign,
      hash: parsed.hash,
      host: parsed.host,
      hostname: parsed.hostname,
      href: parsed.href,
      origin: parsed.origin,
      pathname: parsed.pathname,
      port: parsed.port,
      protocol: parsed.protocol,
      search: parsed.search,
    },
  });
  return assign;
}

describe('dedicated portal entry', () => {
  const originalLocation = window.location;

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('redirects an unauthenticated /portal visit on the leadpage host', async () => {
    const assign = setLocation('http://localhost:3000/portal');
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    render(<PortalPage />);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(portalLoginUrl('http://localhost:3000'));
    });
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Sua sessão não está ativa' }),
    ).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated /portal visit on the principal host to /login', async () => {
    const assign = setLocation('https://vps2.com.br/portal');
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    render(<PortalPage />);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('https://vps2.com.br/login');
    });
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
  });

  it('renders the portal home for an authenticated visit on app.vps2.com.br', async () => {
    const assign = setLocation('https://app.vps2.com.br/portal');
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(<PortalPage />);

    expect(await screen.findByText('Bem-vindo ao Portal Vector.')).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    expect(window.location.host).toBe('app.vps2.com.br');
  });

  it('opens the dedicated portal home after sign-in and ignores a caller redirect', async () => {
    const assign = setLocation('https://app.vps2.com.br/portal?redirect=https://evil.example');
    vi.spyOn(api, 'getSession').mockRejectedValue(new Error('no session'));
    vi.spyOn(api, 'login').mockResolvedValue({
      ...usuario,
      mfaRequired: false,
    });
    render(<PortalPage />);

    fireEvent.change(await screen.findByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledTimes(1);
    });
    expect(assign).toHaveBeenCalledWith(PORTAL_HOME_URL);
    expect(assign.mock.calls[0]?.[0]).not.toContain('evil.example');
    expect(
      screen.queryByRole('heading', { name: 'Sua sessão não está ativa' }),
    ).not.toBeInTheDocument();
  });
});
