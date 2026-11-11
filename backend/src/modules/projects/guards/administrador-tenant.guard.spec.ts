import { AdministradorTenantGuard } from './administrador-tenant.guard.js';

describe('AdministradorTenantGuard', () => {
  it('allows AdministradorTenant and rejects Global and Usuario', async () => {
    const users = {
      findOne: vi.fn(),
    };
    const guard = new AdministradorTenantGuard(users as never);

    users.findOne.mockResolvedValue({
      id: 'tenant-admin',
      profile: 'AdministradorTenant',
      status: 'active',
    });
    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'tenant-admin' } }),
        }),
      } as never),
    ).resolves.toBe(true);

    users.findOne.mockResolvedValue({
      id: 'global',
      profile: 'Administrador',
      status: 'active',
    });
    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'global' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');

    users.findOne.mockResolvedValue({
      id: 'user',
      profile: 'Usuario',
      status: 'active',
    });
    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');
  });
});
