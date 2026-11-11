import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import request from 'supertest';
import {
  createPowerBiDistributionExample,
  createPowerBiReportExample,
  powerBiCatalogReportExample,
  powerBiEmbedTokenExample,
  powerBiMyReportExample,
  powerBiStatusExample,
} from '../src/common/swagger/examples.js';
import { RateLimitGuard } from '../src/common/security/rate-limit.guard.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { ViewReportsGuard } from '../src/modules/powerbi/guards/view-reports.guard.js';
import { PowerBiController } from '../src/modules/powerbi/powerbi.controller.js';
import { PowerBiService } from '../src/modules/powerbi/powerbi.service.js';

const jwtSecret = 'powerbi-e2e-secret';
const tenantId = '22222222-2222-4222-8222-222222222222';
const reportId = '66666666-6666-4666-8666-666666666666';
const distributionId = '77777777-7777-4777-8777-777777777777';

describe('Power BI API (e2e)', () => {
  let app: INestApplication<Server>;
  const powerBiService = {
    createEmbedToken: vi.fn().mockResolvedValue(powerBiEmbedTokenExample),
    distribute: vi.fn().mockResolvedValue({
      ...createPowerBiDistributionExample,
      ativo: true,
      id: distributionId,
      relatorioId: reportId,
      tenantName: 'Acme',
      tenantSlug: 'acme',
    }),
    importReport: vi.fn().mockResolvedValue(powerBiCatalogReportExample),
    listCatalog: vi.fn().mockResolvedValue([powerBiCatalogReportExample]),
    listDistributions: vi.fn().mockResolvedValue([]),
    listMyReports: vi.fn().mockResolvedValue([powerBiMyReportExample]),
    listWorkspaceReportPages: vi.fn().mockResolvedValue([]),
    listWorkspaceReports: vi.fn().mockResolvedValue([]),
    listWorkspaces: vi.fn().mockResolvedValue([]),
    updateDistribution: vi.fn(),
    updateDistributionStatus: vi.fn(),
    updateReport: vi.fn(),
    updateReportStatus: vi.fn(),
  };

  describe('without a session', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PowerBiController],
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ JWT_SECRET: jwtSecret })],
          }),
          JwtModule.register({ secret: jwtSecret }),
        ],
        providers: [
          AccessTokenGuard,
          { provide: PowerBiService, useValue: powerBiService },
          { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
          AdministradorGuard,
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns 401 for catalog, my-reports, and embed-token without cookies', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/workspaces')
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/relatorios')
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/meus-relatorios')
        .expect(401);
      await request(app.getHttpServer())
        .post(`/api/v1/powerbi/meus-relatorios/${distributionId}/embed-token`)
        .expect(401);
    });
  });

  describe('authenticated non-administrator', () => {
    beforeEach(async () => {
      powerBiService.listMyReports.mockClear();
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PowerBiController],
        providers: [
          { provide: PowerBiService, useValue: powerBiService },
          {
            provide: getRepositoryToken(User),
            useValue: {
              findOne: vi.fn().mockResolvedValue({
                enabledActions: ['viewReports'],
                id: 'user-id',
                profile: 'Usuario',
                status: 'active',
              }),
            },
          },
          AdministradorGuard,
          ViewReportsGuard,
        ],
      })
        .overrideGuard(AccessTokenGuard)
        .useValue({
          canActivate: (context: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            context.switchToHttp().getRequest().user = {
              id: 'user-id',
              profile: 'Usuario',
              tenantId,
            };
            return true;
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns 403 on admin routes and allows my-reports', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/workspaces')
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/relatorios')
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/powerbi/relatorios')
        .send(createPowerBiReportExample)
        .expect(403);
      const mine = await request(app.getHttpServer())
        .get('/api/v1/powerbi/meus-relatorios')
        .expect(200);
      expect(mine.body).toEqual([powerBiMyReportExample]);
      expect(JSON.stringify(mine.body)).not.toContain('embedToken');
      expect(powerBiService.listMyReports).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('authenticated AdministradorTenant', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PowerBiController],
        providers: [
          { provide: PowerBiService, useValue: powerBiService },
          {
            provide: getRepositoryToken(User),
            useValue: {
              findOne: vi.fn().mockResolvedValue({
                enabledActions: [],
                id: 'tenant-admin',
                profile: 'AdministradorTenant',
                status: 'active',
              }),
            },
          },
          AdministradorGuard,
          ViewReportsGuard,
        ],
      })
        .overrideGuard(AccessTokenGuard)
        .useValue({
          canActivate: (context: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            context.switchToHttp().getRequest().user = {
              id: 'tenant-admin',
              profile: 'AdministradorTenant',
              tenantId,
            };
            return true;
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns 403 on Power BI catalog and admin routes', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/workspaces')
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/v1/powerbi/relatorios')
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/powerbi/relatorios')
        .send(createPowerBiReportExample)
        .expect(403);
    });
  });

  describe('administrator contracts', () => {
    beforeEach(async () => {
      powerBiService.importReport.mockClear();
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PowerBiController],
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                POWERBI_EMBED_TOKEN_RATE_LIMIT_MAX: '30',
                POWERBI_EMBED_TOKEN_RATE_LIMIT_WINDOW: '15m',
                POWERBI_PROXY_RATE_LIMIT_MAX: '60',
                POWERBI_PROXY_RATE_LIMIT_WINDOW: '15m',
              }),
            ],
          }),
        ],
        providers: [
          { provide: PowerBiService, useValue: powerBiService },
          { provide: APP_GUARD, useClass: RateLimitGuard },
        ],
      })
        .overrideGuard(AccessTokenGuard)
        .useValue({
          canActivate: (context: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            context.switchToHttp().getRequest().user = {
              id: 'admin-id',
              profile: 'Administrador',
              tenantId,
            };
            return true;
          },
        })
        .overrideGuard(AdministradorGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(ViewReportsGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          forbidNonWhitelisted: true,
          transform: true,
          whitelist: true,
        }),
      );
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('rejects unknown import fields and returns the catalog contract', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/powerbi/relatorios')
        .send({
          ...createPowerBiReportExample,
          datasetId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          embedUrl: 'https://evil.example/embed',
        })
        .expect(400);
      expect(powerBiService.importReport).not.toHaveBeenCalled();

      const created = await request(app.getHttpServer())
        .post('/api/v1/powerbi/relatorios')
        .send(createPowerBiReportExample)
        .expect(201);
      expect(created.body).toEqual(powerBiCatalogReportExample);
      expect(created.body).not.toHaveProperty('embedToken');

      await request(app.getHttpServer())
        .patch(`/api/v1/powerbi/relatorios/${reportId}/status`)
        .send(powerBiStatusExample)
        .expect(200);
    });

    it('returns the embed-token contract without extra python fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/powerbi/meus-relatorios/${distributionId}/embed-token`)
        .expect(200);
      expect(response.body).toEqual(powerBiEmbedTokenExample);
      expect(powerBiService.createEmbedToken).toHaveBeenCalledWith(
        tenantId,
        distributionId,
      );
    });
  });
});
