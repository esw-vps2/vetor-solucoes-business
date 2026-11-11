import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { User } from './entities/user.entity.js';

describe('AdministradorGuard', () => {
  it('rejects an unauthenticated caller', async () => {
    const guard = new AdministradorGuard({
      findOne: vi.fn(),
    } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => ({}) }),
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('loads the profile from the database and rejects a non-administrator', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          id: 'user-id',
          profile: 'Usuario',
          status: 'active',
        }),
      ),
    };
    const guard = new AdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-id', profile: 'Administrador' },
          }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an active Administrador loaded from the database', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          id: 'admin-id',
          profile: 'Administrador',
          status: 'active',
        }),
      ),
    };
    const guard = new AdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'admin-id', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).resolves.toBe(true);
  });

  it('rejects Usuario even when createTenant is stored', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          enabledActions: ['createTenant'],
          id: 'user-id',
          profile: 'Usuario',
          status: 'active',
        }),
      ),
    };
    const guard = new AdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-id', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects AdministradorTenant on Power BI admin routes', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          id: 'tenant-admin',
          profile: 'AdministradorTenant',
          status: 'active',
        }),
      ),
    };
    const guard = new AdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'tenant-admin', profile: 'AdministradorTenant' },
          }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
