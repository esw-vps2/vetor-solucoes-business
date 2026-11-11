'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, createTenant, isPhotoFile } from '@/lib/api/client';

interface PortalRegisterTenantFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const duplicateCopy = 'Já existe uma tenant com estes dados. Não é possível criar outra.';
const requiredCopy = 'Preencha todos os campos obrigatórios.';
const forbiddenCopy = 'Você não tem permissão para esta ação.';
const genericCopy = 'Não foi possível concluir a operação.';
const successCopy = 'Operação realizada com sucesso.';

function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return duplicateCopy;
    }

    if (error.status === 403) {
      return forbiddenCopy;
    }

    if (error.status === 400) {
      return requiredCopy;
    }
  }

  return genericCopy;
}

export function PortalRegisterTenantForm({ onCancel, onSuccess }: PortalRegisterTenantFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<File | undefined>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !slug.trim()) {
      setStatus('error');
      setMessage(requiredCopy);
      return;
    }

    if (photo && !isPhotoFile(photo)) {
      setStatus('error');
      setMessage('A foto deve ser uma imagem e ter no máximo 5 MB.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await createTenant(
        {
          name: name.trim(),
          slug: slug.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
        },
        photo,
      );
      setStatus('success');
      setMessage(successCopy);
      setName('');
      setSlug('');
      setEmail('');
      setPhoto(undefined);
      onSuccess?.();
    } catch (error) {
      setStatus('error');
      setMessage(messageForError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-navy">
      <label className="block text-sm font-medium">
        Nome Empresa
        <input
          required
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Slug
        <input
          required
          maxLength={80}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          maxLength={255}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Foto
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPhoto(event.target.files?.[0])}
          className={`${fieldClass} file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-navy`}
        />
      </label>
      {message ? (
        <p
          role="status"
          className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-text-dark-secondary'}
        >
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {status === 'loading' ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
