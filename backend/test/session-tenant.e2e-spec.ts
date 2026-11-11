import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { AuthController } from '../src/modules/portal/auth.controller.js';
import { AuthService } from '../src/modules/portal/auth.service.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { safeUserExample } from '../src/common/swagger/examples.js';

const tenantId = '22222222-2222-4222-8222-222222222222';

describe('PATCH /api/v1/auth/session', () => {
  let app: INestApplication<Server>;
  const authService = {
    getSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    requestPasswordRecovery: vi.fn(),
    resetPassword: vi.fn(),
    updateSessionTenant: vi.fn().mockResolvedValue({
      ...safeUserExample,
      tenantId,
    }),
    verifyPasswordRecovery: vi.fn(),
  };

  describe('without a session', () => {
    beforeEach(async () => {
      authService.updateSessionTenant.mockClear();
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authService },
          AccessTokenGuard,
          { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
          { provide: ConfigService, useValue: { getOrThrow: () => 'secret' } },
          {
            provide: getRepositoryToken(User),
            useValue: { findOne: vi.fn() },
          },
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

    it('returns 401 for an unauthenticated caller', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/auth/session')
        .send({ tenantId })
        .expect(401);
      expect(authService.updateSessionTenant).not.toHaveBeenCalled();
    });
  });

  describe('authenticated non-administrator', () => {
    beforeEach(async () => {
      authService.updateSessionTenant.mockClear();
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authService },
          {
            provide: getRepositoryToken(User),
            useValue: {
              findOne: vi.fn().mockResolvedValue({
                id: 'tenant-admin',
                profile: 'AdministradorTenant',
                status: 'active',
              }),
            },
          },
          AdministradorGuard,
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

    it('returns 403 for AdministradorTenant', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/auth/session')
        .send({ tenantId })
        .expect(403);
      expect(authService.updateSessionTenant).not.toHaveBeenCalled();
    });
  });

  describe('administrator', () => {
    beforeEach(async () => {
      authService.updateSessionTenant.mockClear();
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [{ provide: AuthService, useValue: authService }],
      })
        .overrideGuard(AccessTokenGuard)
        .useValue({
          canActivate: (context: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            context.switchToHttp().getRequest().user = {
              id: 'admin-id',
              profile: 'Administrador',
              sessionId: '33333333-3333-4333-8333-333333333333',
              tenantId: '11111111-1111-4111-8111-111111111111',
            };
            return true;
          },
        })
        .overrideGuard(AdministradorGuard)
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

    it('updates the working session tenant', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/auth/session')
        .send({ tenantId })
        .expect(200);

      expect(response.body.tenantId).toBe(tenantId);
      expect(authService.updateSessionTenant).toHaveBeenCalled();
    });

    it('rejects extra fields', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/auth/session')
        .send({ slug: 'acme', tenantId })
        .expect(400);
      expect(authService.updateSessionTenant).not.toHaveBeenCalled();
    });
  });
});

describe('POST /api/v1/auth MFA routes', () => {
  let app: INestApplication<Server>;
  const challengeId = '11111111-1111-4111-8111-111111111111';
  const authService = {
    login: vi.fn().mockResolvedValue({
      challengeId,
      expiresAt: '2026-10-01T12:30:00.000Z',
      mfaRequired: true,
    }),
    cancelMfa: vi.fn().mockResolvedValue(undefined),
    resendMfa: vi.fn().mockResolvedValue({
      challengeId: '11111111-1111-4111-8111-111111111112',
      expiresAt: '2026-10-01T13:00:00.000Z',
      mfaRequired: true,
    }),
    verifyMfa: vi.fn().mockImplementation(async (_dto: unknown, response: { cookie: (name: string, value: string, options: object) => void }) => {
      response.cookie('access_token', 'access', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
      response.cookie('refresh_token', 'refresh', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
      return safeUserExample;
    }),
  };

  beforeEach(async () => {
    authService.login.mockClear();
    authService.verifyMfa.mockClear();
    authService.resendMfa.mockClear();
    authService.cancelMfa.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        AccessTokenGuard,
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'secret' } },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
        AdministradorGuard,
      ],
    }).compile();

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

  it('rejects an invalid login body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'secret' })
      .expect(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('returns an MFA challenge and no session cookie for a valid login body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'ExamplePassword12!' })
      .expect(200);

    expect(response.body).toEqual({
      challengeId,
      expiresAt: '2026-10-01T12:30:00.000Z',
      mfaRequired: true,
    });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(authService.login).toHaveBeenCalled();
  });

  it('trims surrounding whitespace from a pasted MFA code', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeId, token: ' 0\n' })
      .expect(200);

    expect(authService.verifyMfa).toHaveBeenCalledWith(
      { challengeId, token: '0' },
      expect.anything(),
      expect.anything(),
    );
  });

  it('rejects a non-digit MFA code', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeId, token: 'abcd' })
      .expect(400);
    expect(authService.verifyMfa).not.toHaveBeenCalled();
  });

  it('sets session cookies only when verify accepts the code', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeId, token: '0' })
      .expect(200);

    expect(response.body).not.toHaveProperty('status');
    const setCookie = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    expect(cookies).toContain('access_token=');
    expect(cookies).toContain('refresh_token=');
    expect(cookies).toContain('HttpOnly');
    expect(authService.verifyMfa).toHaveBeenCalled();
  });

  it('rejects a resend body without a challenge id', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/resend')
      .send({})
      .expect(400);
    expect(authService.resendMfa).not.toHaveBeenCalled();
  });

  it('accepts a resend after the client sends a challenge id', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/resend')
      .send({ challengeId })
      .expect(200);

    expect(response.body.challengeId).toBe('11111111-1111-4111-8111-111111111112');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(authService.resendMfa).toHaveBeenCalled();
  });

  it('rejects a cancel body without a challenge id', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/cancel')
      .send({})
      .expect(400);
    expect(authService.cancelMfa).not.toHaveBeenCalled();
  });

  it('deletes the challenge with 204 and no session cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/cancel')
      .send({ challengeId })
      .expect(204);

    expect(response.body).toEqual({});
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(authService.cancelMfa).toHaveBeenCalledWith({ challengeId });
  });
});
