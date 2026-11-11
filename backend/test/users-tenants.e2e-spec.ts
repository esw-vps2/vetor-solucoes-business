import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { createUserExample } from '../src/common/swagger/examples.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from '../src/modules/portal/guards/administrador-or-create-user.guard.js';
import { SelfOrAdministradorGuard } from '../src/modules/portal/guards/self-or-administrador.guard.js';
import { UsersListGuard } from '../src/modules/portal/guards/users-list.guard.js';
import { TenantsController } from '../src/modules/portal/tenants.controller.js';
import { TenantsService } from '../src/modules/portal/tenants.service.js';
import { UsersController } from '../src/modules/portal/users.controller.js';
import { UsersService } from '../src/modules/portal/users.service.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const userId = '11111111-1111-4111-8111-111111111111';

function applyUserFields(httpRequest: request.Test): request.Test {
  return httpRequest
    .field('age', String(createUserExample.age))
    .field('email', createUserExample.email)
    .field('firstName', createUserExample.firstName)
    .field('lastName', createUserExample.lastName)
    .field('password', createUserExample.password)
    .field('sex', createUserExample.sex)
    .field('tenantId', createUserExample.tenantId);
}

describe('Portal users and tenants API (e2e)', () => {
  let app: INestApplication<Server>;
  const usersService = {
    create: vi.fn().mockResolvedValue(undefined),
    findPublicProfile: vi.fn().mockResolvedValue({
      ...createUserExample,
      id: userId,
      photoUrl: `/api/v1/users/${userId}/photo`,
      profile: 'Usuario',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    }),
    listForActor: vi.fn().mockResolvedValue([
      {
        email: createUserExample.email,
        enabledActions: [],
        firstName: createUserExample.firstName,
        id: userId,
        lastName: createUserExample.lastName,
        profile: 'Usuario',
        tenantId: createUserExample.tenantId,
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]),
    readPhoto: vi.fn().mockResolvedValue({
      bytes: jpeg,
      contentType: 'image/jpeg',
    }),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetLink: vi.fn().mockResolvedValue(undefined),
  };
  const tenantsService = {
    listForActor: vi.fn().mockResolvedValue([
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Acme',
        slug: 'acme',
      },
    ]),
  };

  beforeEach(async () => {
    usersService.create.mockClear();
    usersService.update.mockClear();
    usersService.listForActor.mockClear();
    usersService.sendPasswordResetLink.mockClear();
    tenantsService.listForActor.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, TenantsController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: TenantsService, useValue: tenantsService },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: { id: string } } };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'admin-id' };
          return true;
        },
      })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SelfOrAdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UsersListGuard)
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

  it('creates a user as multipart without a photo', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .expect(204)
      .then((response) => {
        expect(response.body).toEqual({});
        expect(usersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            sex: 'F',
            tenantId: createUserExample.tenantId,
          }),
          undefined,
          'admin-id',
        );
      });
  });

  it('creates a user with an optional JPEG photo', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .attach('photo', jpeg, {
        filename: 'face.jpg',
        contentType: 'image/jpeg',
      })
      .expect(204);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: createUserExample.email }),
      expect.objectContaining({ mimetype: 'image/jpeg' }),
      'admin-id',
    );
  });

  it('accepts an image content type other than JPEG on create', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .attach('photo', Buffer.from('png'), {
        filename: 'face.png',
        contentType: 'image/png',
      })
      .expect(204);
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: createUserExample.email }),
      expect.objectContaining({ mimetype: 'image/png' }),
      'admin-id',
    );
  });

  it('rejects a non-image photo on create', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .attach('photo', Buffer.from('notes'), {
        filename: 'face.txt',
        contentType: 'text/plain',
      })
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects sex outside M, F, or O', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .field('age', String(createUserExample.age))
      .field('email', createUserExample.email)
      .field('firstName', createUserExample.firstName)
      .field('lastName', createUserExample.lastName)
      .field('password', createUserExample.password)
      .field('sex', 'X')
      .field('tenantId', createUserExample.tenantId)
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects a missing tenant id', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .field('age', String(createUserExample.age))
      .field('email', createUserExample.email)
      .field('firstName', createUserExample.firstName)
      .field('lastName', createUserExample.lastName)
      .field('password', createUserExample.password)
      .field('sex', createUserExample.sex)
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects a password that does not include a letter, a number, and a special character', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .field('age', String(createUserExample.age))
      .field('email', createUserExample.email)
      .field('firstName', createUserExample.firstName)
      .field('lastName', createUserExample.lastName)
      .field('password', '1234567890')
      .field('sex', createUserExample.sex)
      .field('tenantId', createUserExample.tenantId)
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('lists users for an administrator', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(200)
      .expect([
        {
          email: createUserExample.email,
          enabledActions: [],
          firstName: createUserExample.firstName,
          id: userId,
          lastName: createUserExample.lastName,
          profile: 'Usuario',
          tenantId: createUserExample.tenantId,
          tenantName: 'Acme',
          tenantSlug: 'acme',
        },
      ]);
  });

  it('creates a user with mapped enabledActions', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .field('enabledActions', JSON.stringify(['painel', 'createUser']))
      .expect(204);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        enabledActions: ['painel', 'createUser'],
      }),
      undefined,
      'admin-id',
    );
  });

  it('rejects enabledActions outside the mapped set', async () => {
    await applyUserFields(request(app.getHttpServer()).post('/api/v1/users'))
      .field('enabledActions', JSON.stringify(['powerbi']))
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('deletes a user as Administrador', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(204);

    expect(usersService.delete).toHaveBeenCalledWith(userId, 'admin-id');
  });

  it('emails a password reset link with an empty body', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/users/${userId}/password-reset-link`)
      .expect(204);

    expect(usersService.sendPasswordResetLink).toHaveBeenCalledWith(
      userId,
      'admin-id',
    );
  });

  it('rejects unknown properties on a password reset link request', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/users/${userId}/password-reset-link`)
      .send({ token: 'secret' })
      .expect(400);

    expect(usersService.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('patches only enabledActions', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${userId}`)
      .field('enabledActions', JSON.stringify(['editUser']))
      .expect(204);

    expect(usersService.update).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        enabledActions: ['editUser'],
      }),
      undefined,
      'admin-id',
    );
  });

  it('returns enabledActions on a user profile', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.enabledActions).toEqual(
          createUserExample.enabledActions,
        );
      });
  });

  it('updates a user as multipart', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${userId}`)
      .field('age', '33')
      .field('email', createUserExample.email)
      .field('firstName', 'Nova')
      .field('lastName', 'User')
      .field('sex', 'F')
      .attach('photo', jpeg, {
        filename: 'face.jpg',
        contentType: 'image/jpeg',
      })
      .expect(204);

    expect(usersService.update).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        age: 33,
        email: createUserExample.email,
        firstName: 'Nova',
      }),
      expect.objectContaining({ mimetype: 'image/jpeg' }),
      'admin-id',
    );
  });

  it('serves an uploaded JPEG photo', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}/photo`)
      .expect(200);

    expect(response.headers['content-type']).toContain('image/jpeg');
    expect(response.body).toEqual(jpeg);
  });

  it('lists every tenant for an administrator', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tenants')
      .expect(200)
      .expect([
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Acme',
          slug: 'acme',
        },
      ]);
  });
});

describe('POST /api/v1/users without a session', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { create: vi.fn() } },
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'secret' },
        },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SelfOrAdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UsersListGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 for an unauthenticated caller', async () => {
    await applyUserFields(
      request(app.getHttpServer()).post('/api/v1/users'),
    ).expect(401);
  });

  it('returns 401 for an unauthenticated reactivate', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/11111111-1111-4111-8111-111111111111/reactivate')
      .expect(401);
  });

  it('returns 401 for an unauthenticated password reset link', async () => {
    await request(app.getHttpServer())
      .post(
        '/api/v1/users/11111111-1111-4111-8111-111111111111/password-reset-link',
      )
      .expect(401);
  });
});

describe('PATCH /api/v1/users/{id} without a session', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { update: vi.fn() } },
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'secret' },
        },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    })
      .overrideGuard(SelfOrAdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UsersListGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 for an unauthenticated caller', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${userId}`)
      .field('age', '33')
      .field('email', createUserExample.email)
      .field('firstName', 'Nova')
      .field('lastName', 'User')
      .field('sex', 'F')
      .expect(401);
  });

  it('returns 401 for an unauthenticated enabledActions patch', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${userId}`)
      .field('enabledActions', JSON.stringify(['painel']))
      .expect(401);
  });
});

describe('GET /api/v1/tenants without a session', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: { listForActor: vi.fn() } },
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'secret' },
        },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 for an unauthenticated caller', async () => {
    await request(app.getHttpServer()).get('/api/v1/tenants').expect(401);
  });
});
