import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TenantsService } from './tenants.service.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';

const acme = Object.assign(new Tenant(), {
  aiTokenCostPerMillion: '0.6',
  id: '1',
  name: 'Acme',
  slug: 'acme',
});
const vetor = Object.assign(new Tenant(), {
  aiTokenCostPerMillion: '0.6',
  id: '2',
  name: 'VETOR',
  slug: 'vetor',
});

const createdId = '33333333-3333-4333-8333-333333333333';

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function photoFile(
  buffer: Buffer = pngSignature,
  size = buffer.length,
): Express.Multer.File {
  return { buffer, size } as Express.Multer.File;
}

function uniqueViolation(): QueryFailedError {
  const error = new QueryFailedError('INSERT', [], new Error('duplicate'));
  (error as QueryFailedError & { code: string }).code = '23505';
  return error;
}

describe('TenantsService', () => {
  function createService(
    overrides: {
      tenants?: Record<string, unknown>;
      users?: Record<string, unknown>;
      tenantStorage?: {
        deleteTenantFile?: ReturnType<typeof vi.fn>;
        ensureTenantFolder?: ReturnType<typeof vi.fn>;
        readUserPhoto?: ReturnType<typeof vi.fn>;
        writeUserPhoto?: ReturnType<typeof vi.fn>;
      };
    } = {},
  ) {
    const tenantStorage = {
      deleteTenantFile: vi.fn().mockResolvedValue(undefined),
      ensureTenantFolder: vi.fn().mockResolvedValue(`/tmp/${createdId}`),
      readUserPhoto: vi.fn().mockResolvedValue(Buffer.from('img')),
      writeUserPhoto: vi.fn().mockResolvedValue(undefined),
      ...overrides.tenantStorage,
    };
    const tenants = {
      create: vi.fn((value: unknown) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(),
      ...overrides.tenants,
    };
    const users = {
      findOne: vi.fn(),
      save: vi.fn(),
      ...overrides.users,
    };
    const audit = {
      record: vi.fn().mockResolvedValue(undefined),
    };
    const service = new TenantsService(
      tenants as never,
      users as never,
      tenantStorage as never,
      audit as never,
    );

    return { audit, service, tenantStorage, tenants, users };
  }

  it('returns every tenant id, name, and slug', async () => {
    const { service, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([acme, vetor]),
      },
    });

    await expect(service.listAll()).resolves.toEqual([
      { id: '1', name: 'Acme', slug: 'acme' },
      { id: '2', name: 'VETOR', slug: 'vetor' },
    ]);
    expect(tenants.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('lists every tenant MFA setting without dropping a tenant', async () => {
    const disabled = Object.assign(new Tenant(), acme, { mfaEnabled: false });
    const enabled = Object.assign(new Tenant(), vetor, { mfaEnabled: true });
    const { service, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([disabled, enabled]),
      },
    });

    await expect(service.listMfaSettings()).resolves.toEqual([
      { aiTokenCostPerMillion: 0.6, id: '1', mfaEnabled: false, name: 'Acme', slug: 'acme' },
      { aiTokenCostPerMillion: 0.6, id: '2', mfaEnabled: true, name: 'VETOR', slug: 'vetor' },
    ]);
    expect(tenants.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('persists a changed MFA flag and audits only that change', async () => {
    const tenant = Object.assign(new Tenant(), acme, { mfaEnabled: false });
    const { audit, service, tenants } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
        save: vi.fn(async (value: Tenant) => value),
      },
    });

    await expect(
      service.updateMfaEnabled('1', { mfaEnabled: true }, 'admin-id'),
    ).resolves.toEqual({
      aiTokenCostPerMillion: 0.6,
      id: '1',
      mfaEnabled: true,
      name: 'Acme',
      slug: 'acme',
    });
    expect(audit.record).toHaveBeenCalledWith('tenant_mfa_changed', {
      metadata: { next: true, previous: false },
      tenantId: '1',
      userId: 'admin-id',
    });

    audit.record.mockClear();
    await service.updateMfaEnabled('1', { mfaEnabled: true }, 'admin-id');
    expect(tenants.save).toHaveBeenCalledTimes(1);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('writes one token price onto every tenant', async () => {
    const first = Object.assign(new Tenant(), acme, {
      aiTokenCostPerMillion: '0.6000',
    });
    const second = Object.assign(new Tenant(), vetor, {
      aiTokenCostPerMillion: '1.2000',
    });
    const { audit, service, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([first, second]),
        save: vi.fn(async (rows: Tenant[]) => rows),
      },
    });

    await expect(service.updateSharedAiTokenPricing(0.8, 'admin-id')).resolves.toEqual({
      aiTokenCostPerMillion: 0.8,
    });
    expect(first.aiTokenCostPerMillion).toBe('0.8000');
    expect(second.aiTokenCostPerMillion).toBe('0.8000');
    expect(tenants.save).toHaveBeenCalledWith([first, second]);
    expect(audit.record).toHaveBeenCalledWith('ai_token_pricing_changed', {
      metadata: { next: 0.8, previous: 0.6 },
      userId: 'admin-id',
    });
  });

  it('does not write when every tenant already has that price', async () => {
    const first = Object.assign(new Tenant(), acme, {
      aiTokenCostPerMillion: '0.8000',
    });
    const second = Object.assign(new Tenant(), vetor, {
      aiTokenCostPerMillion: '0.8000',
    });
    const { audit, service, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([first, second]),
        save: vi.fn(),
      },
    });

    await expect(service.updateSharedAiTokenPricing(0.8, 'admin-id')).resolves.toEqual({
      aiTokenCostPerMillion: 0.8,
    });
    expect(tenants.save).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('copies the shared token price onto a new tenant', async () => {
    const { service, tenants } = createService({
      tenants: {
        find: vi.fn(async (options?: { where?: unknown }) => {
          if (options && 'where' in options) {
            return [];
          }

          return [Object.assign(new Tenant(), { aiTokenCostPerMillion: '1.2500' })];
        }),
        save: vi.fn().mockResolvedValue(
          Object.assign(new Tenant(), {
            email: null,
            id: createdId,
            name: 'Northwind',
            slug: 'northwind',
            status: 'active',
          }),
        ),
      },
    });

    await service.create({ name: 'Northwind', slug: 'northwind' });

    expect(tenants.create).toHaveBeenCalledWith(
      expect.objectContaining({ aiTokenCostPerMillion: '1.2500' }),
    );
  });

  it('rejects an unknown tenant without writing an audit row', async () => {
    const { audit, service } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.updateMfaEnabled('missing', { mfaEnabled: true }, 'admin-id'),
    ).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('scopes AdministradorTenant to their own tenant', async () => {
    const { service, tenants } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(acme),
      },
      users: {
        findOne: vi.fn().mockResolvedValue(
          Object.assign(new User(), {
            id: 'tenant-admin',
            profile: 'AdministradorTenant',
            status: 'active',
            tenantId: acme.id,
          }),
        ),
      },
    });

    await expect(service.listForActor('tenant-admin')).resolves.toEqual([
      { id: '1', name: 'Acme', slug: 'acme' },
    ]);
    expect(tenants.find).not.toHaveBeenCalled();
  });

  it('creates an active tenant, persists optional email, and makes the folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        save: vi.fn().mockResolvedValue(
          Object.assign(new Tenant(), {
            email: 'ops@example.com',
            id: createdId,
            name: 'Northwind',
            slug: 'northwind',
            status: 'active',
          }),
        ),
      },
    });

    await expect(
      service.create({
        email: 'ops@example.com',
        name: 'Northwind',
        slug: 'northwind',
      }),
    ).resolves.toEqual({
      email: 'ops@example.com',
      id: createdId,
      name: 'Northwind',
      slug: 'northwind',
    });
    expect(tenants.create).toHaveBeenCalledWith({
      aiTokenCostPerMillion: '0.6000',
      email: 'ops@example.com',
      mfaEnabled: false,
      name: 'Northwind',
      photoUrl: '',
      slug: 'northwind',
      status: 'active',
    });
    expect(tenantStorage.ensureTenantFolder).toHaveBeenCalledWith(createdId);
  });

  it('stores omitted email as null and still creates the folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        save: vi.fn().mockResolvedValue(
          Object.assign(new Tenant(), {
            email: null,
            id: createdId,
            name: 'Northwind',
            slug: 'northwind',
            status: 'active',
          }),
        ),
      },
    });

    await expect(
      service.create({ name: 'Northwind', slug: 'northwind' }),
    ).resolves.toEqual({
      email: null,
      id: createdId,
      name: 'Northwind',
      slug: 'northwind',
    });
    expect(tenants.find).toHaveBeenCalledWith({
      where: [{ name: 'Northwind' }, { slug: 'northwind' }],
    });
    expect(tenants.create).toHaveBeenCalledWith({
      aiTokenCostPerMillion: '0.6000',
      email: null,
      mfaEnabled: false,
      name: 'Northwind',
      photoUrl: '',
      slug: 'northwind',
      status: 'active',
    });
    expect(tenantStorage.ensureTenantFolder).toHaveBeenCalledWith(createdId);
  });

  it('does not insert a user when creating a tenant', async () => {
    const { service, users } = createService({
      tenants: {
        save: vi.fn().mockResolvedValue(
          Object.assign(new Tenant(), {
            email: null,
            id: createdId,
            name: 'Northwind',
            slug: 'northwind',
            status: 'active',
          }),
        ),
      },
    });

    await service.create({ name: 'Northwind', slug: 'northwind' });

    expect(users.findOne).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('allows a second tenant when both omit email', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(
        Object.assign(new Tenant(), {
          email: null,
          id: createdId,
          name: 'Northwind',
          slug: 'northwind',
          status: 'active',
        }),
      )
      .mockResolvedValueOnce(
        Object.assign(new Tenant(), {
          email: null,
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Contoso',
          slug: 'contoso',
          status: 'active',
        }),
      );
    const { service, tenants, tenantStorage } = createService({
      tenants: { save },
    });

    await service.create({ name: 'Northwind', slug: 'northwind' });
    await expect(
      service.create({ name: 'Contoso', slug: 'contoso' }),
    ).resolves.toEqual({
      email: null,
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Contoso',
      slug: 'contoso',
    });
    expect(tenants.find).toHaveBeenCalledWith({
      where: [{ name: 'Contoso' }, { slug: 'contoso' }],
    });
    expect(tenantStorage.ensureTenantFolder).toHaveBeenCalledTimes(2);
  });

  it('refuses a duplicate name without inserting or creating a folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([acme]),
      },
    });

    await expect(
      service.create({ name: 'Acme', slug: 'other' }, photoFile()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tenants.save).not.toHaveBeenCalled();
    expect(tenantStorage.ensureTenantFolder).not.toHaveBeenCalled();
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
  });

  it('refuses a duplicate slug without inserting or creating a folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        find: vi.fn().mockResolvedValue([acme]),
      },
    });

    await expect(
      service.create({ name: 'Other', slug: 'acme' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tenants.save).not.toHaveBeenCalled();
    expect(tenantStorage.ensureTenantFolder).not.toHaveBeenCalled();
  });

  it('refuses a duplicate email without inserting or creating a folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        find: vi
          .fn()
          .mockResolvedValue([
            Object.assign(new Tenant(), { ...acme, email: 'ops@example.com' }),
          ]),
      },
    });

    await expect(
      service.create({
        email: 'ops@example.com',
        name: 'Northwind',
        slug: 'northwind',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tenants.save).not.toHaveBeenCalled();
    expect(tenantStorage.ensureTenantFolder).not.toHaveBeenCalled();
  });

  it('maps a unique constraint race to 409 without creating a folder', async () => {
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        save: vi.fn().mockRejectedValue(uniqueViolation()),
      },
    });

    await expect(
      service.create({ name: 'Northwind', slug: 'northwind' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tenants.save).toHaveBeenCalled();
    expect(tenantStorage.ensureTenantFolder).not.toHaveBeenCalled();
  });

  it('stores a photo pointer and file when create includes an image', async () => {
    const save = vi
      .fn()
      .mockImplementation(async (value: Tenant) =>
        Object.assign(new Tenant(), value, { id: value.id ?? createdId }),
      );
    const { service, tenantStorage, tenants } = createService({
      tenants: { save },
    });

    await expect(
      service.create(
        { name: 'Northwind', slug: 'northwind' },
        photoFile(),
      ),
    ).resolves.toEqual({
      email: null,
      id: createdId,
      name: 'Northwind',
      slug: 'northwind',
    });
    expect(tenantStorage.writeUserPhoto).toHaveBeenCalledWith(
      createdId,
      `${createdId}.png`,
      pngSignature,
    );
    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({ photoUrl: `${createdId}.png` }),
    );
    expect(tenants.delete).not.toHaveBeenCalled();
  });

  it('rejects an invalid photo before inserting a tenant', async () => {
    const { service, tenantStorage, tenants } = createService();

    await expect(
      service.create(
        { name: 'Northwind', slug: 'northwind' },
        photoFile(Buffer.from('not-an-image')),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tenants.save).not.toHaveBeenCalled();
    expect(tenantStorage.ensureTenantFolder).not.toHaveBeenCalled();
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
  });

  it('replaces a tenant photo and deletes the previous file when the pointer changes', async () => {
    const tenant = Object.assign(new Tenant(), {
      ...acme,
      email: 'ops@example.com',
      id: createdId,
      photoUrl: `${createdId}.jpg`,
      status: 'active',
    });
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
        save: vi.fn().mockImplementation(async (value: Tenant) => value),
      },
    });

    await service.replacePhoto(createdId, photoFile());

    expect(tenants.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ops@example.com',
        name: 'Acme',
        photoUrl: `${createdId}.png`,
        slug: 'acme',
        status: 'active',
      }),
    );
    expect(tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      createdId,
      `${createdId}.jpg`,
      'photo',
    );
  });

  it('leaves the previous photo in place when the replacement is invalid or missing', async () => {
    const tenant = Object.assign(new Tenant(), {
      ...acme,
      id: createdId,
      photoUrl: `${createdId}.jpg`,
    });
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
      },
    });

    await expect(
      service.replacePhoto(createdId, photoFile(Buffer.from('not-an-image'))),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.replacePhoto(createdId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tenants.save).not.toHaveBeenCalled();
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
    expect(tenantStorage.deleteTenantFile).not.toHaveBeenCalled();
    expect(tenant.photoUrl).toBe(`${createdId}.jpg`);
  });

  it('returns 404 when replacing a photo for an unknown tenant', async () => {
    const { service, tenantStorage } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.replacePhoto(createdId, photoFile()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tenantStorage.writeUserPhoto).not.toHaveBeenCalled();
  });

  it('reads the photo only for the working tenant', async () => {
    const tenant = Object.assign(new Tenant(), {
      id: createdId,
      photoUrl: `${createdId}.png`,
    });
    const bytes = Buffer.from('img');
    const { service, tenantStorage } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
      },
      tenantStorage: {
        readUserPhoto: vi.fn().mockResolvedValue(bytes),
      },
    });

    await expect(
      service.readPhoto(createdId, {
        profile: 'Usuario',
        tenantId: createdId,
      }),
    ).resolves.toEqual({
      bytes,
      contentType: 'image/png',
    });
    expect(tenantStorage.readUserPhoto).toHaveBeenCalledWith(
      createdId,
      `${createdId}.png`,
    );
    await expect(
      service.readPhoto(createdId, {
        profile: 'Usuario',
        tenantId: '44444444-4444-4444-8444-444444444444',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets Administrador read another tenant photo', async () => {
    const tenant = Object.assign(new Tenant(), {
      id: createdId,
      photoUrl: `${createdId}.png`,
    });
    const bytes = Buffer.from('img');
    const { service } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
      },
      tenantStorage: {
        readUserPhoto: vi.fn().mockResolvedValue(bytes),
      },
    });

    await expect(
      service.readPhoto(createdId, {
        profile: 'Administrador',
        tenantId: '44444444-4444-4444-8444-444444444444',
      }),
    ).resolves.toEqual({
      bytes,
      contentType: 'image/png',
    });
  });

  it('returns 404 when the working tenant has no photo', async () => {
    const { service } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(
          Object.assign(new Tenant(), { id: createdId, photoUrl: '' }),
        ),
      },
    });

    await expect(
      service.readPhoto(createdId, {
        profile: 'Usuario',
        tenantId: createdId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a tenant photo and removes the stored file', async () => {
    const tenant = Object.assign(new Tenant(), {
      id: createdId,
      photoUrl: `${createdId}.png`,
    });
    const { service, tenantStorage, tenants } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(tenant),
        save: vi.fn().mockImplementation(async (value: Tenant) => value),
      },
    });

    await service.deletePhoto(createdId);

    expect(tenants.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: createdId, photoUrl: '' }),
    );
    expect(tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      createdId,
      `${createdId}.png`,
      'photo',
    );
  });

  it('returns 404 when deleting a photo for an unknown tenant', async () => {
    const { service, tenantStorage } = createService({
      tenants: {
        findOne: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(service.deletePhoto(createdId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tenantStorage.deleteTenantFile).not.toHaveBeenCalled();
  });
});
