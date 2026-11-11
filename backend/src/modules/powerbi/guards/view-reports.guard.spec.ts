import { ViewReportsGuard } from './view-reports.guard.js';

describe('ViewReportsGuard', () => {
  it('allows Administrador and a stored Relatórios grant', async () => {
    const admin = new ViewReportsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'Administrador',
      }),
    } as never);
    const usuario = new ViewReportsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['viewReports'],
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

  it('rejects a Usuario without Relatórios', async () => {
    const guard = new ViewReportsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: ['painel'],
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
