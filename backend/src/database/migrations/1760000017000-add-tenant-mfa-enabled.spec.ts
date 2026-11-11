import { AddTenantMfaEnabled1760000017000 } from './1760000017000-add-tenant-mfa-enabled.js';

describe('AddTenantMfaEnabled1760000017000', () => {
  it('stores false for every existing tenant, including vetor', async () => {
    const queryRunner = { query: vi.fn().mockResolvedValue(undefined) };

    await new AddTenantMfaEnabled1760000017000().up(queryRunner as never);

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('"mfa_enabled" boolean NOT NULL DEFAULT false'),
    );
  });
});
