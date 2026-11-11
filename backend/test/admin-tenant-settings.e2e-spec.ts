import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { AdminAiPricingController } from '../src/modules/portal/admin-ai-pricing.controller.js';
import { AdminTenantSettingsController } from '../src/modules/portal/admin-tenant-settings.controller.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { TenantsService } from '../src/modules/portal/tenants.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';

describe('admin tenant MFA settings', () => {
  const tenantsService = {
    listMfaSettings: vi.fn().mockResolvedValue([
      {
        aiTokenCostPerMillion: 0.6,
        id: tenantId,
        mfaEnabled: false,
        name: 'Acme',
        slug: 'acme',
      },
    ]),
    updateMfaEnabled: vi.fn().mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
      id: tenantId,
      mfaEnabled: true,
      name: 'Acme',
      slug: 'acme',
    }),
    getSharedAiTokenPricing: vi.fn().mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    }),
    updateSharedAiTokenPricing: vi.fn().mockResolvedValue({
      aiTokenCostPerMillion: 1.25,
    }),
  };

  async function createApp(
    profile?: 'Administrador' | 'AdministradorTenant' | 'Usuario',
  ): Promise<INestApplication<Server>> {
    const userId = profile === 'Administrador' ? 'admin-id' : 'other-id';
    const builder = Test.createTestingModule({
      controllers: [AdminAiPricingController, AdminTenantSettingsController],
      providers: [
        { provide: TenantsService, useValue: tenantsService },
        AccessTokenGuard,
        AdministradorGuard,
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'secret' } },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: vi.fn().mockResolvedValue(
              profile
                ? {
                    enabledActions: profile === 'Usuario' ? ['createTenant'] : [],
                    id: userId,
                    profile,
                    status: 'active',
                  }
                : null,
            ),
          },
        },
      ],
    });

    if (profile) {
      builder.overrideGuard(AccessTokenGuard).useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: userId,
            profile,
            tenantId,
          };
          return true;
        },
      });
    }

    const moduleFixture = await builder.compile();
    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    return app;
  }

  afterEach(() => {
    tenantsService.listMfaSettings.mockClear();
    tenantsService.updateMfaEnabled.mockClear();
    tenantsService.getSharedAiTokenPricing.mockClear();
    tenantsService.updateSharedAiTokenPricing.mockClear();
  });

  it('returns 401 without a session', async () => {
    const app = await createApp();

    await request(app.getHttpServer()).get('/api/v1/admin/ai-pricing').expect(401);
    await request(app.getHttpServer()).get('/api/v1/admin/tenant-settings').expect(401);
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenant-settings/${tenantId}`)
      .send({ mfaEnabled: true })
      .expect(401);
    expect(tenantsService.getSharedAiTokenPricing).not.toHaveBeenCalled();
    expect(tenantsService.listMfaSettings).not.toHaveBeenCalled();
    expect(tenantsService.updateMfaEnabled).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['Usuario', 'AdministradorTenant'] as const)(
    'returns 403 for %s on both routes',
    async (profile) => {
      const app = await createApp(profile);

      await request(app.getHttpServer()).get('/api/v1/admin/ai-pricing').expect(403);
      await request(app.getHttpServer()).get('/api/v1/admin/tenant-settings').expect(403);
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/tenant-settings/${tenantId}`)
        .send({ mfaEnabled: true })
        .expect(403);
      expect(tenantsService.getSharedAiTokenPricing).not.toHaveBeenCalled();
      expect(tenantsService.listMfaSettings).not.toHaveBeenCalled();
      expect(tenantsService.updateMfaEnabled).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it('lists and updates settings for Administrador', async () => {
    const app = await createApp('Administrador');

    const listed = await request(app.getHttpServer())
      .get('/api/v1/admin/tenant-settings')
      .expect(200);
    expect(listed.body).toEqual([
      {
        aiTokenCostPerMillion: 0.6,
        id: tenantId,
        mfaEnabled: false,
        name: 'Acme',
        slug: 'acme',
      },
    ]);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenant-settings/${tenantId}`)
      .send({ mfaEnabled: true })
      .expect(200);
    expect(updated.body.mfaEnabled).toBe(true);
    expect(tenantsService.updateMfaEnabled).toHaveBeenCalledWith(
      tenantId,
      { mfaEnabled: true },
      'admin-id',
    );
    await app.close();
  });

  it('rejects a non-boolean MFA flag', async () => {
    const app = await createApp('Administrador');

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenant-settings/${tenantId}`)
      .send({ mfaEnabled: 'yes' })
      .expect(400);
    expect(tenantsService.updateMfaEnabled).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a per-tenant token price on the MFA route', async () => {
    const app = await createApp('Administrador');

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenant-settings/${tenantId}`)
      .send({ aiTokenCostPerMillion: 2, mfaEnabled: true })
      .expect(400);
    expect(tenantsService.updateMfaEnabled).not.toHaveBeenCalled();
    await app.close();
  });

  it('reads and replicates one token price for Administrador', async () => {
    const app = await createApp('Administrador');

    const current = await request(app.getHttpServer())
      .get('/api/v1/admin/ai-pricing')
      .expect(200);
    expect(current.body).toEqual({ aiTokenCostPerMillion: 0.6 });

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/admin/ai-pricing')
      .send({ aiTokenCostPerMillion: 1.25 })
      .expect(200);
    expect(updated.body).toEqual({ aiTokenCostPerMillion: 1.25 });
    expect(tenantsService.updateSharedAiTokenPricing).toHaveBeenCalledWith(1.25, 'admin-id');

    await request(app.getHttpServer())
      .patch('/api/v1/admin/ai-pricing')
      .send({ aiTokenCostPerMillion: -1 })
      .expect(400);
    await app.close();
  });
});
