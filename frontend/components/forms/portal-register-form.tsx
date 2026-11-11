'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ApiError,
  createUser,
  isPhotoFile,
  listTenants,
  type SafeUser,
  type TenantListItem,
} from '@/lib/api/client';
import { PasswordInput } from '@/components/forms/password-input';
import { newPasswordInputProps, PASSWORD_REQUIREMENT_LABEL } from '@/lib/password-policy';

interface PortalRegisterFormProps {
  actor?: SafeUser;
  onSuccess?: () => void;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

export function PortalRegisterForm({ actor, onSuccess }: PortalRegisterFormProps) {
  const isGlobal = actor?.profile === 'Administrador';
  const lockTenantId = actor?.profile === 'AdministradorTenant' ? actor.tenantId : '';
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [tenantId, setTenantId] = useState(lockTenantId);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cargo, setCargo] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | 'O' | ''>('');
  const [photo, setPhoto] = useState<File | undefined>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<'Usuario' | 'Administrador' | 'AdministradorTenant'>(
    'Usuario',
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;

    listTenants()
      .then((items) => {
        if (active) {
          setTenants(items);
        }
      })
      .catch(() => {
        if (active) {
          setStatus('error');
          setMessage('Não foi possível carregar os tenants.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId || !sex) {
      setStatus('error');
      setMessage('Preencha todos os campos obrigatórios.');
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
      await createUser(
        {
          age: Number(age),
          email,
          firstName,
          lastName,
          password,
          sex,
          tenantId,
          enabledActions: [],
          ...(cargo.trim() ? { cargo: cargo.trim() } : {}),
          ...(isGlobal && profile !== 'Usuario' ? { profile } : {}),
        },
        photo,
      );
      setStatus('success');
      setMessage('Usuário cadastrado.');
      setFirstName('');
      setLastName('');
      setCargo('');
      setAge('');
      setSex('');
      setPhoto(undefined);
      setEmail('');
      setPassword('');
      setProfile('Usuario');
      setTenantId(lockTenantId);
      formRef.current?.reset();
      onSuccess?.();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de tentar novamente.'
          : 'Não foi possível cadastrar o usuário.',
      );
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 text-navy">
      <label className="block text-sm font-medium">
        Nome
        <input
          required
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Sobrenome
        <input
          required
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Cargo
        <input
          maxLength={160}
          value={cargo}
          onChange={(event) => setCargo(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        idade
        <input
          required
          type="number"
          min={0}
          max={150}
          value={age}
          onChange={(event) => setAge(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        sexo
        <select
          required
          value={sex}
          onChange={(event) => setSex(event.target.value as 'M' | 'F' | 'O' | '')}
          className={fieldClass}
        >
          <option value="">Selecione</option>
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="O">O</option>
        </select>
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
      <label className="block text-sm font-medium">
        E-mail
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Senha
        <PasswordInput
          required
          {...newPasswordInputProps}
          aria-describedby="register-password-hint"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        />
      </label>
      <p id="register-password-hint" className="text-xs text-text-dark-secondary">
        {PASSWORD_REQUIREMENT_LABEL}
      </p>
      <label className="block text-sm font-medium">
        Tenant
        <select
          required
          value={tenantId}
          disabled={Boolean(lockTenantId)}
          onChange={(event) => setTenantId(event.target.value)}
          className={fieldClass}
        >
          <option value="">Selecione</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.slug})
            </option>
          ))}
        </select>
      </label>
      {isGlobal ? (
        <label className="block text-sm font-medium">
          Perfil
          <select
            value={profile}
            onChange={(event) =>
              setProfile(event.target.value as 'Usuario' | 'Administrador' | 'AdministradorTenant')
            }
            className={fieldClass}
          >
            <option value="Usuario">Usuário</option>
            <option value="Administrador">Administrador Global</option>
            <option value="AdministradorTenant">Administrador Tenant</option>
          </select>
        </label>
      ) : null}
      {message ? (
        <p
          role="status"
          className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-text-dark-secondary'}
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {status === 'loading' ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
}
