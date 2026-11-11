'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError, resetPassword, verifyPasswordRecovery } from '@/lib/api/client';
import { PasswordInput } from '@/components/forms/password-input';
import {
  newPasswordInputProps,
  PASSWORD_REQUIREMENT_LABEL,
} from '@/lib/password-policy';

export function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'loading' | 'success'>(
    token ? 'checking' : 'invalid',
  );
  const [message, setMessage] = useState(token ? '' : 'Link inválido ou expirado.');

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    verifyPasswordRecovery({ token })
      .then(() => {
        if (active) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('invalid');
          setMessage('Link inválido ou expirado.');
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== passwordConfirmation) {
      setMessage('As senhas não coincidem.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await resetPassword({
        password,
        passwordConfirmation,
        token,
      });
      setStatus('success');
      setMessage('Senha alterada.');
    } catch (error) {
      setStatus('invalid');
      setMessage(
        error instanceof ApiError
          ? 'Link inválido ou expirado.'
          : 'Não foi possível alterar a senha.',
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-navy-50 p-8">
        <h1 className="text-3xl font-semibold">Altere a senha</h1>
        {status === 'checking' ? (
          <p className="mt-6 text-sm text-text-secondary">Validando o link...</p>
        ) : null}
        {status === 'invalid' || status === 'success' ? (
          <p role="status" className="mt-6 text-sm text-text-secondary">
            {message}
          </p>
        ) : null}
        {status === 'ready' || status === 'loading' ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Nova senha
              <PasswordInput
                required
                {...newPasswordInputProps}
                aria-describedby="change-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-white/15 bg-navy px-4 py-3"
              />
            </label>
            <p id="change-password-hint" className="text-xs text-text-secondary">
              {PASSWORD_REQUIREMENT_LABEL}
            </p>
            <label className="block text-sm font-medium">
              Repetir senha
              <PasswordInput
                required
                {...newPasswordInputProps}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className="rounded-2xl border border-white/15 bg-navy px-4 py-3"
              />
            </label>
            {message ? (
              <p role="status" className="text-sm text-text-secondary">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              {status === 'loading' ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        ) : null}
        <Link
          href="/"
          className="mt-8 inline-flex text-sm text-accent underline-offset-4 hover:underline"
        >
          Voltar para o site
        </Link>
      </div>
    </main>
  );
}
