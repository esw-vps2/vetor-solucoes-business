import { WorkspaceManagerGuard } from './workspace-manager.guard.js';

describe('WorkspaceManagerGuard', () => {
  it('allows Administrador and AdministradorTenant only', async () => {
    const admin = new WorkspaceManagerGuard({
      findOne: vi.fn().mockResolvedValue({ profile: 'Administrador' }),
    } as never);
    const tenantAdmin = new WorkspaceManagerGuard({
      findOne: vi.fn().mockResolvedValue({ profile: 'AdministradorTenant' }),
    } as never);
    const usuario = new WorkspaceManagerGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['manageProjects'],
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
      tenantAdmin.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'tenant-admin' } }),
        }),
      } as never),
    ).resolves.toBe(true);
    await expect(
      usuario.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');
  });
});
