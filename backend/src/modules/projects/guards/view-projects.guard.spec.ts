import { ViewProjectsGuard } from './view-projects.guard.js';

describe('ViewProjectsGuard', () => {
  it('allows implied and stored viewProjects', async () => {
    const admin = new ViewProjectsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'Administrador',
      }),
    } as never);
    const usuario = new ViewProjectsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['viewProjects'],
        profile: 'Usuario',
      }),
    } as never);

    await expect(
      admin.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'admin-id' } }),
        }),
      } as never),
    ).resolves.toBe(true);
    await expect(
      usuario.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).resolves.toBe(true);
  });

  it('rejects a Usuario without viewProjects', async () => {
    const guard = new ViewProjectsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['manageProjects'],
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
