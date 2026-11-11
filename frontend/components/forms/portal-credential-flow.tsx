'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ApiError,
  cancelMfa,
  login,
  requestPasswordRecovery,
  resendMfa,
  resetPassword,
  verifyMfa,
  verifyPasswordRecovery,
  type SafeUser,
} from '@/lib/api/client';
import { PasswordInput } from '@/components/forms/password-input';
import { newPasswordInputProps, PASSWORD_REQUIREMENT_LABEL } from '@/lib/password-policy';

type PortalMode = 'login' | 'mfa' | 'blocked' | 'request' | 'verify' | 'reset';

interface PortalCredentialFlowProps {
  appearance?: 'dark' | 'light';
  headingId: string;
  headingLevel: 'h1' | 'h2';
  onAuthenticated: (user: SafeUser) => void;
}

const BLOCKED_MESSAGE =
  'Sua conta foi bloqueada, favor entrar em contato com Administrado do seu projeto.';

const MFA_MESSAGE =
  'Este é o processo de autenticação múltipla, para fortalecer o acesso ao portal. Copie o código enviado ao seu e-mail e cole no campo do portal.';

const fieldClass =
  'mt-2 w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20';

const submitClass =
  'inline-flex min-w-32 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy-50 focus-visible:outline-none';

const cancelClass =
  'inline-flex min-w-32 items-center justify-center rounded-full bg-transparent px-6 py-3 text-sm font-semibold text-white/80 transition hover:text-white disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy-50 focus-visible:outline-none';

const lightEmailPlaceholder = 'seu@email.com';
const lightPasswordPlaceholder = '••••••••';
const lightIconFieldShellClass = 'relative mt-2 block';

type SubmitAction = 'login' | 'verify' | 'resend' | 'cancel';

function remainingSeconds(expiresAt: string, now: number): number {
  const delta = new Date(expiresAt).getTime() - now;

  if (delta <= 0) {
    return 0;
  }

  return Math.ceil(delta / 1000);
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function rateLimitMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status === 429
    ? 'Aguarde alguns instantes antes de tentar novamente.'
    : fallback;
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status !== 503) {
    return rateLimitMessage(error, 'E-mail ou senha inválidos.');
  }

  return 'Não foi possível concluir a operação.';
}

export function PortalCredentialFlow({
  appearance = 'dark',
  headingId,
  headingLevel,
  onAuthenticated,
}: PortalCredentialFlowProps) {
  const Heading = headingLevel;
  const postedError = useSearchParams().get('erro');
  const [mode, setMode] = useState<PortalMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<SubmitAction | null>(null);
  const submittingRef = useRef(false);

  function beginSubmit(next: SubmitAction): boolean {
    if (submittingRef.current) {
      return false;
    }

    submittingRef.current = true;
    setAction(next);
    setStatus('loading');
    setMessage('');
    return true;
  }

  function endSubmit() {
    submittingRef.current = false;
    setAction(null);
  }

  useEffect(() => {
    if (mode !== 'mfa') {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, expiresAt]);

  function resetFeedback() {
    setStatus('idle');
    setMessage('');
  }

  function applyChallenge(next: { challengeId: string; expiresAt: string }) {
    setChallengeId(next.challengeId);
    setExpiresAt(next.expiresAt);
    setNow(Date.now());
    setCode('');
    setMode('mfa');
    resetFeedback();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!beginSubmit('login')) {
      return;
    }

    try {
      const result = await login({ email, password });
      if (!result.mfaRequired) {
        onAuthenticated(result);
        return;
      }
      applyChallenge(result);
    } catch (error) {
      setStatus('error');
      setMessage(loginErrorMessage(error));
    } finally {
      endSubmit();
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (remainingSeconds(expiresAt, Date.now()) === 0 || !beginSubmit('verify')) {
      return;
    }

    try {
      const user = await verifyMfa({ challengeId, token: code.trim() });
      onAuthenticated(user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setMode('blocked');
        setStatus('error');
        setMessage(BLOCKED_MESSAGE);
        return;
      }

      setStatus('error');
      setMessage(
        error instanceof ApiError && error.status === 401
          ? 'Token inválido ou expirado.'
          : rateLimitMessage(error, 'Não foi possível concluir a operação.'),
      );
    } finally {
      endSubmit();
    }
  }

  async function handleResend() {
    if (!beginSubmit('resend')) {
      return;
    }

    try {
      const challenge = await resendMfa({ challengeId });
      applyChallenge(challenge);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiError && error.status === 401
          ? 'Token inválido ou expirado.'
          : rateLimitMessage(error, 'Não foi possível concluir a operação.'),
      );
    } finally {
      endSubmit();
    }
  }

  async function handleCancel() {
    if (!beginSubmit('cancel')) {
      return;
    }

    try {
      await cancelMfa({ challengeId });
      setCode('');
      setPassword('');
      setChallengeId('');
      setExpiresAt('');
      setMode('login');
      resetFeedback();
    } catch (error) {
      setStatus('error');
      setMessage(rateLimitMessage(error, 'Não foi possível concluir a operação.'));
    } finally {
      endSubmit();
    }
  }

  async function handleRecoveryRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await requestPasswordRecovery({ email });
      setMode('verify');
      setStatus('success');
      setMessage('Se a conta existir, enviaremos instruções por e-mail.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de solicitar novamente.'
          : 'Não foi possível processar a solicitação.',
      );
    }
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await verifyPasswordRecovery({ email, token });
      setMode('reset');
      setStatus('idle');
    } catch {
      setStatus('error');
      setMessage('Token inválido ou expirado.');
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await resetPassword({
        email,
        password,
        passwordConfirmation,
        token,
      });
      setMode('login');
      setPassword('');
      setPasswordConfirmation('');
      setToken('');
      setStatus('success');
      setMessage('Senha alterada. Você já pode entrar no portal.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de tentar novamente.'
          : 'Não foi possível alterar a senha.',
      );
    }
  }

  const light = appearance === 'light';
  const titleClass = light
    ? 'text-center text-[1.7rem] font-semibold tracking-tight text-navy'
    : headingLevel === 'h2'
      ? 'pr-10 text-2xl font-semibold text-white'
      : 'text-2xl font-semibold text-white';
  const supportClass = light
    ? 'mt-2 text-center text-sm text-text-dark-secondary'
    : 'mt-3 text-sm leading-6 text-text-secondary';
  const labelClass = light
    ? 'block text-xs font-semibold tracking-[0.14em] text-navy-400 uppercase'
    : 'block text-sm text-white/80';
  const controlClass = light
    ? 'w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-navy outline-none transition placeholder:text-text-dark-secondary focus:border-accent focus:ring-2 focus:ring-accent/25'
    : fieldClass;
  const buttonClass = light
    ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-navy transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none'
    : submitClass;
  const quietButtonClass = light
    ? 'inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-accent disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
    : cancelClass;
  const secondsLeft = expiresAt ? remainingSeconds(expiresAt, now) : 0;
  const postedMessage =
    status === 'idle'
      ? postedError === '429'
        ? 'Aguarde alguns instantes antes de tentar novamente.'
        : postedError
          ? 'E-mail ou senha inválidos.'
          : ''
      : '';
  const feedbackText = message || postedMessage;
  const feedback = feedbackText ? (
    <p
      role={status === 'error' || postedMessage ? 'alert' : 'status'}
      className={`mt-4 text-sm ${status === 'error' || postedMessage ? (light ? 'text-red-600' : 'text-red-300') : 'text-accent'}`}
    >
      {feedbackText}
    </p>
  ) : null;

  if (mode === 'blocked') {
    return (
      <div className="pt-5">
        <Heading id={headingId} className={titleClass}>
          Portal Vector
        </Heading>
        <p role="alert" className={`mt-4 text-sm ${light ? 'text-red-600' : 'text-red-300'}`}>
          {BLOCKED_MESSAGE}
        </p>
      </div>
    );
  }

  if (mode === 'mfa') {
    return (
      <form method="post" onSubmit={handleVerify} className="pt-5">
        <Heading id={headingId} className={titleClass}>
          Portal Vector
        </Heading>
        <p className={supportClass}>{MFA_MESSAGE}</p>
        <label className={`mt-7 ${labelClass}`}>
          Código
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={32}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className={light ? `mt-2 ${controlClass}` : fieldClass}
            name="code"
          />
        </label>
        <p
          role="timer"
          aria-label="Tempo restante"
          className={`mt-4 text-sm tabular-nums ${light ? 'text-text-dark-secondary' : 'text-text-secondary'}`}
        >
          {formatRemaining(secondsLeft)}
        </p>
        {feedback}
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {secondsLeft > 0 ? (
            <button type="submit" disabled={status === 'loading'} className={buttonClass}>
              {action === 'verify' ? 'Entrando...' : 'Entrar'}
            </button>
          ) : (
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => {
                void handleResend();
              }}
              className={buttonClass}
            >
              Pedir novo código
            </button>
          )}
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={() => {
              void handleCancel();
            }}
            className={quietButtonClass}
          >
            {action === 'cancel' ? 'Cancelando...' : 'Cancelar'}
          </button>
        </div>
      </form>
    );
  }

  if (mode === 'request') {
    return (
      <form method="post" onSubmit={handleRecoveryRequest} className="pt-5">
        <Heading id={headingId} className={titleClass}>
          Recuperar acesso
        </Heading>
        <p className={supportClass}>
          Informe seu e-mail. Se a conta existir, você receberá um token.
        </p>
        <div className="mt-7 space-y-5">
          <label className={labelClass}>
            E-mail
            {light ? (
              <span className={lightIconFieldShellClass}>
                <MailIcon />
                <input
                  required
                  type="email"
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${controlClass} pl-11`}
                  name="recoveryEmail"
                  autoComplete="email"
                  placeholder={lightEmailPlaceholder}
                />
              </span>
            ) : (
              <input
                required
                type="email"
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
                name="recoveryEmail"
                autoComplete="email"
              />
            )}
          </label>
        </div>
        {feedback}
        <div className="mt-7 flex flex-wrap gap-4">
          <button type="submit" disabled={status === 'loading'} className={buttonClass}>
            {status === 'loading' ? 'Enviando...' : 'Enviar token'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetFeedback();
            }}
            className={quietButtonClass}
          >
            Voltar
          </button>
        </div>
      </form>
    );
  }

  if (mode === 'verify') {
    return (
      <form method="post" onSubmit={handleVerification} className="pt-5">
        <Heading id={headingId} className={titleClass}>
          Validar token
        </Heading>
        <p className={supportClass}>Digite o token recebido no seu e-mail.</p>
        <label className={`mt-7 ${labelClass}`}>
          Token de recuperação
          <input
            required
            minLength={64}
            maxLength={64}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className={`${light ? `mt-2 ${controlClass}` : fieldClass} font-mono text-sm`}
            name="token"
            autoComplete="one-time-code"
          />
        </label>
        {feedback}
        <div className="mt-7 flex flex-wrap gap-4">
          <button type="submit" disabled={status === 'loading'} className={buttonClass}>
            {status === 'loading' ? 'Validando...' : 'Continuar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('request');
              resetFeedback();
            }}
            className={quietButtonClass}
          >
            Voltar
          </button>
        </div>
      </form>
    );
  }

  if (mode === 'reset') {
    return (
      <form method="post" onSubmit={handleReset} className="pt-5">
        <Heading id={headingId} className={titleClass}>
          Criar nova senha
        </Heading>
        <p id="reset-password-hint" className={supportClass}>
          {PASSWORD_REQUIREMENT_LABEL}
        </p>
        <div className="mt-7 space-y-5">
          <label className={labelClass}>
            Nova senha
            <PasswordInput
              required
              {...newPasswordInputProps}
              aria-describedby="reset-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={
                light
                  ? controlClass
                  : 'rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
              }
              name="newPassword"
              autoComplete="new-password"
            />
          </label>
          <label className={labelClass}>
            Repetir senha
            <PasswordInput
              required
              {...newPasswordInputProps}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className={
                light
                  ? controlClass
                  : 'rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'
              }
              name="passwordConfirmation"
              autoComplete="new-password"
            />
          </label>
        </div>
        {feedback}
        <button type="submit" disabled={status === 'loading'} className={`mt-7 ${buttonClass}`}>
          {status === 'loading' ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    );
  }

  return (
    <form method="post" action="/login/submit" onSubmit={handleLogin} className={light ? '' : 'pt-5'}>
      <Heading id={headingId} className={titleClass}>
        {light ? 'Acesse sua conta' : 'Portal Vector'}
      </Heading>
      <p className={supportClass}>
        {light
          ? 'Entre com suas credenciais para continuar'
          : 'Entre com suas credenciais para acessar o portal.'}
      </p>
      <div className="mt-7 space-y-5">
        <label className={labelClass}>
          {light ? 'E-mail corporativo' : 'E-mail'}
          {light ? (
            <span className={lightIconFieldShellClass}>
              <MailIcon />
              <input
                required
                type="email"
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${controlClass} pl-11`}
                name="email"
                autoComplete="email"
                placeholder={lightEmailPlaceholder}
              />
            </span>
          ) : (
            <input
              required
              type="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              name="email"
              autoComplete="email"
            />
          )}
        </label>
        <div>
          <span className={labelClass}>Senha</span>
          {light ? (
            <span className={lightIconFieldShellClass}>
              <LockIcon />
              <PasswordInput
                required
                aria-label="Senha"
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                containerClassName=""
                className={`${controlClass} pl-11`}
                name="password"
                autoComplete="current-password"
                placeholder={lightPasswordPlaceholder}
              />
            </span>
          ) : (
            <PasswordInput
              required
              aria-label="Senha"
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              containerClassName="mt-2"
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="password"
              autoComplete="current-password"
            />
          )}
        </div>
      </div>
      {feedback}
      {light ? (
        <div className="mt-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode('request');
                resetFeedback();
              }}
              className="text-sm font-medium text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Esqueceu sua senha?
            </button>
          </div>
          <button type="submit" disabled={status === 'loading'} className={`mt-4 ${buttonClass}`}>
            {status === 'loading' ? 'Entrando...' : 'Entrar'}
            <span aria-hidden="true">→</span>
          </button>
          <p className="mt-8 text-center text-sm text-text-dark-secondary">
            Ainda não tem acesso?{' '}
            <span className="font-medium text-accent">Fale com o administrador.</span>
          </p>
        </div>
      ) : (
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={status === 'loading'} className={buttonClass}>
            {status === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('request');
              resetFeedback();
            }}
            className="text-sm text-white/65 underline decoration-white/25 underline-offset-4 transition hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Esqueci minha senha
          </button>
        </div>
      )}
    </form>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-3 z-10 h-5 w-5 -translate-y-1/2 text-text-secondary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-3 z-10 h-5 w-5 -translate-y-1/2 text-text-secondary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
