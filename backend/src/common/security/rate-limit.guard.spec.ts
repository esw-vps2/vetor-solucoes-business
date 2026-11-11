import 'reflect-metadata';
import { HttpException, type ExecutionContext } from '@nestjs/common';
import { UsersController } from '../../modules/portal/users.controller.js';
import { RATE_LIMIT_OPTIONS } from './rate-limit.decorator.js';
import { RateLimitGuard } from './rate-limit.guard.js';

function createGuard() {
  const config = {
    get: (key: string) =>
      key === 'AUTH_LOGIN_RATE_LIMIT_MAX' ? '1' : undefined,
  };
  const reflector = {
    getAllAndOverride: () => ({
      identifier: 'ip-and-body' as const,
      key: 'auth-mfa-verify',
      maxEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_MAX',
      windowEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_WINDOW',
    }),
  };

  return new RateLimitGuard(config as never, reflector as never);
}

function contextFor(
  body: Record<string, unknown>,
  ip = '10.0.0.8',
): ExecutionContext {
  return {
    getClass: () => class {},
    getHandler: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ body, ip }),
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  it('counts MFA attempts per challenge and ignores the token', () => {
    const guard = createGuard();

    expect(
      guard.canActivate(
        contextFor({
          challengeId: '11111111-1111-4111-8111-111111111111',
          token: '1111',
        }),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor({
          challengeId: '11111111-1111-4111-8111-111111111111',
          token: '2222',
        }),
      ),
    ).toThrow(HttpException);
    expect(
      guard.canActivate(
        contextFor({
          challengeId: '22222222-2222-4222-8222-222222222222',
          token: '1111',
        }),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor({
          challengeId: '22222222-2222-4222-8222-222222222222'.toUpperCase(),
          token: '3333',
        }),
      ),
    ).toThrow(HttpException);
  });

  it('counts login attempts per email', () => {
    const guard = createGuard();

    expect(
      guard.canActivate(
        contextFor({ email: 'Ana@example.com', password: 'one' }),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor({ email: 'ana@example.com', password: 'two' }),
      ),
    ).toThrow(HttpException);
    expect(
      guard.canActivate(
        contextFor({ email: 'bia@example.com', password: 'one' }),
      ),
    ).toBe(true);
  });

  it('returns 429 for repeated password-reset link requests from one ip', () => {
    const options = Reflect.getMetadata(
      RATE_LIMIT_OPTIONS,
      UsersController.prototype.sendPasswordResetLink,
    );
    const config = {
      get: (key: string) =>
        key === 'PASSWORD_RESET_RATE_LIMIT_MAX' ? '1' : '15m',
    };
    const reflector = {
      getAllAndOverride: () => options,
    };
    const guard = new RateLimitGuard(config as never, reflector as never);
    const context = {
      getClass: () => UsersController,
      getHandler: () => UsersController.prototype.sendPasswordResetLink,
      switchToHttp: () => ({
        getRequest: () => ({ body: {}, ip: '10.1.1.1' }),
      }),
    } as unknown as ExecutionContext;

    expect(options).toEqual({
      identifier: 'ip',
      key: 'user-password-reset-link',
      maxEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_MAX',
      windowEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_WINDOW',
    });
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(
      guard.canActivate({
        ...context,
        switchToHttp: () => ({
          getRequest: () => ({ body: {}, ip: '10.1.1.2' }),
        }),
      } as ExecutionContext),
    ).toBe(true);
  });
});
