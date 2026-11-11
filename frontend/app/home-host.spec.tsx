import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PORTAL_HOME_URL } from '@/lib/portal-app-host';
import { DedicatedPortalLogin } from '@/components/forms/dedicated-portal-login';
import Home from './page';

const headerStore = vi.hoisted(() => ({ host: 'localhost:3000' }));

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name === 'host' ? headerStore.host : null),
  }),
}));

const safeUser: api.SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: [],
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

describe('dedicated portal host routing', () => {
  const originalLocation = window.location;

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    headerStore.host = 'localhost:3000';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders the leadpage for a host other than the dedicated portal host', async () => {
    headerStore.host = 'localhost:3000';
    render(await Home());

    expect(screen.getByRole('heading', { level: 1, name: /antes do código/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the leadpage on the principal host', async () => {
    headerStore.host = 'vps2.com.br';
    render(await Home());

    expect(screen.getByRole('heading', { level: 1, name: /antes do código/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the portal login page on app.vps2.com.br without leadpage or portal chrome', async () => {
    headerStore.host = 'app.vps2.com.br';
    render(await Home());

    expect(screen.getByRole('heading', { level: 1, name: 'Acesse sua conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esqueceu sua senha?' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: /antes do código/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
  });

  it('opens the dedicated portal home after sign-in and ignores a caller redirect', async () => {
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
    vi.spyOn(api, 'login').mockResolvedValue({
      ...safeUser,
      mfaRequired: false,
    });
    render(<DedicatedPortalLogin />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
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
  });
});
