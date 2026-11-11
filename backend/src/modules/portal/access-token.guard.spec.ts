import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard.js';

describe('AccessTokenGuard', () => {
  function createGuard(user: { id: string; status: string } | null) {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({
        profile: 'Usuario',
        sessionId: 'session-id',
        sub: 'user-id',
        tenantId: 'tenant-id',
        type: 'access',
      }),
    };
    const config = {
      getOrThrow: vi.fn().mockReturnValue('secret'),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue(user),
    };
    const guard = new AccessTokenGuard(jwt as never, config as never, users as never);
    const request = {
      cookies: { access_token: 'token' },
      user: undefined,
    };

    return {
      canActivate: () =>
        guard.canActivate({
          switchToHttp: () => ({
            getRequest: () => request,
          }),
        } as never),
      request,
      users,
    };
  }

  it('accepts an active user', async () => {
    const context = createGuard({ id: 'user-id', status: 'active' });

    await expect(context.canActivate()).resolves.toBe(true);
    expect(context.users.findOne).toHaveBeenCalledWith({
      where: { id: 'user-id', status: 'active' },
    });
    expect(context.request.user).toEqual(
      expect.objectContaining({ id: 'user-id' }),
    );
  });

  it('rejects a blocked user who still holds an access cookie', async () => {
    const context = createGuard(null);

    await expect(context.canActivate()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
