import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  createTenantExample,
  tenantCreatedExample,
} from '../src/common/swagger/examples.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from '../src/modules/portal/guards/administrador-or-create-user.guard.js';
import { TenantsController } from '../src/modules/portal/tenants.controller.js';
import { TenantsService } from '../src/modules/portal/tenants.service.js';

const payload = {
  email: createTenantExample.email,
  name: createTenantExample.name,
  slug: createTenantExample.slug,
};

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('POST /api/v1/tenants', () => {
  let app: INestApplication<Server>;
  const tenantsService = {
    create: vi.fn().mockResolvedValue(tenantCreatedExample),
    listForActor: vi.fn(),
    deletePhoto: vi.fn(),
    readPhoto: vi.fn(),
    replacePhoto: vi.fn(),
  };

  beforeEach(async () => {
    tenantsService.create.mockClear();
    tenantsService.create.mockResolvedValue(tenantCreatedExample);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [{ provide: TenantsService, useValue: tenantsService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => {
              user?: { id: string; profile: string; tenantId: string };
            };
          };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: 'admin-id',
            profile: 'Administrador',
            tenantId: tenantCreatedExample.id,
          };
          return true;
        },
      })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
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

  it('creates a tenant with optional email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send(payload)
      .expect(201)
      .expect(tenantCreatedExample);

    expect(tenantsService.create).toHaveBeenCalledWith(
      expect.objectContaining(payload),
    );
  });

  it('creates a tenant when email is omitted', async () => {
    tenantsService.create.mockResolvedValue({
      ...tenantCreatedExample,
      email: null,
    });

    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ name: payload.name, slug: payload.slug })
      .expect(201)
      .expect({ ...tenantCreatedExample, email: null });
  });

  it('rejects missing name or slug', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ slug: payload.slug })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ name: payload.name })
      .expect(400);
    expect(tenantsService.create).not.toHaveBeenCalled();
  });

  it('rejects name longer than 160, slug longer than 80, and invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ name: 'n'.repeat(161), slug: payload.slug })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ name: payload.name, slug: 's'.repeat(81) })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ ...payload, email: 'not-an-email' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ ...payload, email: `${'a'.repeat(250)}@example.com` })
      .expect(400);
    expect(tenantsService.create).not.toHaveBeenCalled();
  });

  it('rejects client-supplied id or status', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ ...payload, status: 'inactive' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({ ...payload, id: tenantCreatedExample.id })
      .expect(400);
    expect(tenantsService.create).not.toHaveBeenCalled();
  });

  it('returns 409 when the tenant already exists', async () => {
    tenantsService.create.mockRejectedValue(
      new ConflictException('A tenant with these details already exists.'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send(payload)
      .expect(409);
  });

  it('does not expose a tenant PATCH', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/tenants/${tenantCreatedExample.id}`)
      .send({ name: 'Other' })
      .expect(404);
  });

  it('creates a tenant from multipart and forwards an optional photo', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .field('name', payload.name)
      .field('slug', payload.slug)
      .field('email', payload.email)
      .attach('photo', png, { contentType: 'image/png', filename: 'mark.png' })
      .expect(201)
      .expect(tenantCreatedExample);

    expect(tenantsService.create).toHaveBeenCalledWith(
      expect.objectContaining(payload),
      expect.objectContaining({ mimetype: 'image/png' }),
    );
  });

  it('replaces a tenant photo', async () => {
    tenantsService.replacePhoto.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .attach('photo', png, { contentType: 'image/png', filename: 'mark.png' })
      .expect(204);

    expect(tenantsService.replacePhoto).toHaveBeenCalledWith(
      tenantCreatedExample.id,
      expect.objectContaining({ mimetype: 'image/png' }),
    );
  });

  it('returns 404 when the photo replacement target does not exist', async () => {
    tenantsService.replacePhoto.mockRejectedValue(
      new NotFoundException('Not found.'),
    );

    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .attach('photo', png, { contentType: 'image/png', filename: 'mark.png' })
      .expect(404);
  });

  it('returns 400 when the replacement file is rejected', async () => {
    tenantsService.replacePhoto.mockRejectedValue(
      new BadRequestException('Invalid input.'),
    );

    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .attach('photo', png, { contentType: 'image/png', filename: 'mark.png' })
      .expect(400);
  });

  it('deletes a tenant photo', async () => {
    tenantsService.deletePhoto.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(204);

    expect(tenantsService.deletePhoto).toHaveBeenCalledWith(
      tenantCreatedExample.id,
    );
  });

  it('reads the working tenant photo and hides another tenant', async () => {
    tenantsService.readPhoto.mockResolvedValueOnce({
      bytes: png,
      contentType: 'image/png',
    });

    await request(app.getHttpServer())
      .get(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(200)
      .expect('content-type', /image\/png/);

    expect(tenantsService.readPhoto).toHaveBeenCalledWith(
      tenantCreatedExample.id,
      {
        profile: 'Administrador',
        tenantId: tenantCreatedExample.id,
      },
    );

    tenantsService.readPhoto.mockRejectedValueOnce(
      new ForbiddenException('Access denied.'),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(403);
  });
});

describe('POST /api/v1/tenants without a session', () => {
  let app: INestApplication<Server>;
  const tenantsService = { create: vi.fn() };

  beforeEach(async () => {
    tenantsService.create.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: tenantsService },
        AccessTokenGuard,
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'secret' } },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
        AdministradorGuard,
        AdministradorOrCreateUserGuard,
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
      .post('/api/v1/tenants')
      .send(payload)
      .expect(401);
    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(401);
    expect(tenantsService.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/tenants as Administrador', () => {
  let app: INestApplication<Server>;
  const tenantsService = {
    create: vi.fn().mockResolvedValue(tenantCreatedExample),
  };
  const users = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    tenantsService.create.mockClear();
    tenantsService.create.mockResolvedValue(tenantCreatedExample);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: tenantsService },
        { provide: getRepositoryToken(User), useValue: users },
        AdministradorGuard,
        AdministradorOrCreateUserGuard,
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'admin-id' };
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

  it('creates a tenant for an authenticated Administrador', async () => {
    users.findOne.mockResolvedValue({
      enabledActions: [],
      id: 'admin-id',
      profile: 'Administrador',
      status: 'active',
    });

    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send(payload)
      .expect(201)
      .expect(tenantCreatedExample);
    expect(tenantsService.create).toHaveBeenCalledWith(
      expect.objectContaining(payload),
    );
  });
});

describe('POST /api/v1/tenants as a non-administrator', () => {
  let app: INestApplication<Server>;
  const tenantsService = { create: vi.fn(), replacePhoto: vi.fn() };
  const users = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    tenantsService.create.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: tenantsService },
        { provide: getRepositoryToken(User), useValue: users },
        AdministradorGuard,
        AdministradorOrCreateUserGuard,
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'actor-id' };
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

  it('returns 403 for Usuario even with createTenant', async () => {
    users.findOne.mockResolvedValue({
      enabledActions: ['createTenant'],
      id: 'actor-id',
      profile: 'Usuario',
      status: 'active',
    });

    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send(payload)
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(403);
    expect(tenantsService.create).not.toHaveBeenCalled();
    expect(tenantsService.replacePhoto).not.toHaveBeenCalled();
  });

  it('returns 403 for AdministradorTenant even with createTenant', async () => {
    users.findOne.mockResolvedValue({
      enabledActions: ['createTenant'],
      id: 'actor-id',
      profile: 'AdministradorTenant',
      status: 'active',
    });

    await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send(payload)
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/v1/tenants/${tenantCreatedExample.id}/photo`)
      .expect(403);
    expect(tenantsService.create).not.toHaveBeenCalled();
    expect(tenantsService.replacePhoto).not.toHaveBeenCalled();
  });
});
