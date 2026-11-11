import { MoveCardsGuard } from './move-cards.guard.js';

describe('MoveCardsGuard', () => {
  it('allows implied moveCards and rejects Usuario without it', async () => {
    const tenantAdmin = new MoveCardsGuard({
      findOne: vi.fn().mockResolvedValue({
        enabledActions: [],
        profile: 'AdministradorTenant',
      }),
    } as never);
    const usuario = new MoveCardsGuard({
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
      usuario.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id' } }),
        }),
      } as never),
    ).rejects.toThrow('Access denied.');
  });
});
