import { UsersListGuard } from './users-list.guard.js';

describe('UsersListGuard', () => {
  it('allows AdministradorTenant and Usuario with viewProjects', async () => {
    const tenantAdmin = new UsersListGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'AdministradorTenant',
      }),
    } as never);
    const viewer = new UsersListGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['viewProjects'],
        profile: 'Usuario',
      }),
    } as never);

    await expect(
      tenantAdmin.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'tenant-admin' } }),
        }),
      } as never),
    ).resolves.toBe(true);
    await expect(
      viewer.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).resolves.toBe(true);
  });

  it('rejects a Usuario without viewProjects', async () => {
    const guard = new UsersListGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['createUser'],
        profile: 'Usuario',
      }),
    } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');
  });
});
