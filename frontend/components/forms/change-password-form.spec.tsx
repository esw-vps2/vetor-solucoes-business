import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { ChangePasswordForm } from './change-password-form';

const { search } = vi.hoisted(() => ({
  search: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => search,
}));

describe('ChangePasswordForm', () => {
  afterEach(() => {
    cleanup();
    search.delete('token');
    vi.restoreAllMocks();
  });

  it('shows Nova senha and Repetir senha for a valid token', async () => {
    search.set('token', 'a'.repeat(64));
    vi.spyOn(api, 'verifyPasswordRecovery').mockResolvedValue({ valid: true });
    render(<ChangePasswordForm />);

    expect(await screen.findByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Repetir senha')).toBeInTheDocument();
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Portal Vector' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Bem-vindo ao Portal Vector.' }),
    ).not.toBeInTheDocument();
  });

  it('does not submit a password change for a missing token', async () => {
    const reset = vi.spyOn(api, 'resetPassword');
    render(<ChangePasswordForm />);

    expect(await screen.findByText('Link inválido ou expirado.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    expect(reset).not.toHaveBeenCalled();
  });

  it('submits the token without collecting email', async () => {
    search.set('token', 'a'.repeat(64));
    vi.spyOn(api, 'verifyPasswordRecovery').mockResolvedValue({ valid: true });
    const reset = vi.spyOn(api, 'resetPassword').mockResolvedValue(undefined);
    render(<ChangePasswordForm />);

    fireEvent.change(await screen.findByLabelText('Nova senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByLabelText('Repetir senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith({
        password: 'ExamplePassword12!',
        passwordConfirmation: 'ExamplePassword12!',
        token: 'a'.repeat(64),
      });
    });
  });
});
