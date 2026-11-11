import { toPublicPhotoUrl, toPublicTenantPhotoUrl } from './photo-url.js';

describe('toPublicPhotoUrl', () => {
  it('keeps the bootstrap brand photo', () => {
    expect(
      toPublicPhotoUrl(
        '11111111-1111-4111-8111-111111111111',
        '/brand/symbol-vetor.png',
      ),
    ).toBe('/brand/symbol-vetor.png');
  });

  it('exposes an uploaded file as an API URL, not a filesystem path', () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    expect(toPublicPhotoUrl(userId, `${userId}.jpg`)).toBe(
      `/api/v1/users/${userId}/photo`,
    );
    expect(toPublicPhotoUrl(userId, `${userId}.png`)).toBe(
      `/api/v1/users/${userId}/photo`,
    );
    expect(toPublicPhotoUrl(userId, `${userId}.jpg`)).not.toContain(
      'repository/files',
    );
  });

  it('does not expose a stored HTTP URL from the previous registration field', () => {
    expect(
      toPublicPhotoUrl(
        '11111111-1111-4111-8111-111111111111',
        'https://example.com/ana.png',
      ),
    ).toBe('');
  });
});

describe('toPublicTenantPhotoUrl', () => {
  const tenantId = '22222222-2222-4222-8222-222222222222';

  it('exposes a stored pointer as an API URL', () => {
    expect(toPublicTenantPhotoUrl(tenantId, `${tenantId}.png`)).toBe(
      `/api/v1/tenants/${tenantId}/photo`,
    );
    expect(toPublicTenantPhotoUrl(tenantId, `${tenantId}.png`)).not.toContain(
      'repository/files',
    );
  });

  it('stays empty when the tenant has no photo', () => {
    expect(toPublicTenantPhotoUrl(tenantId, '')).toBe('');
    expect(toPublicTenantPhotoUrl(tenantId, undefined)).toBe('');
  });
});
