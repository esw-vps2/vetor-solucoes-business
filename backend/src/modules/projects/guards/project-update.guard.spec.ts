import { ProjectUpdateGuard } from './project-update.guard.js';

describe('ProjectUpdateGuard', () => {
  function activate(user: object | null) {
    const guard = new ProjectUpdateGuard({
      findOne: vi.fn().mockResolvedValue(user),
    } as never);

    return guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'user-id' } }),
      }),
    } as never);
  }

  it('allows a global administrator and a user granted a lane action', async () => {
    await expect(
      activate({
        enabledActions: [],
        profile: 'Administrador',
        status: 'active',
      }),
    ).resolves.toBe(true);
    await expect(
      activate({
        enabledActions: ['viewProjects', 'createLane'],
        profile: 'Usuario',
        status: 'active',
      }),
    ).resolves.toBe(true);
  });

  it('allows a tenant administrator through project update and rejects a user without a lane grant', async () => {
    await expect(
      activate({
        enabledActions: [],
        profile: 'AdministradorTenant',
        status: 'active',
      }),
    ).resolves.toBe(true);
    await expect(
      activate({
        enabledActions: ['viewProjects'],
        profile: 'Usuario',
        status: 'active',
      }),
    ).rejects.toThrow('Access denied.');
  });
});
