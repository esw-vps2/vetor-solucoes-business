import { readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BootstrapAdminService } from './bootstrap-admin.service.js';
import { AbacService } from './abac.service.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('BootstrapAdminService', () => {
  const password = 'bootstrap-secret';
  const tenant = Object.assign(new Tenant(), {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'VETOR',
    slug: 'vetor',
    status: 'active',
  });

  function createService(options?: {
    existingTenant?: Tenant | null;
    existingUser?: User | null;
    nodeEnv?: string;
    password?: string;
  }) {
    const tenants = {
      create: vi.fn((value) => value),
      findOne: vi.fn().mockResolvedValue(options?.existingTenant ?? null),
      save: vi.fn(async (value) =>
        Object.assign(new Tenant(), {
          id: '11111111-1111-1111-1111-111111111111',
          ...value,
        }),
      ),
    };
    const users = {
      create: vi.fn((value) => value),
      findOne: vi.fn().mockResolvedValue(options?.existingUser ?? null),
      save: vi.fn(async (value) => value),
    };
    const values: Record<string, string | undefined> = {
      BOOTSTRAP_ADMIN_EMAIL: 'admin@vetor.tech',
      BOOTSTRAP_ADMIN_PASSWORD: options?.password ?? password,
      BOOTSTRAP_ADMIN_TENANT_NAME: 'VETOR',
      BOOTSTRAP_ADMIN_TENANT_SLUG: 'vetor',
      NODE_ENV: options?.nodeEnv ?? 'development',
    };
    const config = {
      get: vi.fn((key: string, fallback?: string) => values[key] ?? fallback),
    };
    const tenantStorage = {
      ensureExistingTenantFolders: vi.fn().mockResolvedValue(undefined),
      ensureTenantFolder: vi.fn().mockResolvedValue(undefined),
    };

    return {
      service: new BootstrapAdminService(
        tenants as never,
        users as never,
        config as never,
        tenantStorage as never,
      ),
      tenantStorage,
      tenants,
      users,
    };
  }

  beforeEach(() => {
    vi.mocked(bcrypt.hash).mockClear();
  });

  it('creates the missing tenant and Administrador user from environment values', async () => {
    const { service, tenants, tenantStorage, users } = createService();

    await service.ensure();

    expect(tenants.save).toHaveBeenCalledWith(
      expect.objectContaining({
        mfaEnabled: false,
        name: 'VETOR',
        slug: 'vetor',
        status: 'active',
      }),
    );
    expect(tenantStorage.ensureTenantFolder).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 40,
        cargo: '',
        email: 'admin@vetor.tech',
        firstName: 'Admin',
        lastName: 'Vetor',
        passwordHash: 'hashed-password',
        photoUrl: '/brand/symbol-vetor.png',
        profile: 'Administrador',
        sex: 'M',
        status: 'active',
        tenantId: '11111111-1111-1111-1111-111111111111',
      }),
    );
    expect(
      new AbacService().canAccessTenant(
        Object.assign(new User(), {
          profile: 'Administrador',
          tenantId: '11111111-1111-1111-1111-111111111111',
        }),
        'other-tenant',
      ),
    ).toBe(true);
  });

  it('does not create another user or change the password hash when the complete user exists', async () => {
    const existingUser = Object.assign(new User(), {
      age: 40,
      email: 'admin@vetor.tech',
      firstName: 'Admin',
      lastName: 'Vetor',
      passwordHash: 'existing-hash',
      photoUrl: '/brand/symbol-vetor.png',
      profile: 'Administrador',
      sex: 'M',
      tenantId: tenant.id,
    });
    const { service, tenants, users } = createService({
      existingTenant: tenant,
      existingUser,
    });

    await service.ensure();

    expect(tenants.save).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('fills missing profile fields on an existing administrator without changing the password', async () => {
    const existingUser = Object.assign(new User(), {
      email: 'admin@vetor.tech',
      firstName: '',
      lastName: '',
      passwordHash: 'existing-hash',
      profile: 'Administrador',
      tenantId: tenant.id,
    });
    const { service, users } = createService({
      existingTenant: tenant,
      existingUser,
    });

    await service.ensure();

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 40,
        firstName: 'Admin',
        lastName: 'Vetor',
        passwordHash: 'existing-hash',
        photoUrl: '/brand/symbol-vetor.png',
        sex: 'M',
      }),
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('seeds in production as well as development', async () => {
    const { service, users } = createService({ nodeEnv: 'production' });

    await service.ensure();

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@vetor.tech',
        profile: 'Administrador',
      }),
    );
  });

  it('does not log the bootstrap password', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const { service } = createService();

    await service.ensure();

    expect(log.mock.calls.flat().join(' ')).not.toContain(password);
    log.mockRestore();
  });

  it('does not hardcode the requested local bootstrap password in application source', () => {
    const source = readFileSync(
      new URL('./bootstrap-admin.service.ts', import.meta.url),
      'utf8',
    );

    expect(source).toContain('BOOTSTRAP_ADMIN_PASSWORD');
    expect(source).not.toContain(['god', '@2025'].join(''));
  });
});
