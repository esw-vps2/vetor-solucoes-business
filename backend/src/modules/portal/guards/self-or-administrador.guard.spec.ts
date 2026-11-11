import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SelfOrAdministradorGuard } from './self-or-administrador.guard.js';
import { User } from '../entities/user.entity.js';

describe('SelfOrAdministradorGuard', () => {
  it('rejects an unauthenticated caller', async () => {
    const guard = new SelfOrAdministradorGuard({
      findOne: vi.fn(),
    } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ params: { id: 'other' } }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows the authenticated user to act on their own record', async () => {
    const findOne = vi.fn();
    const guard = new SelfOrAdministradorGuard({ findOne } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'user-id' },
            user: { id: 'user-id', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).resolves.toBe(true);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('allows AdministradorTenant to act on another user of the same tenant', async () => {
    const users = {
      findOne: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === 'tenant-admin') {
          return Promise.resolve(
            Object.assign(new User(), {
              id: 'tenant-admin',
              profile: 'AdministradorTenant',
              status: 'active',
              tenantId: 'tenant-id',
            }),
          );
        }

        return Promise.resolve(
          Object.assign(new User(), {
            id: 'other-id',
            profile: 'Usuario',
            tenantId: 'tenant-id',
          }),
        );
      }),
    };
    const guard = new SelfOrAdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'other-id' },
            user: { id: 'tenant-admin', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).resolves.toBe(true);
  });

  it('rejects a non-administrator editing another user', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          enabledActions: ['editUser'],
          id: 'user-id',
          profile: 'Usuario',
          status: 'active',
        }),
      ),
    };
    const guard = new SelfOrAdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'other-id' },
            user: { id: 'user-id', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an Administrador loaded from the database to edit another user', async () => {
    const users = {
      findOne: vi.fn().mockResolvedValue(
        Object.assign(new User(), {
          id: 'admin-id',
          profile: 'Administrador',
          status: 'active',
        }),
      ),
    };
    const guard = new SelfOrAdministradorGuard(users as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'other-id' },
            user: { id: 'admin-id', profile: 'Usuario' },
          }),
        }),
      } as never),
    ).resolves.toBe(true);
  });
});
