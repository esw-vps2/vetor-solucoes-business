import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PortalAccessModal } from './portal-access-modal';

describe('PortalAccessModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('asks for the emailed code before closing', async () => {
    const login = vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    const verify = vi.spyOn(api, 'verifyMfa').mockResolvedValue({
      age: 32,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-id',
      lastName: 'Silva',
      photoUrl: 'https://example.com/ana.png',
      profile: 'Usuario',
      sex: 'F',
      tenantId: 'tenant-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const onAuthenticated = vi.fn();
    const onClose = vi.fn();

    render(<PortalAccessModal open onAuthenticated={onAuthenticated} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'correct-password',
      });
    });
    expect(onAuthenticated).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '0042' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(verify).toHaveBeenCalledWith({
        challengeId: 'challenge-id',
        token: '0042',
      });
    });
    expect(onAuthenticated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the password field focused while the password is typed', () => {
    render(<PortalAccessModal open onAuthenticated={vi.fn()} onClose={vi.fn()} />);

    const password = screen.getByLabelText('Senha');
    password.focus();
    fireEvent.change(password, { target: { value: 'g' } });

    expect(password).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).not.toHaveFocus();
  });

  it('toggles login password visibility with an icon-only eye', () => {
    render(<PortalAccessModal open onAuthenticated={vi.fn()} onClose={vi.fn()} />);

    const password = screen.getByLabelText('Senha');
    const toggle = password.parentElement?.querySelector('button');

    expect(password).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle?.textContent).toBe('');

    fireEvent.click(toggle!);
    expect(password).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle!);
    expect(password).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('completes the password recovery flow without exposing account state', async () => {
    vi.spyOn(api, 'requestPasswordRecovery').mockResolvedValue({
      message: 'Se a conta existir, enviaremos instruções por e-mail.',
    });
    const verify = vi.spyOn(api, 'verifyPasswordRecovery').mockResolvedValue({ valid: true });
    const reset = vi.spyOn(api, 'resetPassword').mockResolvedValue(undefined);

    render(<PortalAccessModal open onAuthenticated={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Esqueceu sua senha?' }));
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar token' }));

    expect(await screen.findByRole('heading', { name: 'Validar token' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Token de recuperação'), {
      target: { value: 'a'.repeat(64) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(verify).toHaveBeenCalledWith({
        email: 'ana@example.com',
        token: 'a'.repeat(64),
      });
    });
    expect(await screen.findByRole('heading', { name: 'Criar nova senha' })).toBeInTheDocument();

    const newPassword = screen.getByLabelText('Nova senha');
    const repeatPassword = screen.getByLabelText('Repetir senha');
    expect(newPassword).toHaveAttribute('type', 'password');
    expect(repeatPassword).toHaveAttribute('type', 'password');
    expect(newPassword.parentElement?.querySelector('button')?.textContent).toBe('');
    expect(repeatPassword.parentElement?.querySelector('button')?.textContent).toBe('');

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByLabelText('Repetir senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'ExamplePassword12!',
        passwordConfirmation: 'ExamplePassword12!',
        token: 'a'.repeat(64),
      });
    });
    expect(
      await screen.findByText('Senha alterada. Você já pode entrar no portal.'),
    ).toBeInTheDocument();
  });
});
