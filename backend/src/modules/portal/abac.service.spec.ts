import { AbacService } from './abac.service.js';
import { User } from './entities/user.entity.js';

describe('AbacService', () => {
  const service = new AbacService();

  it('allows an administrator to access every tenant', () => {
    const user = Object.assign(new User(), {
      profile: 'Administrador',
      tenantId: 'tenant-a',
    });

    expect(
      service.canAccessResource(user, { tenantId: 'tenant-b' }, 'read'),
    ).toBe(true);
  });

  it('denies a tenant user outside its tenant', () => {
    const user = Object.assign(new User(), {
      profile: 'Usuario',
      tenantId: 'tenant-a',
    });

    expect(
      service.canAccessResource(user, { tenantId: 'tenant-b' }, 'write'),
    ).toBe(false);
  });

  it('uses deny by default for unsupported actions', () => {
    const user = Object.assign(new User(), {
      profile: 'Administrador',
      tenantId: 'tenant-a',
    });

    expect(
      service.canAccessResource(
        user,
        { tenantId: 'tenant-b' },
        'archive' as never,
      ),
    ).toBe(false);
  });
});
