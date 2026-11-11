'use client';

import { useEffect, useState } from 'react';
import { ApiError, getAdminAiPricing, updateAdminAiPricing } from '@/lib/api/client';

function formatTokenCost(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

export function TenantAiPricingSettings() {
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    getAdminAiPricing()
      .then((pricing) => {
        if (active) {
          setDraft(String(pricing.aiTokenCostPerMillion));
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('Não foi possível carregar o custo.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (pending) {
      return;
    }

    const parsed = Number(draft.replace(',', '.'));

    if (!Number.isFinite(parsed) || parsed < 0) {
      setSaveError('Informe um valor válido.');
      return;
    }

    setPending(true);
    setSaveError('');

    try {
      const saved = await updateAdminAiPricing(parsed);
      setDraft(String(saved.aiTokenCostPerMillion));
    } catch (error) {
      setSaveError(
        error instanceof ApiError && error.status === 429
          ? 'Aguarde alguns instantes antes de tentar novamente.'
          : 'Não foi possível concluir a operação.',
      );
    } finally {
      setPending(false);
    }
  }

  if (loadError) {
    return (
      <p className="text-red-700" role="alert">
        {loadError}
      </p>
    );
  }

  if (!ready) {
    return <p role="status">Carregando...</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-navy">Custo do Agente Beta</h2>
      <p className="mt-2 max-w-2xl text-base leading-7 text-text-dark-secondary">
        Valor único cobrado por milhão de tokens, aplicado a todos os tenants. O padrão é{' '}
        {formatTokenCost(0.6)}.
      </p>
      {saveError ? (
        <p className="mt-4 text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}
      <div className="mt-6 flex max-w-xl flex-col gap-3 rounded-2xl border border-navy/10 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-navy">
          R$ por milhão de tokens
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            value={draft}
            disabled={pending}
            className="min-h-10 rounded-xl border border-navy/20 px-3 text-base text-navy"
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-navy disabled:opacity-60"
          onClick={() => {
            void save();
          }}
        >
          Salvar
        </button>
      </div>
    </section>
  );
}
