import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { RelatoriosView } from './relatorios-view';

const report: api.PowerBiMyReport = {
  icone: 'chart',
  id: '77777777-7777-4777-8777-777777777777',
  nomeExibicao: 'Revenue',
  ordem: 1,
  paginaPadrao: 'ReportSection',
  relatorio: {
    descricao: 'Monthly overview',
    id: '66666666-6666-4666-8666-666666666666',
    nome: 'Revenue overview',
  },
  tenantId: '22222222-2222-4222-8222-222222222222',
};

describe('RelatoriosView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the empty copy when no reports are distributed', async () => {
    vi.spyOn(api, 'listMyPowerBiReports').mockResolvedValue([]);
    render(<RelatoriosView />);

    expect(
      await screen.findByRole('heading', { name: 'Nenhum relatório disponível' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Entre em contato com o administrador para ter relatórios configurados.'),
    ).toBeInTheDocument();
  });

  it('shows an error when the list request fails', async () => {
    vi.spyOn(api, 'listMyPowerBiReports').mockRejectedValue(new api.ApiError('fail', 500));
    render(<RelatoriosView />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao carregar relatórios');
  });

  it('renders cards using the display name and custom SVG', async () => {
    vi.spyOn(api, 'listMyPowerBiReports').mockResolvedValue([report]);
    render(<RelatoriosView />);

    const card = await screen.findByRole('button', { name: /Revenue/ });
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('items-center', 'text-center');
    expect(screen.getByText('Monthly overview')).toBeInTheDocument();
    expect(card.querySelector('svg')).not.toBeNull();
  });
});
