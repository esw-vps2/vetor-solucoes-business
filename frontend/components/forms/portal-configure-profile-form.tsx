'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ApiError,
  getUser,
  listTenants,
  listUsers,
  refreshSession,
  updateUserEnabledActions,
  type SafeUser,
  type TenantListItem,
  type UserListItem,
} from '@/lib/api/client';
import { isLaneConfigAction, MAPPED_PORTAL_ACTIONS } from '@/lib/portal-actions';

interface PortalConfigureProfileFormProps {
  actor: SafeUser;
  onSaved?: () => void;
  onSessionUpdated: (user: SafeUser) => void;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const TENANT_LEVEL_ACTIONS = MAPPED_PORTAL_ACTIONS.filter(
  (action) =>
    action.api !== 'createTenant' && action.api !== 'vetorAgent' && !isLaneConfigAction(action.api),
).map((action) => action.api);

const ALL_ACTIONS = MAPPED_PORTAL_ACTIONS.map((action) => action.api);

type AssignedProfile = 'Usuario' | 'AdministradorTenant' | 'Administrador';

function isAssignedProfile(value: string): value is AssignedProfile {
  return value === 'Usuario' || value === 'AdministradorTenant' || value === 'Administrador';
}

function visibleActions(actions: string[], includeTenant: boolean): string[] {
  return actions.filter(
    (action) =>
      (includeTenant || action !== 'createTenant') &&
      (includeTenant || !isLaneConfigAction(action)),
  );
}

function displayedActions(
  profile: AssignedProfile,
  stored: string[],
  includeTenant: boolean,
): string[] {
  if (profile === 'Administrador') {
    return [...ALL_ACTIONS];
  }

  const allowed = visibleActions(stored, includeTenant);

  if (profile !== 'AdministradorTenant') {
    return allowed;
  }

  const withoutTenantCreate = allowed.filter((action) => action !== 'createTenant');
  const hasBaseline = TENANT_LEVEL_ACTIONS.some((action) => withoutTenantCreate.includes(action));

  if (!hasBaseline) {
    return [...new Set([...TENANT_LEVEL_ACTIONS, ...withoutTenantCreate])];
  }

  return withoutTenantCreate;
}

export function PortalConfigureProfileForm({
  actor,
  onSaved,
  onSessionUpdated,
}: PortalConfigureProfileFormProps) {
  const isGlobal = actor.profile === 'Administrador';
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tenantId, setTenantId] = useState(
    actor.profile === 'AdministradorTenant' ? actor.tenantId : '',
  );
  const [selectedId, setSelectedId] = useState('');
  const [enabled, setEnabled] = useState<string[]>([]);
  const [assignedProfile, setAssignedProfile] = useState<AssignedProfile>('Usuario');
  const [loadedProfile, setLoadedProfile] = useState<AssignedProfile>('Usuario');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([listTenants(), listUsers()])
      .then(([nextTenants, nextUsers]) => {
        if (!active) {
          return;
        }

        setTenants(nextTenants);
        setUsers(nextUsers);
      })
      .catch(() => {
        if (active) {
          setStatus('error');
          setMessage('Não foi possível carregar tenants e usuários.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const tenantUsers = useMemo(
    () => users.filter((user) => user.tenantId === tenantId),
    [tenantId, users],
  );

  async function handleTenantChange(nextTenantId: string) {
    setTenantId(nextTenantId);
    setSelectedId('');
    setEnabled([]);
    setAssignedProfile('Usuario');
    setLoadedProfile('Usuario');
    setStatus('idle');
    setMessage('');
  }

  async function handleUserChange(nextId: string) {
    setSelectedId(nextId);
    setStatus('idle');
    setMessage('');

    if (!nextId) {
      setEnabled([]);
      setAssignedProfile('Usuario');
      setLoadedProfile('Usuario');
      return;
    }

    setStatus('loading');

    try {
      const profile = await getUser(nextId);
      const nextProfile = isAssignedProfile(profile.profile) ? profile.profile : 'Usuario';
      setLoadedProfile(nextProfile);
      setAssignedProfile(nextProfile);
      setEnabled(displayedActions(nextProfile, profile.enabledActions, isGlobal));
      setStatus('idle');
    } catch {
      setStatus('error');
      setMessage('Não foi possível carregar o usuário.');
    }
  }

  function handleProfileChange(nextProfile: AssignedProfile) {
    setAssignedProfile(nextProfile);

    if (nextProfile === 'Administrador') {
      setEnabled([...ALL_ACTIONS]);
      return;
    }

    if (nextProfile === 'AdministradorTenant') {
      setEnabled([...TENANT_LEVEL_ACTIONS]);
    }
  }

  function toggleAction(action: string) {
    setEnabled((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action],
    );
  }

  function actionChecked(action: string): boolean {
    return enabled.includes(action);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId) {
      setStatus('error');
      setMessage('Selecione um usuário.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await updateUserEnabledActions(
        selectedId,
        assignedProfile === 'Administrador'
          ? [...ALL_ACTIONS]
          : visibleActions(enabled, isGlobal).filter(
              (action) => assignedProfile !== 'AdministradorTenant' || action !== 'createTenant',
            ),
        isGlobal ? assignedProfile : undefined,
      );

      if (selectedId === actor.id) {
        onSessionUpdated(await refreshSession());
      }

      setStatus('success');
      setMessage('Configuração realizada com sucesso');
      onSaved?.();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiError
          ? 'Não foi possível salvar as permissões.'
          : 'Não foi possível salvar as permissões.',
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-navy">
      {isGlobal ? (
        <label className="block text-sm font-medium">
          Tenant
          <select
            required
            value={tenantId}
            onChange={(event) => {
              void handleTenantChange(event.target.value);
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
      <label className="block text-sm font-medium">
        Usuário
        <select
          required
          value={selectedId}
          disabled={!tenantId}
          onChange={(event) => {
            void handleUserChange(event.target.value);
          }}
          className={fieldClass}
        >
          <option value="">Selecione</option>
          {tenantUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </option>
          ))}
        </select>
      </label>
      {isGlobal ? (
        <label className="block text-sm font-medium">
          Perfil
          <select
            value={assignedProfile}
            disabled={!selectedId || loadedProfile === 'Administrador'}
            onChange={(event) => {
              const nextProfile = event.target.value;
              if (isAssignedProfile(nextProfile)) {
                handleProfileChange(nextProfile);
              }
            }}
            className={fieldClass}
          >
            <option value="Usuario">Usuário</option>
            <option value="Administrador">Administrador Global</option>
            <option value="AdministradorTenant">Administrador Tenant</option>
          </select>
        </label>
      ) : null}
      {isGlobal && assignedProfile === 'Administrador' ? (
        <p className="text-sm text-text-dark-secondary">Todas as permissões do sistema.</p>
      ) : null}
      {isGlobal && assignedProfile === 'AdministradorTenant' ? (
        <p className="text-sm text-text-dark-secondary">
          Todas as permissões deste tenant. O acesso fica limitado ao tenant do usuário.
        </p>
      ) : null}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Ações habilitadas</legend>
        {MAPPED_PORTAL_ACTIONS.filter((action) => {
          if (action.api === 'createTenant' && assignedProfile === 'AdministradorTenant') {
            return false;
          }

          return isGlobal || (action.api !== 'createTenant' && !isLaneConfigAction(action.api));
        }).map((action) => (
          <label key={action.api} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={actionChecked(action.api)}
              onChange={() => toggleAction(action.api)}
              disabled={
                !selectedId ||
                assignedProfile === 'Administrador' ||
                (!isGlobal && assignedProfile !== 'Usuario')
              }
            />
            {action.label}
          </label>
        ))}
      </fieldset>
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
        disabled={status === 'loading' || !selectedId}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {status === 'loading' ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
