import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { PortalLoginPage } from './portal-login-page';

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

describe('PortalLoginPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('keeps the login form when a session cookie is already present', () => {
    document.cookie = 'access_token=existing-session';
    const login = vi.spyOn(api, 'login');
    render(<PortalLoginPage onAuthenticated={() => undefined} />);

    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the login form without the leadpage or a dialog', () => {
    render(<PortalLoginPage onAuthenticated={() => undefined} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Acesse sua conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByText(/Tecnologia que impulsiona resultados/)).toBeInTheDocument();
    expect(screen.getByText('Gestão integrada')).toBeInTheDocument();
    expect(screen.getByText(/Ainda não tem acesso\?/)).toBeInTheDocument();
    expect(screen.getByText('Fale com o administrador.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' }).closest('form')).toHaveAttribute(
      'method',
      'post',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('shows a generic password error and does not open the MFA step', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError('Invalid credentials.', 401));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
  });

  it('does not describe a blocked request as an invalid password', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new TypeError('Failed to fetch'));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
    expect(screen.queryByText('E-mail ou senha inválidos.')).not.toBeInTheDocument();
  });

  it('shows the rate-limit message on the login form', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError('Too many requests.', 429));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde alguns instantes antes de tentar novamente.',
    );
  });

  it('stays on the password form when login cannot send the code', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError('Service unavailable.', 503));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
  });

  it('shows the MFA instructions and countdown without the token', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 90_000).toISOString(),
      mfaRequired: true,
    });
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText(
        'Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código enviado ao seu e-mail e cole no campo do portal.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Código')).toHaveAttribute('autocomplete', 'one-time-code');
    expect(screen.getByRole('timer', { name: 'Tempo restante' })).toHaveTextContent(
      /^\d{2}:\d{2}$/,
    );
    expect(screen.queryByRole('button', { name: 'Pedir novo código' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('signs in without the code field when MFA is disabled', async () => {
    const onAuthenticated = vi.fn();
    vi.spyOn(api, 'login').mockResolvedValue({
      ...safeUser,
      mfaRequired: false,
    });
    render(<PortalLoginPage onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ id: safeUser.id, mfaRequired: false }),
      );
    });
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
  });

  it('requests a new code only when the countdown reaches 00:00', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      mfaRequired: true,
    });
    const resend = vi.spyOn(api, 'resendMfa').mockResolvedValue({
      challengeId: 'next-challenge',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      mfaRequired: true,
    });
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('timer', { name: 'Tempo restante' })).toHaveTextContent('00:00');
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument();
    const verify = vi.spyOn(api, 'verifyMfa');
    const form = screen.getByLabelText('Código').closest('form');
    expect(form).not.toBeNull();
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '0042' } });
    fireEvent.submit(form as HTMLFormElement);
    expect(verify).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pedir novo código' }));

    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith({ challengeId: 'challenge-id' });
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pedir novo código' })).not.toBeInTheDocument();
  });

  it('calls onAuthenticated after the code is accepted and stays on the current origin', async () => {
    const onAuthenticated = vi.fn();
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign,
        host: 'localhost:3000',
      },
    });
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.spyOn(api, 'verifyMfa').mockResolvedValue(safeUser);
    render(<PortalLoginPage onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.change(await screen.findByLabelText('Código'), { target: { value: ' 0042\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(api.verifyMfa).toHaveBeenCalledWith({
        challengeId: 'challenge-id',
        token: '0042',
      });
      expect(onAuthenticated).toHaveBeenCalledWith(safeUser);
    });
    expect(assign).not.toHaveBeenCalled();
    expect(window.location.host).toBe('localhost:3000');
  });

  it('shows an invalid-code message and keeps the MFA step', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.spyOn(api, 'verifyMfa').mockRejectedValue(
      new ApiError('Invalid or expired recovery token.', 401),
    );
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.change(await screen.findByLabelText('Código'), { target: { value: '1111' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido ou expirado.');
    expect(screen.getByLabelText('Código')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pedir novo código' })).not.toBeInTheDocument();
  });

  it('sends the code once when Entrar is submitted twice', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    let finish = () => {};
    const verify = vi.spyOn(api, 'verifyMfa').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(safeUser);
        }),
    );
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.change(await screen.findByLabelText('Código'), { target: { value: '1111' } });
    fireEvent.submit(screen.getByLabelText('Código').closest('form')!);
    fireEvent.submit(screen.getByLabelText('Código').closest('form')!);

    expect(verify).toHaveBeenCalledTimes(1);
    finish();
  });

  it('shows the blocked account sentence and hides a new-code request', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.spyOn(api, 'verifyMfa').mockRejectedValue(new ApiError('Account blocked.', 403));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.change(await screen.findByLabelText('Código'), { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sua conta foi bloqueada, favor entrar em contato com Administrado do seu projeto.',
    );
    expect(screen.queryByRole('button', { name: 'Pedir novo código' })).not.toBeInTheDocument();
  });

  it('runs password recovery on the login page', async () => {
    vi.spyOn(api, 'requestPasswordRecovery').mockResolvedValue({
      message: 'Se a conta existir, enviaremos instruções por e-mail.',
    });
    const verify = vi.spyOn(api, 'verifyPasswordRecovery').mockResolvedValue({ valid: true });
    const reset = vi.spyOn(api, 'resetPassword').mockResolvedValue(undefined);
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
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
    fireEvent.change(await screen.findByLabelText('Nova senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByLabelText('Repetir senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    await waitFor(() => {
      expect(verify).toHaveBeenCalled();
      expect(reset).toHaveBeenCalled();
    });
    expect(
      await screen.findByText('Senha alterada. Você já pode entrar no portal.'),
    ).toBeInTheDocument();
  });

  it('does not show Cancelar on the password form', () => {
    render(<PortalLoginPage onAuthenticated={() => undefined} />);

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('shows Cancelar beside Entrar while the countdown is running', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 90_000).toISOString(),
      mfaRequired: true,
    });
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toContain('text-navy');
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).not.toContain(
      'text-white/80',
    );
  });

  it('shows Cancelar beside Pedir novo código at 00:00', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      mfaRequired: true,
    });
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('timer', { name: 'Tempo restante' })).toHaveTextContent('00:00');
    expect(screen.getByRole('button', { name: 'Pedir novo código' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('returns to the password form after cancel and does not set a session cookie', async () => {
    const onAuthenticated = vi.fn();
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    const cancel = vi.spyOn(api, 'cancelMfa').mockResolvedValue(undefined);
    render(<PortalLoginPage onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByLabelText('E-mail corporativo')).toHaveValue('ana@example.com');
    expect(screen.getByLabelText('Senha')).toHaveValue('');
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    expect(cancel).toHaveBeenCalledWith({ challengeId: 'challenge-id' });
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('access_token=');
    expect(document.cookie).not.toContain('refresh_token=');
  });

  it('sends cancel once when Cancelar is clicked twice', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    let finish = () => {};
    const cancel = vi.spyOn(api, 'cancelMfa').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(undefined);
        }),
    );
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    const cancelButton = await screen.findByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cancelando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    finish();
    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
  });

  it('stays on the MFA step when cancel fails', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.spyOn(api, 'cancelMfa').mockRejectedValue(new ApiError('Service unavailable.', 500));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
    expect(screen.getByLabelText('Código')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('shows the rate-limit message when cancel is throttled', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      challengeId: 'challenge-id',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.spyOn(api, 'cancelMfa').mockRejectedValue(new ApiError('Too many requests.', 429));
    render(<PortalLoginPage onAuthenticated={() => undefined} />);
    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde alguns instantes antes de tentar novamente.',
    );
    expect(screen.getByLabelText('Código')).toBeInTheDocument();
  });
});
