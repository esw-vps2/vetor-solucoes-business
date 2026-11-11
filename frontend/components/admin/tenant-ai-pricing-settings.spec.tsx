import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { TenantAiPricingSettings } from './tenant-ai-pricing-settings';

describe('TenantAiPricingSettings', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows one shared price instead of a tenant list', async () => {
    vi.spyOn(api, 'getAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    });
    render(<TenantAiPricingSettings />);

    expect(await screen.findByRole('heading', { name: 'Custo do Agente Beta' })).toBeInTheDocument();
    expect(screen.getByText(/aplicado a todos os tenants/)).toBeInTheDocument();
    expect(screen.getByLabelText('R$ por milhão de tokens')).toHaveValue(0.6);
    expect(screen.getAllByRole('button', { name: 'Salvar' })).toHaveLength(1);
  });

  it('saves the price once for every tenant', async () => {
    vi.spyOn(api, 'getAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    });
    const update = vi.spyOn(api, 'updateAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 1.25,
    });
    render(<TenantAiPricingSettings />);

    fireEvent.change(await screen.findByLabelText('R$ por milhão de tokens'), {
      target: { value: '1.25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(update).toHaveBeenCalledWith(1.25);
    expect(await screen.findByLabelText('R$ por milhão de tokens')).toHaveValue(1.25);
  });

  it('rejects an invalid amount before calling the API', async () => {
    vi.spyOn(api, 'getAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    });
    const update = vi.spyOn(api, 'updateAdminAiPricing');
    render(<TenantAiPricingSettings />);

    fireEvent.change(await screen.findByLabelText('R$ por milhão de tokens'), {
      target: { value: '-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um valor válido.');
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the rate-limit sentence', async () => {
    vi.spyOn(api, 'getAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    });
    vi.spyOn(api, 'updateAdminAiPricing').mockRejectedValue(new ApiError('limite', 429));
    render(<TenantAiPricingSettings />);

    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde alguns instantes antes de tentar novamente.',
    );
  });

  it('shows the load error', async () => {
    vi.spyOn(api, 'getAdminAiPricing').mockRejectedValue(new ApiError('falhou', 403));
    render(<TenantAiPricingSettings />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o custo.',
    );
  });
});
