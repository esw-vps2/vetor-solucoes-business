import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PowerBiAdmin } from './powerbi-admin';

const catalog: api.PowerBiCatalogReport = {
  ativo: true,
  datasetId: '55555555-5555-4555-8555-555555555555',
  descricao: 'Monthly overview',
  embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=44444444-4444-4444-8444-444444444444',
  id: '66666666-6666-4666-8666-666666666666',
  nome: 'Revenue overview',
  reportId: '44444444-4444-4444-8444-444444444444',
  workspaceId: '33333333-3333-4333-8333-333333333333',
};

describe('PowerBiAdmin', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('asks for confirmation before deactivating a report', async () => {
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([catalog]);
    vi.spyOn(api, 'updatePowerBiReportStatus').mockResolvedValue({ ...catalog, ativo: false });
    render(<PowerBiAdmin />);

    expect(await screen.findByText('Relatórios Importados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Desativar Revenue overview' }));

    expect(screen.getByRole('heading', { name: 'Confirmar desativação' })).toBeInTheDocument();
    expect(
      screen.getByText('Desativar este relatório o tornará indisponível para todos os clientes.'),
    ).toBeInTheDocument();
    expect(api.updatePowerBiReportStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));
    expect(await screen.findByText('Status atualizado')).toBeInTheDocument();
    expect(api.updatePowerBiReportStatus).toHaveBeenCalledWith(catalog.id, false);
  });

  it('activates a report immediately without confirmation', async () => {
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([{ ...catalog, ativo: false }]);
    vi.spyOn(api, 'updatePowerBiReportStatus').mockResolvedValue(catalog);
    render(<PowerBiAdmin />);

    fireEvent.click(await screen.findByRole('switch', { name: 'Ativar Revenue overview' }));
    expect(screen.queryByRole('heading', { name: 'Confirmar desativação' })).not.toBeInTheDocument();
    expect(await screen.findByText('Status atualizado')).toBeInTheDocument();
    expect(api.updatePowerBiReportStatus).toHaveBeenCalledWith(catalog.id, true);
  });

  it('saves an edited report name and description', async () => {
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([catalog]);
    const update = vi.spyOn(api, 'updatePowerBiReport').mockResolvedValue({
      ...catalog,
      nome: 'Renamed',
    });
    render(<PowerBiAdmin />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Relatório atualizado')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith(catalog.id, {
      descricao: 'Monthly overview',
      nome: 'Renamed',
    });
  });

  it('asks for confirmation before deactivating a distribution', async () => {
    const distribution: api.PowerBiDistribution = {
      ativo: true,
      icone: null,
      id: '77777777-7777-4777-8777-777777777777',
      nomeExibicao: 'Revenue',
      ordem: 1,
      paginaPadrao: 'ReportSection',
      relatorioId: catalog.id,
      tenantId: '22222222-2222-4222-8222-222222222222',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    };
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([catalog]);
    vi.spyOn(api, 'listPowerBiDistributions').mockResolvedValue([distribution]);
    vi.spyOn(api, 'updatePowerBiDistributionStatus').mockResolvedValue({
      ...distribution,
      ativo: false,
    });
    render(<PowerBiAdmin />);

    expect(await screen.findByText('Relatórios Importados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Distribuição' }));
    fireEvent.change(screen.getByLabelText('Filtrar por relatório'), {
      target: { value: catalog.id },
    });

    expect(await screen.findByText('Acme (acme)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Desativar distribuição' }));
    expect(screen.getByRole('heading', { name: 'Confirmar desativação' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Desativar esta distribuição removerá o acesso do cliente a este relatório.',
      ),
    ).toBeInTheDocument();
    expect(api.updatePowerBiDistributionStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));
    expect(await screen.findByText('Status da distribuição atualizado')).toBeInTheDocument();
    expect(api.updatePowerBiDistributionStatus).toHaveBeenCalledWith(distribution.id, false);
  });

  it('loads tenants from GET /tenants in the distribute picker', async () => {
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([catalog]);
    const tenants = vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: '22222222-2222-4222-8222-222222222222', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listPowerBiWorkspaceReportPages').mockResolvedValue([]);
    render(<PowerBiAdmin />);

    expect(await screen.findByText('Relatórios Importados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Distribuição' }));
    fireEvent.click(screen.getByRole('button', { name: 'Distribuir Relatório' }));
    expect(await screen.findByRole('heading', { name: 'Distribuir Relatório' })).toBeInTheDocument();
    expect(tenants).toHaveBeenCalled();
    expect(await screen.findByRole('option', { name: 'Acme (acme)' })).toBeInTheDocument();
  });

  it('maps a 409 import conflict to the already-registered copy', async () => {
    vi.spyOn(api, 'listPowerBiCatalog').mockResolvedValue([]);
    vi.spyOn(api, 'listPowerBiWorkspaces').mockResolvedValue([
      { id: catalog.workspaceId, name: 'Finance workspace' },
    ]);
    vi.spyOn(api, 'listPowerBiWorkspaceReports').mockResolvedValue([
      { id: catalog.reportId, name: 'Revenue overview' },
    ]);
    vi.spyOn(api, 'listPowerBiWorkspaceReportPages').mockResolvedValue([
      { displayName: 'Summary', name: 'ReportSection' },
    ]);
    vi.spyOn(api, 'importPowerBiReport').mockRejectedValue(new api.ApiError('conflict', 409));
    render(<PowerBiAdmin />);

    expect(await screen.findByText('Nenhum relatório importado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Importar Relatório' }));
    fireEvent.change(await screen.findByLabelText('Workspace'), {
      target: { value: catalog.workspaceId },
    });
    fireEvent.change(await screen.findByLabelText('Relatório'), {
      target: { value: catalog.reportId },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Importar Relatório' }));
    expect(await screen.findByText('Este relatório já está cadastrado')).toBeInTheDocument();
  });
});
