import { AdministradorOrCreateUserGuard } from './administrador-or-create-user.guard.js';

describe('AdministradorOrCreateUserGuard', () => {
  it('allows Administrador without stored createUser', async () => {
    const guard = new AdministradorOrCreateUserGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'Administrador',
      }),
    } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'admin-id' } }),
        }),
      } as never),
    ).resolves.toBe(true);
  });

  it('allows Usuario with createUser and rejects without it', async () => {
    const withGrant = new AdministradorOrCreateUserGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['createUser'],
        profile: 'Usuario',
      }),
    } as never);
    const withoutGrant = new AdministradorOrCreateUserGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'Usuario',
      }),
    } as never);

    await expect(
      withGrant.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).resolves.toBe(true);
    await expect(
      withoutGrant.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');
  });

  it('allows AdministradorTenant without stored createUser', async () => {
    const guard = new AdministradorOrCreateUserGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'AdministradorTenant',
      }),
    } as never);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'tenant-admin' } }),
        }),
      } as never),
    ).resolves.toBe(true);
  });
});
