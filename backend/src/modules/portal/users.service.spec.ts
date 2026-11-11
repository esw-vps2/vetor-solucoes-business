import { createHash } from 'node:crypto';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UsersService } from './users.service.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const userId = '11111111-1111-4111-8111-111111111111';
const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('UsersService', () => {
  const tenant = Object.assign(new Tenant(), {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Acme',
    slug: 'acme',
  });
  const dto = {
    age: 32,
    email: 'Nova@example.com',
    firstName: 'Nova',
    lastName: 'User',
    password: 'ExamplePassword12!',
    sex: 'F' as const,
    tenantId: tenant.id,
  };

  function createService() {
    const users = {
      create: vi.fn((value) => value),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          enabledActions: [],
          id: actorId,
          profile: 'Administrador',
          status: 'active',
          tenantId: tenant.id,
        }),
      ),
      save: vi.fn(async (value) => Object.assign(value, { id: userId })),
    };
    const tenants = {
      find: vi.fn().mockResolvedValue([tenant]),
      findOne: vi.fn().mockResolvedValue(tenant),
    };
    const resetTokens = {
      create: vi.fn((value) => value),
      save: vi.fn(async (value) => value),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: vi.fn((key: string, fallback?: string) => {
        if (key === 'CORS') {
          return 'http://localhost:3000';
        }

        return fallback;
      }),
    };
    const mail = {
      sendPasswordChangeInvitation: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetLink: vi.fn().mockResolvedValue(undefined),
    };
    const audit = {
      record: vi.fn().mockResolvedValue(undefined),
    };
    const tenantStorage = {
      deleteTenantFile: vi.fn().mockResolvedValue(undefined),
      readUserPhoto: vi.fn(),
      writeUserPhoto: vi.fn().mockResolvedValue(undefined),
    };
    const transactionManager = {
      query: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: vi.fn(async (work: (manager: unknown) => Promise<void>) => {
        await work(transactionManager);
      }),
    };

    return {
      audit,
      dataSource,
      transactionManager,
      mail,
      resetTokens,
      service: new UsersService(
        users as never,
        tenants as never,
        resetTokens as never,
        config as never,
        mail as never,
        audit as never,
        tenantStorage as never,
        dataSource as never,
      ),
      tenantStorage,
      tenants,
      users,
    };
  }

  it('creates a hashed user without a photo and sends Altere a senha', async () => {
    const { audit, mail, resetTokens, service, tenantStorage, users } =
      createService();

    await expect(
      service.create(dto, undefined, actorId),
    ).resolves.toBeUndefined();

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 32,
        email: 'nova@example.com',
        enabledActions: [],
        firstName: 'Nova',
        lastName: 'User',
        passwordHash: 'hashed-password',
        photoUrl: '',
        profile: 'Usuario',
        sex: 'F',
        tenantId: tenant.id,
      }),
    );
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
    expect(users.save.mock.calls[0][0]).not.toHaveProperty('password');
    const savedToken = resetTokens.create.mock.calls[0][0];
    const changeUrl = mail.sendPasswordChangeInvitation.mock
      .calls[0][1] as string;
    const rawToken = new URL(changeUrl).searchParams.get('token') ?? '';

    expect(mail.sendPasswordChangeInvitation).toHaveBeenCalledWith(
      'nova@example.com',
      expect.stringMatching(
        /^http:\/\/localhost:3000\/portal\/change-password\?token=[a-f0-9]{64}$/,
      ),
    );
    expect(savedToken.tokenHash).toBe(
      createHash('sha256').update(rawToken).digest('hex'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      'user_created',
      expect.objectContaining({
        tenantId: tenant.id,
        userId,
      }),
    );
  });

  it('stores a JPEG on the tenant filesystem and persists only a pointer', async () => {
    const { service, tenantStorage, users } = createService();

    await service.create(
      dto,
      {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        size: jpeg.length,
      } as Express.Multer.File,
      actorId,
    );

    expect(tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      tenant.id,
      `${userId}.jpg`,
      jpeg,
    );
    expect(users.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        photoUrl: `${userId}.jpg`,
      }),
    );
    expect(users.save.mock.calls.flat().join(' ')).not.toContain(
      jpeg.toString(),
    );
  });

  it('stores a PNG using the detected image type', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const { service, tenantStorage, users } = createService();

    await service.create(
      dto,
      {
        buffer: png,
        mimetype: 'image/png',
        size: png.length,
      } as Express.Multer.File,
      actorId,
    );

    expect(tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      tenant.id,
      `${userId}.png`,
      png,
    );
    expect(users.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        photoUrl: `${userId}.png`,
      }),
    );
  });

  it('rejects a file that is not an image', async () => {
    const { service, tenantStorage } = createService();

    await expect(
      service.create(
        dto,
        {
          buffer: Buffer.from('not-an-image'),
          mimetype: 'image/png',
          size: 12,
        } as Express.Multer.File,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
  });

  it('rejects a JPEG larger than 5 MB', async () => {
    const { service, tenantStorage } = createService();

    await expect(
      service.create(
        dto,
        {
          buffer: jpeg,
          mimetype: 'image/jpeg',
          size: 5 * 1024 * 1024 + 1,
        } as Express.Multer.File,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
  });

  it('rejects an unknown tenant', async () => {
    const context = createService();
    context.tenants.findOne.mockResolvedValue(null);

    await expect(
      context.service.create(dto, undefined, actorId),
    ).rejects.toThrow('Invalid input.');
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.mail.sendPasswordChangeInvitation).not.toHaveBeenCalled();
  });

  it('rejects a duplicate tenant email without revealing the account', async () => {
    const context = createService();
    const error = new QueryFailedError('INSERT', [], new Error('duplicate'));
    Object.assign(error, { code: '23505' });
    context.users.save.mockRejectedValue(error);

    await expect(
      context.service.create(dto, undefined, actorId),
    ).rejects.toThrow('Invalid input.');
  });

  it('does not log the password or the raw change-password token', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { mail, service } = createService();
    mail.sendPasswordChangeInvitation.mockRejectedValue(new Error('smtp'));

    await service.create(dto, undefined, actorId);

    const logged = error.mock.calls.flat().join(' ');
    expect(logged).not.toContain(dto.password);
    expect(logged).not.toContain('token=');
    error.mockRestore();
  });

  it('lists users for the administrator picker', async () => {
    const { service, users } = createService();
    users.find.mockResolvedValue([
      Object.assign(new User(), {
        email: 'nova@example.com',
        enabledActions: [],
        firstName: 'Nova',
        id: userId,
        lastName: 'User',
        profile: 'Usuario',
        status: 'active',
        tenantId: tenant.id,
      }),
    ]);

    await expect(service.listForActor(actorId)).resolves.toEqual([
      {
        cargo: '',
        email: 'nova@example.com',
        enabledActions: [],
        firstName: 'Nova',
        id: userId,
        lastName: 'User',
        profile: 'Usuario',
        status: 'active',
        tenantId: tenant.id,
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]);
  });

  it('keeps a blocked user in the administrator list', async () => {
    const { service, users } = createService();
    users.find.mockResolvedValue([
      Object.assign(new User(), {
        email: 'nova@example.com',
        enabledActions: [],
        firstName: 'Nova',
        id: userId,
        lastName: 'User',
        profile: 'Usuario',
        status: 'blocked',
        tenantId: tenant.id,
      }),
    ]);

    await expect(service.listForActor(actorId)).resolves.toEqual([
      expect.objectContaining({
        id: userId,
        status: 'blocked',
      }),
    ]);
    expect(users.find).toHaveBeenCalledWith({
      order: { email: 'ASC' },
    });
  });

  it('updates profile fields and can replace a photo', async () => {
    const { audit, service, tenantStorage, users } = createService();
    const existing = Object.assign(new User(), {
      age: 20,
      email: 'old@example.com',
      firstName: 'Old',
      id: userId,
      lastName: 'Name',
      photoUrl: '',
      profile: 'Usuario',
      sex: 'O',
      status: 'active',
      tenantId: tenant.id,
    });
    const admin = Object.assign(new User(), {
      id: 'admin-id',
      profile: 'Administrador',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === userId) {
        return Promise.resolve(existing);
      }

      if (where.id === 'admin-id') {
        return Promise.resolve(admin);
      }

      return Promise.resolve(null);
    });

    await service.update(
      userId,
      {
        age: 33,
        email: 'Nova@example.com',
        firstName: 'Nova',
        lastName: 'User',
        sex: 'F',
      },
      {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        size: jpeg.length,
      } as Express.Multer.File,
      'admin-id',
    );

    expect(tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      tenant.id,
      `${userId}.jpg`,
      jpeg,
    );
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 33,
        email: 'nova@example.com',
        firstName: 'Nova',
        lastName: 'User',
        photoUrl: `${userId}.jpg`,
        sex: 'F',
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      'user_updated',
      expect.objectContaining({ userId, tenantId: tenant.id }),
    );
  });

  it('returns an API-served photo URL for an uploaded pointer', async () => {
    const { service, users } = createService();
    users.findOne.mockResolvedValue(
      Object.assign(new User(), {
        age: 32,
        email: 'nova@example.com',
        firstName: 'Nova',
        id: userId,
        lastName: 'User',
        photoUrl: `${userId}.jpg`,
        profile: 'Usuario',
        sex: 'F',
        tenantId: tenant.id,
      }),
    );

    await expect(service.findPublicProfile(userId)).resolves.toEqual(
      expect.objectContaining({
        enabledActions: [],
        photoUrl: `/api/v1/users/${userId}/photo`,
      }),
    );
  });

  it('stores enabledActions on create and rejects unknown values', async () => {
    const { service, users } = createService();

    await service.create(
      {
        ...dto,
        enabledActions: ['painel', 'createUser', 'createTenant'],
      },
      undefined,
      actorId,
    );

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        enabledActions: ['painel', 'createUser', 'createTenant'],
      }),
    );
    await expect(
      service.create(
        {
          ...dto,
          enabledActions: ['powerbi'],
        },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
  });

  it('lets the last Administrador persist enabledActions on themselves', async () => {
    const { service, users } = createService();
    const admin = Object.assign(new User(), {
      enabledActions: [],
      id: userId,
      profile: 'Administrador',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockResolvedValue(admin);

    await service.update(
      userId,
      { enabledActions: ['editUser'] },
      undefined,
      userId,
    );

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        enabledActions: ['editUser'],
        id: userId,
      }),
    );
  });

  it('lets a Usuario with editUser update their own registration', async () => {
    const { service, users } = createService();
    const actor = Object.assign(new User(), {
      age: 20,
      email: 'old@example.com',
      enabledActions: ['editUser'],
      firstName: 'Old',
      id: userId,
      lastName: 'Name',
      profile: 'Usuario',
      sex: 'O',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockResolvedValue(actor);

    await service.update(
      userId,
      {
        age: 33,
        email: 'Nova@example.com',
        firstName: 'Nova',
        lastName: 'User',
        sex: 'F',
      },
      undefined,
      userId,
    );

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nova@example.com',
        firstName: 'Nova',
      }),
    );
  });

  it('rejects a Usuario writing enabledActions', async () => {
    const { service, users } = createService();
    const target = Object.assign(new User(), {
      enabledActions: [],
      id: userId,
      profile: 'Usuario',
      status: 'active',
      tenantId: tenant.id,
    });
    const actor = Object.assign(new User(), {
      enabledActions: ['editUser'],
      id: 'other-id',
      profile: 'Usuario',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === userId) {
        return Promise.resolve(target);
      }
      if (where.id === 'other-id') {
        return Promise.resolve(actor);
      }
      return Promise.resolve(null);
    });

    await expect(
      service.update(
        userId,
        { enabledActions: ['createUser'] },
        undefined,
        'other-id',
      ),
    ).rejects.toThrow('Access denied.');
  });

  it('lets AdministradorTenant create users on their tenant and rejects another tenant', async () => {
    const { service, users } = createService();
    const tenantAdmin = Object.assign(new User(), {
      enabledActions: [],
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockResolvedValue(tenantAdmin);

    await service.create(dto, undefined, actorId);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: 'Usuario',
        tenantId: tenant.id,
      }),
    );

    await expect(
      service.create(
        { ...dto, tenantId: '33333333-3333-4333-8333-333333333333' },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
    expect(users.save).toHaveBeenCalledTimes(1);
  });

  it('rejects AdministradorTenant writing profile and lets them list only their tenant', async () => {
    const { service, users } = createService();
    const tenantAdmin = Object.assign(new User(), {
      enabledActions: [],
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    const teammate = Object.assign(new User(), {
      enabledActions: [],
      id: userId,
      profile: 'Usuario',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(tenantAdmin);
      }

      if (where.id === userId) {
        return Promise.resolve(teammate);
      }

      return Promise.resolve(null);
    });
    users.find.mockResolvedValue([teammate, tenantAdmin]);

    await expect(
      service.update(
        userId,
        { profile: 'AdministradorTenant' },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Access denied.');
    await expect(
      service.update(userId, { profile: 'Administrador' }, undefined, actorId),
    ).rejects.toThrow('Access denied.');

    await expect(service.listForActor(actorId)).resolves.toEqual([
      expect.objectContaining({ id: userId, tenantId: tenant.id }),
      expect.objectContaining({ id: actorId, tenantId: tenant.id }),
    ]);
    expect(users.find).toHaveBeenCalledWith({
      order: { email: 'ASC' },
      where: { tenantId: tenant.id },
    });
  });

  it('lets Administrador assign AdministradorTenant on create and demote on update', async () => {
    const { service, users } = createService();

    await service.create(
      { ...dto, profile: 'AdministradorTenant' },
      undefined,
      actorId,
    );
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'AdministradorTenant' }),
    );

    users.save.mockClear();
    await service.create(
      { ...dto, profile: 'Administrador' },
      undefined,
      actorId,
    );
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'Administrador' }),
    );

    const target = Object.assign(new User(), {
      enabledActions: [],
      id: userId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Administrador',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      return Promise.resolve(target);
    });

    await service.update(userId, { profile: 'Usuario' }, undefined, actorId);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'Usuario', id: userId }),
    );

    await service.update(
      userId,
      { profile: 'Administrador' },
      undefined,
      actorId,
    );
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'Administrador', id: userId }),
    );

    target.profile = 'Administrador';
    await expect(
      service.update(userId, { profile: 'Usuario' }, undefined, actorId),
    ).rejects.toThrow('Access denied.');
    await expect(
      service.update(
        userId,
        { profile: 'AdministradorTenant' },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Access denied.');
  });

  it('lists only Projetos-capable users for a Usuario with viewProjects', async () => {
    const { service, users } = createService();
    const viewer = Object.assign(new User(), {
      email: 'ana@example.com',
      enabledActions: ['viewProjects'],
      firstName: 'Ana',
      id: actorId,
      lastName: 'Silva',
      profile: 'Usuario',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockResolvedValue(viewer);
    users.find.mockResolvedValue([
      viewer,
      Object.assign(new User(), {
        email: 'plain@example.com',
        enabledActions: [],
        firstName: 'Plain',
        id: 'plain-id',
        lastName: 'User',
        profile: 'Usuario',
        tenantId: tenant.id,
      }),
      Object.assign(new User(), {
        email: 'lead@example.com',
        enabledActions: [],
        firstName: 'Lead',
        id: 'tenant-admin-id',
        lastName: 'User',
        profile: 'AdministradorTenant',
        tenantId: tenant.id,
      }),
    ]);

    await expect(service.listForActor(actorId)).resolves.toEqual([
      expect.objectContaining({ id: actorId }),
      expect.objectContaining({ id: 'tenant-admin-id' }),
    ]);
  });

  it('rejects AdministradorTenant editing an Administrador on the same tenant', async () => {
    const { service, users } = createService();
    const tenantAdmin = Object.assign(new User(), {
      enabledActions: [],
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    const globalAdmin = Object.assign(new User(), {
      enabledActions: [],
      id: userId,
      profile: 'Administrador',
      status: 'active',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(tenantAdmin);
      }

      if (where.id === userId) {
        return Promise.resolve(globalAdmin);
      }

      return Promise.resolve(null);
    });

    await expect(
      service.update(userId, { firstName: 'Nope' }, undefined, actorId),
    ).rejects.toThrow('Access denied.');
  });

  it('reactivates a blocked user for Administrador and rejects Usuario and another tenant', async () => {
    const { audit, service, users } = createService();
    const blocked = Object.assign(new User(), {
      id: userId,
      profile: 'Usuario',
      status: 'blocked',
      tenantId: tenant.id,
    });
    const otherTenant = Object.assign(new User(), {
      id: userId,
      profile: 'Usuario',
      status: 'blocked',
      tenantId: '33333333-3333-4333-8333-333333333333',
    });

    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Administrador',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      if (where.id === userId) {
        return Promise.resolve(blocked);
      }

      return Promise.resolve(null);
    });

    await expect(service.reactivate(userId, actorId)).resolves.toBeUndefined();
    expect(blocked.status).toBe('active');
    expect(audit.record).toHaveBeenCalledWith(
      'user_reactivated',
      expect.objectContaining({ tenantId: tenant.id, userId }),
    );

    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Usuario',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      return Promise.resolve(blocked);
    });
    await expect(service.reactivate(userId, actorId)).rejects.toThrow(
      'Access denied.',
    );

    const sameTenantBlocked = Object.assign(new User(), {
      id: userId,
      profile: 'Usuario',
      status: 'blocked',
      tenantId: tenant.id,
    });
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'AdministradorTenant',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      if (where.id === userId) {
        return Promise.resolve(sameTenantBlocked);
      }

      return Promise.resolve(null);
    });
    await expect(service.reactivate(userId, actorId)).resolves.toBeUndefined();
    expect(sameTenantBlocked.status).toBe('active');

    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'AdministradorTenant',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      if (where.id === userId) {
        return Promise.resolve(otherTenant);
      }

      return Promise.resolve(null);
    });
    await expect(service.reactivate(userId, actorId)).rejects.toThrow(
      'Access denied.',
    );

    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Administrador',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      return Promise.resolve(null);
    });
    await expect(service.reactivate(userId, actorId)).rejects.toThrow(
      'Not found.',
    );

    blocked.status = 'active';
    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Administrador',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      return Promise.resolve(blocked);
    });
    await expect(service.reactivate(userId, actorId)).rejects.toThrow(
      'Invalid input.',
    );
  });

  it('keeps the reactivated user active when the audit record fails', async () => {
    const { audit, service, users } = createService();
    const blocked = Object.assign(new User(), {
      id: userId,
      profile: 'Usuario',
      status: 'blocked',
      tenantId: tenant.id,
    });

    users.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === actorId) {
        return Promise.resolve(
          Object.assign(new User(), {
            id: actorId,
            profile: 'Administrador',
            status: 'active',
            tenantId: tenant.id,
          }),
        );
      }

      if (where.id === userId) {
        return Promise.resolve(blocked);
      }

      return Promise.resolve(null);
    });
    audit.record.mockRejectedValue(new Error('audit down'));

    await expect(service.reactivate(userId, actorId)).resolves.toBeUndefined();
    expect(blocked.status).toBe('active');
    expect(users.save).toHaveBeenCalledWith(blocked);
  });

  const otherTenant = Object.assign(new Tenant(), {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'North',
    slug: 'north',
  });

  const registration = {
    age: 33,
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Silva',
    sex: 'F' as const,
  };

  function targetUser(photoUrl = '/brand/symbol-vetor.png') {
    return Object.assign(new User(), {
      age: 32,
      email: 'ana@example.com',
      enabledActions: ['editUser'],
      firstName: 'Ana',
      id: userId,
      lastName: 'Silva',
      passwordHash: 'kept-hash',
      photoUrl,
      profile: 'Usuario',
      sex: 'F',
      status: 'active',
      tenantId: tenant.id,
    });
  }

  function asGlobalAdmin(
    context: ReturnType<typeof createService>,
    target: User,
  ) {
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'Administrador',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        if (where.id === target.id) {
          return Promise.resolve(target);
        }

        return Promise.resolve(null);
      },
    );
    context.tenants.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === tenant.id) {
          return Promise.resolve(tenant);
        }

        if (where.id === otherTenant.id) {
          return Promise.resolve(otherTenant);
        }

        return Promise.resolve(null);
      },
    );
  }

  it('lets an Administrador change the home tenant without touching access fields', async () => {
    const context = createService();
    const target = targetUser();
    asGlobalAdmin(context, target);

    await context.service.update(
      userId,
      { ...registration, tenantId: otherTenant.id },
      undefined,
      actorId,
    );

    expect(context.users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        enabledActions: ['editUser'],
        passwordHash: 'kept-hash',
        profile: 'Usuario',
        status: 'active',
        tenantId: otherTenant.id,
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith('user_updated', {
      metadata: { previousTenantId: tenant.id },
      tenantId: otherTenant.id,
      userId,
    });

    context.users.save.mockClear();
    await context.service.update(
      userId,
      { ...registration, firstName: 'Ana Maria', tenantId: otherTenant.id },
      undefined,
      actorId,
    );
    expect(context.users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ana Maria',
        tenantId: otherTenant.id,
      }),
    );
  });

  it('rejects tenantId from AdministradorTenant and from a Usuario', async () => {
    const context = createService();
    const target = targetUser();
    const tenantAdmin = Object.assign(new User(), {
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(tenantAdmin);
        }

        if (where.id === userId) {
          return Promise.resolve(target);
        }

        return Promise.resolve(null);
      },
    );

    await expect(
      context.service.update(
        userId,
        { ...registration, tenantId: tenant.id },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Access denied.');

    const self = targetUser();
    self.enabledActions = ['editUser'];
    context.users.findOne.mockResolvedValue(self);

    await expect(
      context.service.update(
        userId,
        { ...registration, tenantId: tenant.id },
        undefined,
        userId,
      ),
    ).rejects.toThrow('Access denied.');
    expect(context.users.save).not.toHaveBeenCalled();
  });

  it('rejects an unknown tenant and a duplicate email without keeping the new tenant', async () => {
    const context = createService();
    const target = targetUser(`${userId}.jpg`);
    asGlobalAdmin(context, target);
    context.tenantStorage.readUserPhoto.mockResolvedValue(jpeg);

    await expect(
      context.service.update(
        userId,
        {
          ...registration,
          tenantId: '44444444-4444-4444-8444-444444444444',
        },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.tenantStorage.writeUserPhoto).not.toHaveBeenCalled();

    const duplicate = new QueryFailedError(
      'UPDATE',
      [],
      new Error('duplicate'),
    );
    Object.assign(duplicate, { code: '23505' });
    context.users.save.mockRejectedValueOnce(duplicate);

    await expect(
      context.service.update(
        userId,
        { ...registration, tenantId: otherTenant.id },
        undefined,
        actorId,
      ),
    ).rejects.toThrow('Invalid input.');
    expect(target.tenantId).toBe(tenant.id);
    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      otherTenant.id,
      `${userId}.jpg`,
      'photo',
    );
    expect(context.tenantStorage.deleteTenantFile).not.toHaveBeenCalledWith(
      tenant.id,
      `${userId}.jpg`,
      'photo',
    );
  });

  it('moves an uploaded photo to the destination tenant and leaves a brand path in place', async () => {
    const context = createService();
    const pointer = `${userId}.jpg`;
    const target = targetUser(pointer);
    asGlobalAdmin(context, target);
    context.tenantStorage.readUserPhoto.mockResolvedValue(jpeg);

    await context.service.update(
      userId,
      { ...registration, tenantId: otherTenant.id },
      undefined,
      actorId,
    );

    expect(context.tenantStorage.readUserPhoto).toHaveBeenCalledWith(
      tenant.id,
      pointer,
    );
    expect(context.tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      otherTenant.id,
      pointer,
      jpeg,
    );
    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      tenant.id,
      pointer,
      'photo',
    );

    const branded = targetUser('/brand/symbol-vetor.png');
    branded.tenantId = tenant.id;
    asGlobalAdmin(context, branded);
    context.tenantStorage.readUserPhoto.mockClear();
    context.tenantStorage.writeUserPhoto.mockClear();
    context.tenantStorage.deleteTenantFile.mockClear();

    await context.service.update(
      userId,
      { ...registration, tenantId: otherTenant.id },
      undefined,
      actorId,
    );

    expect(context.tenantStorage.readUserPhoto).not.toHaveBeenCalled();
    expect(context.tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
    expect(context.tenantStorage.deleteTenantFile).not.toHaveBeenCalled();
    expect(branded.photoUrl).toBe('/brand/symbol-vetor.png');
  });

  it('writes a photo sent with the tenant change only on the destination tenant', async () => {
    const context = createService();
    const pointer = `${userId}.jpg`;
    const target = targetUser(pointer);
    asGlobalAdmin(context, target);

    await context.service.update(
      userId,
      { ...registration, tenantId: otherTenant.id },
      {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        size: jpeg.length,
      } as Express.Multer.File,
      actorId,
    );

    expect(context.tenantStorage.readUserPhoto).not.toHaveBeenCalled();
    expect(context.tenantStorage.writeUserPhoto).toHaveBeenCalledTimes(1);
    expect(context.tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      otherTenant.id,
      pointer,
      jpeg,
    );
    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      tenant.id,
      pointer,
      'photo',
    );
  });

  it('saves a tenant change when the photo file is missing', async () => {
    const context = createService();
    const pointer = `${userId}.png`;
    const target = targetUser(pointer);
    asGlobalAdmin(context, target);
    context.tenantStorage.readUserPhoto.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );

    await expect(
      context.service.update(
        userId,
        {
          ...registration,
          profile: 'AdministradorTenant',
          tenantId: otherTenant.id,
        },
        undefined,
        actorId,
      ),
    ).resolves.toBeUndefined();

    expect(context.users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrl: pointer,
        profile: 'AdministradorTenant',
        tenantId: otherTenant.id,
      }),
    );
    expect(context.tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
    expect(context.tenantStorage.deleteTenantFile).not.toHaveBeenCalled();
  });

  it('lets an Administrador delete another user and reassign card assignees', async () => {
    const context = createService();
    const target = targetUser();
    asGlobalAdmin(context, target);
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'Administrador',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        if (where.id === userId) {
          return Promise.resolve(target);
        }

        return Promise.resolve(null);
      },
    );

    await expect(
      context.service.delete(userId, actorId),
    ).resolves.toBeUndefined();

    expect(context.transactionManager.query).toHaveBeenCalledWith(
      `UPDATE "cards" SET "assignee_user_id" = $1 WHERE "assignee_user_id" = $2`,
      [actorId, userId],
    );
    expect(context.transactionManager.remove).toHaveBeenCalledWith(
      User,
      target,
    );
    expect(context.audit.record).toHaveBeenCalledWith('user_deleted', {
      metadata: { deletedUserId: userId },
      tenantId: tenant.id,
      userId: actorId,
    });
  });

  it('rejects deleting a user who opened or commented on a ticket', async () => {
    const context = createService();
    const target = targetUser();
    asGlobalAdmin(context, target);
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'Administrador',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        if (where.id === userId) {
          return Promise.resolve(target);
        }

        return Promise.resolve(null);
      },
    );
    const error = new QueryFailedError('DELETE', [], new Error('fk'));
    Object.assign(error, { code: '23503' });
    context.transactionManager.remove.mockRejectedValue(error);

    await expect(context.service.delete(userId, actorId)).rejects.toThrow(
      'Invalid input.',
    );
    expect(context.audit.record).not.toHaveBeenCalled();
  });

  it('rejects user deletion from non-Administrador profiles and self-delete', async () => {
    const context = createService();
    const target = targetUser();
    const tenantAdmin = Object.assign(new User(), {
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(tenantAdmin);
        }

        if (where.id === userId) {
          return Promise.resolve(target);
        }

        return Promise.resolve(null);
      },
    );

    await expect(context.service.delete(userId, actorId)).rejects.toThrow(
      'Access denied.',
    );

    asGlobalAdmin(context, target);
    await expect(context.service.delete(actorId, actorId)).rejects.toThrow(
      'Invalid input.',
    );
  });

  it('does not read the photo when a profile change keeps the home tenant', async () => {
    const context = createService();
    const target = targetUser(`${userId}.png`);
    asGlobalAdmin(context, target);

    await context.service.update(
      userId,
      { enabledActions: ['editUser'], profile: 'AdministradorTenant' },
      undefined,
      actorId,
    );

    expect(context.tenantStorage.readUserPhoto).not.toHaveBeenCalled();
    expect(context.users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: 'AdministradorTenant',
        tenantId: tenant.id,
      }),
    );
  });

  it('emails a 30-minute reset link and invalidates older unused tokens', async () => {
    const context = createService();
    const target = targetUser();
    asGlobalAdmin(context, target);
    const errorLog = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const before = Date.now();

    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).resolves.toBeUndefined();

    const saved = context.resetTokens.create.mock.calls[0][0] as {
      expiresAt: Date;
      tokenHash: string;
      usedAt: Date | null;
      userId: string;
    };
    const changeUrl = context.mail.sendPasswordResetLink.mock
      .calls[0][1] as string;
    const rawToken = new URL(changeUrl).searchParams.get('token') ?? '';

    expect(context.mail.sendPasswordResetLink).toHaveBeenCalledWith(
      'ana@example.com',
      expect.stringMatching(
        /^http:\/\/localhost:3000\/portal\/change-password\?token=[a-f0-9]{64}$/,
      ),
    );
    expect(saved.userId).toBe(userId);
    expect(saved.usedAt).toBeNull();
    expect(saved.tokenHash).toBe(
      createHash('sha256').update(rawToken).digest('hex'),
    );
    expect(saved.tokenHash).not.toBe(rawToken);
    expect(saved.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 30 * 60 * 1000 - 1000,
    );
    expect(saved.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 30 * 60 * 1000,
    );
    expect(context.resetTokens.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
      expect.objectContaining({ usedAt: expect.any(Date) }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      'password_reset_link_requested',
      {
        metadata: { targetUserId: userId },
        tenantId: tenant.id,
        userId: actorId,
      },
    );
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain(rawToken);
    errorLog.mockRestore();
  });

  it('lets Administrador and AdministradorTenant reset their own active account', async () => {
    const context = createService();
    const self = Object.assign(new User(), {
      email: 'admin@example.com',
      id: actorId,
      profile: 'Administrador',
      status: 'active',
      tenantId: tenant.id,
    });
    context.users.findOne.mockResolvedValue(self);

    await expect(
      context.service.sendPasswordResetLink(actorId, actorId),
    ).resolves.toBeUndefined();
    expect(context.mail.sendPasswordResetLink).toHaveBeenCalledWith(
      'admin@example.com',
      expect.stringContaining('/portal/change-password?token='),
    );

    const tenantAdmin = Object.assign(new User(), {
      email: 'lead@example.com',
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    context.users.findOne.mockResolvedValue(tenantAdmin);
    context.mail.sendPasswordResetLink.mockClear();

    await expect(
      context.service.sendPasswordResetLink(actorId, actorId),
    ).resolves.toBeUndefined();
    expect(context.mail.sendPasswordResetLink).toHaveBeenCalledWith(
      'lead@example.com',
      expect.any(String),
    );
  });

  it('lets AdministradorTenant reset an Administrador on the same tenant', async () => {
    const context = createService();
    const tenantAdmin = Object.assign(new User(), {
      id: actorId,
      profile: 'AdministradorTenant',
      status: 'active',
      tenantId: tenant.id,
    });
    const globalAdmin = targetUser();
    globalAdmin.profile = 'Administrador';
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(tenantAdmin);
        }

        if (where.id === userId) {
          return Promise.resolve(globalAdmin);
        }

        return Promise.resolve(null);
      },
    );

    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).resolves.toBeUndefined();
    expect(context.mail.sendPasswordResetLink).toHaveBeenCalledWith(
      'ana@example.com',
      expect.any(String),
    );
  });

  it('rejects a blocked target, Usuario, another tenant, and a missing user', async () => {
    const context = createService();
    const blocked = targetUser();
    blocked.status = 'blocked';
    asGlobalAdmin(context, blocked);

    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).rejects.toThrow('Invalid input.');
    expect(context.mail.sendPasswordResetLink).not.toHaveBeenCalled();
    expect(context.resetTokens.save).not.toHaveBeenCalled();

    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'Usuario',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        return Promise.resolve(targetUser());
      },
    );
    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).rejects.toThrow('Access denied.');

    const otherTenant = targetUser();
    otherTenant.tenantId = '33333333-3333-4333-8333-333333333333';
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'AdministradorTenant',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        if (where.id === userId) {
          return Promise.resolve(otherTenant);
        }

        return Promise.resolve(null);
      },
    );
    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).rejects.toThrow('Access denied.');

    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === actorId) {
          return Promise.resolve(
            Object.assign(new User(), {
              id: actorId,
              profile: 'Administrador',
              status: 'active',
              tenantId: tenant.id,
            }),
          );
        }

        return Promise.resolve(null);
      },
    );
    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).rejects.toThrow('Not found.');
    expect(context.mail.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('marks the new token used when the reset email fails', async () => {
    const context = createService();
    asGlobalAdmin(context, targetUser());
    context.mail.sendPasswordResetLink.mockRejectedValue(new Error('smtp'));
    const errorLog = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      context.service.sendPasswordResetLink(userId, actorId),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    const saved = context.resetTokens.save.mock.calls.at(-1)?.[0] as {
      usedAt: Date | null;
    };
    expect(saved.usedAt).toBeInstanceOf(Date);
    expect(context.audit.record).not.toHaveBeenCalled();
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain('token=');
    errorLog.mockRestore();
  });
});
