import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { PowerBiService } from './powerbi.service.js';

const workspaceId = '33333333-3333-4333-8333-333333333333';
const reportId = '44444444-4444-4444-8444-444444444444';
const datasetId = '55555555-5555-4555-8555-555555555555';
const catalogId = '66666666-6666-4666-8666-666666666666';
const distributionId = '77777777-7777-4777-8777-777777777777';
const tenantId = '22222222-2222-4222-8222-222222222222';
const otherTenantId = '88888888-8888-4888-8888-888888888888';
const embedUrl =
  'https://app.powerbi.com/reportEmbed?reportId=44444444-4444-4444-8444-444444444444';

function uniqueViolation(): QueryFailedError {
  const error = new QueryFailedError('INSERT', [], new Error('duplicate'));
  (error as QueryFailedError & { code: string }).code = '23505';
  return error;
}

function createService(overrides: {
  reports?: Record<string, unknown>;
  distributions?: Record<string, unknown>;
  tenants?: Record<string, unknown>;
  proxy?: Record<string, unknown>;
} = {}) {
  const reports = {
    create: vi.fn((value) => value),
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
    ...overrides.reports,
  };
  const distributions = {
    create: vi.fn((value) => value),
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
    ...overrides.distributions,
  };
  const tenants = {
    findOne: vi.fn(),
    ...overrides.tenants,
  };
  const proxy = {
    generateEmbedToken: vi.fn(),
    getReport: vi.fn(),
    listPages: vi.fn(),
    listReports: vi.fn(),
    listWorkspaces: vi.fn(),
    ...overrides.proxy,
  };

  return {
    distributions,
    proxy,
    reports,
    service: new PowerBiService(
      reports as never,
      distributions as never,
      tenants as never,
      proxy as never,
    ),
    tenants,
  };
}

describe('PowerBiService', () => {
  it('imports a report using datasetId and embedUrl from Python and ignores client fields', async () => {
    const { proxy, reports, service } = createService({
      proxy: {
        getReport: vi.fn().mockResolvedValue({
          datasetId,
          embedUrl,
          id: reportId,
          name: 'Remote name',
        }),
      },
      reports: {
        save: vi.fn().mockImplementation(async (value) => ({
          ...value,
          active: true,
          id: catalogId,
        })),
      },
    });

    const result = await service.importReport({
      descricao: 'Overview',
      nome: 'Revenue',
      reportId,
      workspaceId,
    });

    expect(proxy.getReport).toHaveBeenCalledWith(workspaceId, reportId);
    expect(reports.save).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId,
        embedUrl,
        name: 'Revenue',
        reportId,
        workspaceId,
      }),
    );
    expect(result).toMatchObject({
      datasetId,
      embedUrl,
      id: catalogId,
      nome: 'Revenue',
    });
  });

  it('returns 409 when the workspace and report are already registered', async () => {
    const { service } = createService({
      proxy: {
        getReport: vi.fn().mockResolvedValue({
          datasetId,
          embedUrl,
          id: reportId,
          name: 'Revenue',
        }),
      },
      reports: {
        save: vi.fn().mockRejectedValue(uniqueViolation()),
      },
    });

    await expect(
      service.importReport({
        nome: 'Revenue',
        reportId,
        workspaceId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects distributing an inactive report and an unknown tenant', async () => {
    const { service, tenants } = createService({
      reports: {
        findOne: vi.fn().mockResolvedValue({
          active: false,
          id: catalogId,
        }),
      },
    });

    await expect(
      service.distribute(catalogId, { tenantId }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const active = createService({
      reports: {
        findOne: vi.fn().mockResolvedValue({
          active: true,
          id: catalogId,
        }),
      },
      tenants: {
        findOne: vi.fn().mockResolvedValue(null),
      },
    });
    await expect(
      active.service.distribute(catalogId, { tenantId }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(active.tenants.findOne).toHaveBeenCalled();
    expect(tenants.findOne).not.toHaveBeenCalled();
  });

  it('patches catalog name and description', async () => {
    const report = {
      active: true,
      datasetId,
      description: 'Old',
      embedUrl,
      id: catalogId,
      name: 'Old name',
      reportId,
      workspaceId,
    };
    const { service } = createService({
      reports: {
        findOne: vi.fn().mockResolvedValue(report),
        save: vi.fn().mockImplementation(async (value) => value),
      },
    });

    await expect(
      service.updateReport(catalogId, {
        descricao: '  New desc  ',
        nome: '  New name  ',
      }),
    ).resolves.toMatchObject({ descricao: 'New desc', nome: 'New name' });
  });

  it('updates a distribution display fields and status', async () => {
    const row = {
      active: true,
      defaultPage: null,
      displayName: null,
      icon: null,
      id: distributionId,
      reportId: catalogId,
      sortOrder: 0,
      tenant: { id: tenantId, name: 'Acme', slug: 'acme' },
      tenantId,
    };
    const { service } = createService({
      distributions: {
        findOne: vi.fn().mockResolvedValue(row),
        save: vi.fn().mockImplementation(async (value) => value),
      },
    });

    await expect(
      service.updateDistribution(distributionId, {
        nomeExibicao: 'Client name',
        ordem: 2,
      }),
    ).resolves.toMatchObject({
      nomeExibicao: 'Client name',
      ordem: 2,
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });

    await expect(
      service.updateDistributionStatus(distributionId, { ativo: false }),
    ).resolves.toMatchObject({ ativo: false });
  });

  it('returns 409 when the report is already distributed to the tenant', async () => {
    const { service } = createService({
      distributions: {
        save: vi.fn().mockRejectedValue(uniqueViolation()),
      },
      reports: {
        findOne: vi.fn().mockResolvedValue({ active: true, id: catalogId }),
      },
      tenants: {
        findOne: vi.fn().mockResolvedValue({
          id: tenantId,
          name: 'Acme',
          slug: 'acme',
        }),
      },
    });

    await expect(
      service.distribute(catalogId, { tenantId }),
    ).rejects.toMatchObject({
      message: 'This report is already distributed to this tenant.',
    });
  });

  it('lists only active distributions for the token tenant', async () => {
    const { distributions, service } = createService({
      distributions: {
        find: vi.fn().mockResolvedValue([
          {
            active: true,
            defaultPage: 'ReportSection',
            displayName: 'Revenue',
            icon: 'chart',
            id: distributionId,
            report: {
              active: true,
              description: 'Overview',
              id: catalogId,
              name: 'Revenue overview',
            },
            sortOrder: 1,
            tenantId,
          },
        ]),
      },
    });

    const result = await service.listMyReports(tenantId);

    expect(distributions.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, report: { active: true }, tenantId },
      }),
    );
    expect(result).toEqual([
      {
        icone: 'chart',
        id: distributionId,
        nomeExibicao: 'Revenue',
        ordem: 1,
        paginaPadrao: 'ReportSection',
        relatorio: {
          descricao: 'Overview',
          id: catalogId,
          nome: 'Revenue overview',
        },
        tenantId,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('embedToken');
    expect(JSON.stringify(result)).not.toContain(datasetId);
    expect(JSON.stringify(result)).not.toContain(embedUrl);
  });

  it('issues an embed token for the session tenant and forbids another tenant', async () => {
    const { proxy, service } = createService({
      distributions: {
        findOne: vi.fn().mockResolvedValue({
          active: true,
          defaultPage: 'ReportSection',
          displayName: 'Revenue',
          id: distributionId,
          report: {
            active: true,
            datasetId,
            embedUrl,
            name: 'Revenue overview',
            reportId,
          },
          tenantId,
        }),
      },
      proxy: {
        generateEmbedToken: vi.fn().mockResolvedValue({
          expiration: '2026-09-20T23:00:00.000Z',
          token: 'embed-token-example',
        }),
      },
    });

    await expect(
      service.createEmbedToken(otherTenantId, distributionId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const embed = await service.createEmbedToken(tenantId, distributionId);
    expect(proxy.generateEmbedToken).toHaveBeenCalledWith(datasetId, reportId);
    expect(embed).toEqual({
      embedToken: 'embed-token-example',
      embedUrl,
      expiration: '2026-09-20T23:00:00.000Z',
      id: distributionId,
      nome: 'Revenue',
      paginaPadrao: 'ReportSection',
    });
  });

  it('returns 400 when the distribution or report is inactive on embed', async () => {
    const { service } = createService({
      distributions: {
        findOne: vi.fn().mockResolvedValue({
          active: false,
          id: distributionId,
          report: { active: true, datasetId, embedUrl, name: 'Revenue', reportId },
          tenantId,
        }),
      },
    });

    await expect(
      service.createEmbedToken(tenantId, distributionId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the distribution is missing', async () => {
    const { service } = createService({
      distributions: {
        findOne: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.createEmbedToken(tenantId, distributionId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates 503 when Python is unavailable', async () => {
    const { service } = createService({
      proxy: {
        getReport: vi.fn().mockRejectedValue(
          new ServiceUnavailableException(
            'Report service is temporarily unavailable.',
          ),
        ),
      },
    });

    await expect(
      service.importReport({ nome: 'Revenue', reportId, workspaceId }),
    ).rejects.toMatchObject({
      message: 'Report service is temporarily unavailable.',
    });
  });
});
