'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, sendContact } from '@/lib/api/client';

interface ContactFormProps {
  onComplete: () => void;
}

export function ContactForm({ onComplete }: ContactFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await sendContact({
        customerEmail,
        customerName,
        projectDescription,
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de enviar novamente.'
          : 'Não foi possível enviar sua mensagem. Tente novamente.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div className="pt-5">
        <h2 id="contact-modal-title" className="pr-10 text-2xl font-semibold text-white">
          Mensagem enviada com sucesso.
        </h2>
        <p className="mt-4 text-sm leading-7 text-text-secondary">
          Obrigado pelo contato. A equipe VETOR retornará em breve.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="mt-7 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy-50 focus-visible:outline-none"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pt-5">
      <h2 id="contact-modal-title" className="pr-10 text-2xl font-semibold text-white">
        Fale conosco
      </h2>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        Conte um pouco sobre o desafio do seu negócio.
      </p>

      <div className="mt-7 space-y-5">
        <label className="block text-sm text-white/80">
          Nome do Cliente
          <input
            required
            maxLength={160}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20"
            name="customerName"
            autoComplete="name"
          />
        </label>

        <label className="block text-sm text-white/80">
          Email do Cliente
          <input
            required
            type="email"
            maxLength={255}
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20"
            name="customerEmail"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm text-white/80">
          Descrição do Projeto
          <textarea
            required
            maxLength={5000}
            rows={5}
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            className="mt-2 w-full resize-y rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20"
            name="projectDescription"
          />
        </label>
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-7 inline-flex min-w-40 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy-50 focus-visible:outline-none"
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
