import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PowerBiProxyService } from './powerbi-proxy.service.js';

function config(values: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('PowerBiProxyService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns 503 when the Python URL is missing or not http(s)', async () => {
    const missing = new PowerBiProxyService(config({ POWERBI_EMBEDDED_API_KEY: 'key' }));
    await expect(missing.listWorkspaces()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    const invalid = new PowerBiProxyService(
      config({
        POWERBI_EMBEDDED_API_KEY: 'key',
        POWERBI_EMBEDDED_URL: 'ftp://reports.example',
      }),
    );
    await expect(invalid.listWorkspaces()).rejects.toMatchObject({
      message: 'Report service is not configured.',
    });
  });

  it('returns 503 when the API key is missing', async () => {
    const proxy = new PowerBiProxyService(
      config({ POWERBI_EMBEDDED_URL: 'http://powerbi.example' }),
    );
    await expect(proxy.listWorkspaces()).rejects.toMatchObject({
      message: 'Report service is not configured.',
    });
  });

  it('strips a trailing slash, sends X-API-Key, and unwraps OData collections', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        value: [{ id: 'workspace-id', isOnDedicatedCapacity: true, name: 'Finance' }],
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const proxy = new PowerBiProxyService(
      config({
        POWERBI_EMBEDDED_API_KEY: 'secret-key',
        POWERBI_EMBEDDED_TIMEOUT: '12000',
        POWERBI_EMBEDDED_URL: 'https://powerbi.example/',
      }),
    );

    await expect(proxy.listWorkspaces()).resolves.toEqual([
      { id: 'workspace-id', isOnDedicatedCapacity: true, name: 'Finance' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://powerbi.example/groups',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'secret-key' }),
        method: 'GET',
      }),
    );
  });

  it('defaults timeout to 15000 when the env value is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => [],
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const proxy = new PowerBiProxyService(
      config({
        POWERBI_EMBEDDED_API_KEY: 'key',
        POWERBI_EMBEDDED_TIMEOUT: 'nope',
        POWERBI_EMBEDDED_URL: 'http://powerbi.example',
      }),
    );

    await proxy.listReports('11111111-1111-4111-8111-111111111111');
    const init = fetchMock.mock.calls[0][1] as { signal: AbortSignal };
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps connection failures to 503 without host details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.8:8000')));

    const proxy = new PowerBiProxyService(
      config({
        POWERBI_EMBEDDED_API_KEY: 'key',
        POWERBI_EMBEDDED_URL: 'http://10.0.0.8:8000',
      }),
    );

    await expect(proxy.listWorkspaces()).rejects.toMatchObject({
      message: 'Report service is temporarily unavailable.',
    });
  });

  it('does not send identities on GenerateToken', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        expiration: '2026-09-20T23:00:00.000Z',
        token: 'embed-token-example',
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const proxy = new PowerBiProxyService(
      config({
        POWERBI_EMBEDDED_API_KEY: 'key',
        POWERBI_EMBEDDED_URL: 'http://powerbi.example',
      }),
    );

    await expect(
      proxy.generateEmbedToken('dataset-id', 'report-id'),
    ).resolves.toEqual({
      expiration: '2026-09-20T23:00:00.000Z',
      token: 'embed-token-example',
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      dataset_ids: ['dataset-id'],
      report_ids: ['report-id'],
    });
  });
});
