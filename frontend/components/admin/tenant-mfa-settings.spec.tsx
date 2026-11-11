import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { TenantMfaSettings } from './tenant-mfa-settings';

const acme: api.TenantMfaSetting = {
  aiTokenCostPerMillion: 0.6,
  id: '11111111-1111-4111-8111-111111111111',
  mfaEnabled: false,
  name: 'Acme',
  slug: 'acme',
};

describe('TenantMfaSettings', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a loading status and then every tenant switch', async () => {
    let resolveList: (rows: api.TenantMfaSetting[]) => void = () => undefined;
    vi.spyOn(api, 'listTenantMfaSettings').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );
    render(<TenantMfaSettings />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    resolveList([
      acme,
      {
        aiTokenCostPerMillion: 0.6,
        id: '22222222-2222-4222-8222-222222222222',
        mfaEnabled: true,
        name: 'VETOR',
        slug: 'vetor',
      },
    ]);

    expect(await screen.findByRole('heading', { name: 'MFA' })).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('(acme)')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Habilitar MFA de Acme' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('switch', { name: 'Desabilitar MFA de VETOR' })).toHaveTextContent(
      'Habilitado',
    );
  });

  it('shows the empty list copy', async () => {
    vi.spyOn(api, 'listTenantMfaSettings').mockResolvedValue([]);
    render(<TenantMfaSettings />);

    expect(await screen.findByText('Nenhuma tenant.')).toBeInTheDocument();
  });

  it('saves the inverted flag and restores the switch when the save fails', async () => {
    vi.spyOn(api, 'listTenantMfaSettings').mockResolvedValue([acme]);
    const update = vi
      .spyOn(api, 'updateTenantMfaSetting')
      .mockRejectedValue(new ApiError('falhou', 500));
    render(<TenantMfaSettings />);

    fireEvent.click(await screen.findByRole('switch', { name: 'Habilitar MFA de Acme' }));

    expect(update).toHaveBeenCalledWith(acme.id, {
      mfaEnabled: true,
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
    expect(screen.getByRole('switch', { name: 'Habilitar MFA de Acme' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('shows the rate-limit sentence', async () => {
    vi.spyOn(api, 'listTenantMfaSettings').mockResolvedValue([acme]);
    vi.spyOn(api, 'updateTenantMfaSetting').mockRejectedValue(new ApiError('limite', 429));
    render(<TenantMfaSettings />);

    fireEvent.click(await screen.findByRole('switch', { name: 'Habilitar MFA de Acme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde alguns instantes antes de tentar novamente.',
    );
  });

  it('shows the load error', async () => {
    vi.spyOn(api, 'listTenantMfaSettings').mockRejectedValue(new ApiError('falhou', 403));
    render(<TenantMfaSettings />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os tenants.',
    );
  });
});
