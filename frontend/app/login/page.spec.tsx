import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import LoginPage from './page';

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

describe('principal DNS login route', () => {
  const originalLocation = window.location;

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders the credential form without leadpage or portal chrome', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Acesse sua conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esqueceu sua senha?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' }).closest('form')).toHaveAttribute(
      'action',
      '/login/submit',
    );
    expect(
      screen.queryByRole('heading', { level: 1, name: /antes do código/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
  });

  it('opens the same-origin portal after sign-in and ignores a caller redirect', async () => {
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
    vi.spyOn(api, 'login').mockResolvedValue({
      ...safeUser,
      mfaRequired: false,
    });
    render(<LoginPage />);
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
    expect(assign).toHaveBeenCalledWith('https://vps2.com.br/portal');
    expect(assign.mock.calls[0]?.[0]).not.toContain('evil.example');
  });
});
