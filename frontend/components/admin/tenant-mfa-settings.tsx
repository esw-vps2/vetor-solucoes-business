'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  listTenantMfaSettings,
  updateTenantMfaSetting,
  type TenantMfaSetting,
} from '@/lib/api/client';

export function TenantMfaSettings() {
  const [tenants, setTenants] = useState<TenantMfaSetting[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listTenantMfaSettings()
      .then((rows) => {
        if (active) {
          setTenants(rows);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('Não foi possível carregar os tenants.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function toggle(tenant: TenantMfaSetting) {
    if (pendingId === tenant.id) {
      return;
    }

    setPendingId(tenant.id);
    setSaveError('');
    const next = !tenant.mfaEnabled;

    try {
      const saved = await updateTenantMfaSetting(tenant.id, {
        mfaEnabled: next,
      });
      setTenants((current) =>
        current?.map((row) => (row.id === saved.id ? saved : row)) ?? current,
      );
    } catch (error) {
      setSaveError(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de tentar novamente.'
          : 'Não foi possível concluir a operação.',
      );
    } finally {
      setPendingId(null);
    }
  }

  if (loadError) {
    return (
      <p className="text-red-700" role="alert">
        {loadError}
      </p>
    );
  }

  if (!tenants) {
    return (
      <p role="status">
        Carregando...
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-navy">MFA</h2>
      {saveError ? (
        <p className="mt-4 text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}
      {tenants.length === 0 ? (
        <p className="mt-8 text-navy">Nenhuma tenant.</p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {tenants.map((tenant) => (
            <li
              key={tenant.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-navy/10 bg-white p-6"
            >
              <div>
                <p className="text-lg font-semibold text-navy">{tenant.name}</p>
                <p className="mt-1 text-sm text-text-dark-secondary">({tenant.slug})</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={tenant.mfaEnabled}
                aria-label={`${tenant.mfaEnabled ? 'Desabilitar' : 'Habilitar'} MFA de ${tenant.name}`}
                className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60"
                disabled={pendingId === tenant.id}
                onClick={() => {
                  void toggle(tenant);
                }}
              >
                {tenant.mfaEnabled ? 'Habilitado' : 'Desabilitado'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
