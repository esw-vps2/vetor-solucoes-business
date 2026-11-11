'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Image from 'next/image';
import {
  deleteUser,
  getSession,
  getUser,
  isPhotoFile,
  listTenants,
  listUsers,
  publicPhotoSrc,
  reactivateUser,
  sendPasswordResetLink,
  updateUser,
  type SafeUser,
  type TenantListItem,
  type UserListItem,
} from '@/lib/api/client';

interface PortalEditUserFormProps {
  actor: SafeUser;
  onSaved: (session: SafeUser | null) => void;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

export function PortalEditUserForm({ actor, onSaved }: PortalEditUserFormProps) {
  const canPickUsers = actor.profile === 'Administrador' || actor.profile === 'AdministradorTenant';
  const isGlobal = actor.profile === 'Administrador';
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [tenantId, setTenantId] = useState(actor.tenantId);
  const [homeTenantId, setHomeTenantId] = useState(actor.tenantId);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(canPickUsers ? '' : actor.id);
  const [editing, setEditing] = useState(!canPickUsers);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [firstName, setFirstName] = useState(actor.firstName);
  const [lastName, setLastName] = useState(actor.lastName);
  const [cargo, setCargo] = useState(actor.cargo ?? '');
  const [age, setAge] = useState(String(actor.age));
  const [sex, setSex] = useState<'M' | 'F' | 'O' | ''>(
    actor.sex === 'M' || actor.sex === 'F' || actor.sex === 'O' ? actor.sex : '',
  );
  const [email, setEmail] = useState(actor.email);
  const [photoUrl, setPhotoUrl] = useState(actor.photoUrl);
  const [photo, setPhoto] = useState<File | undefined>();
  const [accountStatus, setAccountStatus] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const reactivatingRef = useRef(false);
  const actorTenantFresh = useRef(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!canPickUsers) {
      return;
    }

    let active = true;

    listUsers()
      .then((items) => {
        if (active) {
          setUsers(items);
        }
      })
      .catch(() => {
        if (active) {
          setStatus('error');
          setMessage('Não foi possível carregar os usuários.');
        }
      });

    return () => {
      active = false;
    };
  }, [canPickUsers]);

  useEffect(() => {
    if (!isGlobal) {
      return;
    }

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
  }, [isGlobal]);

  useEffect(() => {
    if (!isGlobal || editing) {
      return;
    }

    let active = true;

    getUser(actor.id)
      .then((user) => {
        if (!active || !actorTenantFresh.current) {
          return;
        }

        setHomeTenantId(user.tenantId);
        setTenantId(user.tenantId);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [actor.id, actor.tenantId, editing, isGlobal]);

  const visibleUsers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (trimmed.length < 3) {
      return users;
    }

    return users.filter((user) => user.email.toLowerCase().includes(trimmed));
  }, [query, users]);

  async function loadUser(id: string) {
    actorTenantFresh.current = false;
    setStatus('loading');
    setMessage('');

    try {
      const user = await getUser(id);
      setSelectedId(user.id);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setCargo(user.cargo ?? '');
      setAge(String(user.age));
      setSex(user.sex === 'M' || user.sex === 'F' || user.sex === 'O' ? user.sex : '');
      setEmail(user.email);
      setTenantId(user.tenantId);
      setHomeTenantId(user.tenantId);
      setPhotoUrl(user.photoUrl);
      setPhoto(undefined);
      setAccountStatus(user.status);
      setStatus('idle');
      setEditing(true);
    } catch {
      setStatus('error');
      setMessage('Não foi possível carregar o usuário.');
    }
  }

  async function handleReactivate() {
    if (reactivatingRef.current) {
      return;
    }

    reactivatingRef.current = true;
    setStatus('loading');
    setMessage('');

    try {
      await reactivateUser(selectedId);
      setAccountStatus('active');
      setStatus('idle');
    } catch {
      setStatus('error');
      setMessage('Não foi possível atualizar o usuário.');
    } finally {
      reactivatingRef.current = false;
    }
  }

  async function handleResetLogin() {
    if (!selectedId) {
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await sendPasswordResetLink(selectedId);
      setStatus('success');
      setMessage('Link de redefinição enviado.');
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar o link de redefinição.');
    }
  }

  async function handleDelete() {
    if (!selectedId) {
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await deleteUser(selectedId);
      setUsers((current) => current.filter((user) => user.id !== selectedId));
      setSelectedId('');
      setEditing(false);
      setConfirmDelete(false);
      setStatus('success');
      setMessage('Usuário excluído.');
    } catch {
      setStatus('error');
      setMessage('Não foi possível excluir o usuário.');
      setConfirmDelete(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sex || (isGlobal && !tenantId)) {
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
      await updateUser(
        selectedId,
        {
          age: Number(age),
          email,
          firstName,
          lastName,
          sex,
          ...(cargo.trim() ? { cargo: cargo.trim() } : {}),
          ...(isGlobal && tenantId !== homeTenantId ? { tenantId } : {}),
        },
        photo,
      );
      setStatus('success');
      setMessage('Usuário atualizado.');
      let session: SafeUser | null = null;

      if (selectedId === actor.id) {
        session = await getSession();
      }

      onSaved(session);
    } catch {
      setStatus('error');
      setMessage('Não foi possível atualizar o usuário.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-navy">
      {canPickUsers ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Buscar e-mail
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={fieldClass}
            />
          </label>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-navy/10 p-2">
            {visibleUsers.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(user.id);
                    setEditing(false);
                    setConfirmDelete(false);
                    setMessage('');
                    setStatus('idle');
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    selectedId === user.id ? 'bg-accent/15 text-navy' : 'text-navy'
                  }`}
                >
                  {user.firstName} {user.lastName} · {user.email}
                </button>
              </li>
            ))}
          </ul>
          {!editing && selectedId ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={status === 'loading'}
                onClick={() => {
                  void loadUser(selectedId);
                }}
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Editar
              </button>
              {users.find((user) => user.id === selectedId)?.status === 'active' ? (
                <button
                  type="button"
                  disabled={status === 'loading'}
                  onClick={() => {
                    void handleResetLogin();
                  }}
                  className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  Resetar Login
                </button>
              ) : null}
              {isGlobal ? (
                <button
                  type="button"
                  disabled={status === 'loading'}
                  onClick={() => {
                    setConfirmDelete(true);
                  }}
                  className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                >
                  Excluir
                </button>
              ) : null}
            </div>
          ) : null}
          {editing && canPickUsers ? (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setConfirmDelete(false);
              }}
              className="text-sm text-text-dark-secondary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Voltar à lista
            </button>
          ) : null}
        </div>
      ) : null}
      {confirmDelete ? (
        <div
          role="alertdialog"
          aria-labelledby="confirm-delete-user"
          className="space-y-4 rounded-2xl border border-red-500/30 bg-red-50 p-4"
        >
          <p id="confirm-delete-user" className="font-semibold text-red-900">
            Excluir este usuário?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => {
                setConfirmDelete(false);
              }}
              className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => {
                void handleDelete();
              }}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              Excluir
            </button>
          </div>
        </div>
      ) : null}
      {editing ? (
        <>
          {canPickUsers && accountStatus === 'blocked' ? (
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => {
                void handleReactivate();
              }}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Reativar
            </button>
          ) : null}
          {photoUrl ? (
            <Image
              src={publicPhotoSrc(photoUrl)}
              alt={`${firstName} ${lastName}`}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : null}
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
          {isGlobal ? (
            <label className="block text-sm font-medium">
              Tenant
              <select
                required
                value={tenantId}
                onChange={(event) => {
                  actorTenantFresh.current = false;
                  setTenantId(event.target.value);
                }}
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
          ) : null}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {status === 'loading' ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      ) : null}
      {message ? (
        <p
          role="status"
          className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-text-dark-secondary'}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
