import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PowerBiEmbedViewer } from './powerbi-embed-viewer';

vi.mock('next/dynamic', () => ({
  default: () =>
    function PowerBIEmbedStub({
      embedConfig,
    }: {
      embedConfig: {
        accessToken: string;
        pageName?: string;
        settings: {
          background?: number;
          bars: { statusBar: { visibile?: boolean; visible: boolean } };
          customLayout?: { displayOption?: number };
          layoutType?: number;
          panes: {
            filters: { visible: boolean };
            pageNavigation: { visible: boolean };
          };
        };
      };
    }) {
      return (
        <div data-testid="powerbi-embed">
          {embedConfig.accessToken}
          {embedConfig.pageName}
          {embedConfig.settings.panes.filters.visible ? 'filters-on' : 'filters-off'}
          {embedConfig.settings.panes.pageNavigation.visible ? 'nav-on' : 'nav-off'}
          {embedConfig.settings.bars.statusBar.visible ? 'status-on' : 'status-off'}
          {embedConfig.settings.customLayout?.displayOption === 1 ? 'fill-page' : 'fit-other'}
          {embedConfig.settings.background === 0 ? 'bg-default' : 'bg-transparent'}
        </div>
      );
    },
}));

vi.mock('powerbi-client', () => ({
  models: {
    BackgroundType: { Default: 0, Transparent: 1 },
    DisplayOption: { ActualSize: 2, FitToPage: 0, FitToWidth: 1 },
    LayoutType: { Custom: 1 },
    ReportAlignment: { Center: 1 },
    TokenType: { Embed: 1 },
  },
}));

const payload: api.PowerBiEmbedToken = {
  embedToken: 'embed-token-example',
  embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=44444444-4444-4444-8444-444444444444',
  expiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  id: '77777777-7777-4777-8777-777777777777',
  nome: 'Revenue',
  paginaPadrao: 'ReportSection',
};

describe('PowerBiEmbedViewer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('loads an embed in memory, hides filters, and shows page navigation', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(api, 'createPowerBiEmbedToken').mockResolvedValue(payload);
    render(<PowerBiEmbedViewer distributionId={payload.id} onBack={() => undefined} />);

    expect(await screen.findByTestId('powerbi-embed')).toHaveTextContent('embed-token-example');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('ReportSection');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('filters-off');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('nav-on');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('status-off');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('fill-page');
    expect(screen.getByTestId('powerbi-embed')).toHaveTextContent('bg-default');
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tela cheia' })).toBeInTheDocument();
    expect(setItem.mock.calls.flat().join(' ')).not.toContain('embed-token-example');
  });

  it('shows denied copy on 403 and retry copy on other errors', async () => {
    vi.spyOn(api, 'createPowerBiEmbedToken').mockRejectedValueOnce(new api.ApiError('no', 403));
    const { rerender } = render(
      <PowerBiEmbedViewer distributionId={payload.id} onBack={() => undefined} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado a este relatório');

    vi.spyOn(api, 'createPowerBiEmbedToken').mockRejectedValueOnce(new api.ApiError('down', 503));
    rerender(<PowerBiEmbedViewer distributionId="other-id" onBack={() => undefined} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro ao carregar relatório. Tente novamente.',
    );
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => {
      expect(api.createPowerBiEmbedToken).toHaveBeenCalled();
    });
  });
});
