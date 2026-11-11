import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';

function createAuthService() {
  const tenant = Object.assign(new Tenant(), {
    id: 'tenant-id',
    name: 'Acme',
    slug: 'acme',
    status: 'active',
  });
  const user = Object.assign(new User(), {
    age: 32,
    email: 'ana@example.com',
    enabledActions: [],
    firstName: 'Ana',
    id: 'user-id',
    lastName: 'Silva',
    passwordHash: '',
    photoUrl: '/brand/symbol-vetor.png',
    profile: 'Usuario',
    sex: 'F',
    status: 'active',
    tenantId: tenant.id,
  });
  const users = {
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn((value) => Promise.resolve(value)),
  };
  const tenants = {
    findOne: vi.fn().mockResolvedValue(tenant),
  };
  const sessions = {
    create: vi.fn((value) => value),
    findOne: vi.fn(),
    save: vi.fn((value) => Promise.resolve(value)),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const resetTokens = {
    create: vi.fn((value) => value),
    findOne: vi.fn(),
    save: vi.fn((value) => Promise.resolve(value)),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const mfaChallenges = {
    create: vi.fn((value) => value),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    findOne: vi.fn(),
    save: vi.fn((value) =>
      Promise.resolve({
        ...value,
        id: value.id ?? 'challenge-id',
      }),
    ),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const mfaManager = {
    transaction: async (
      work: (manager: {
        getRepository: (entity: { name: string }) => unknown;
      }) => Promise<unknown>,
    ) =>
      work({
        getRepository: (entity) => {
          if (entity.name === 'User') {
            return users;
          }

          if (entity.name === 'RefreshSession') {
            return sessions;
          }

          return mfaChallenges;
        },
      }),
  };
  Object.assign(mfaChallenges, { manager: mfaManager });
  const jwt = {
    signAsync: vi
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
    verifyAsync: vi.fn(),
  };
  const configValues: Record<string, string> = {
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_SECRET: 'access-secret',
    MFA_EMAIL_TOKEN_DIGITS: '4',
    MFA_EMAIL_TOKEN_EXPIRES_IN: '30m',
    PASSWORD_RESET_TOKEN_EXPIRES_IN: '15m',
  };
  const config = {
    get: vi.fn(
      (key: string, fallback?: string) => configValues[key] ?? fallback,
    ),
    getOrThrow: vi.fn((key: string) => configValues[key]),
  };
  const mail = {
    sendMfaCode: vi.fn().mockResolvedValue(undefined),
    sendPasswordChanged: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  };
  const abac = {
    canAccessTenant: vi.fn().mockReturnValue(true),
  };
  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    users as never,
    tenants as never,
    sessions as never,
    resetTokens as never,
    mfaChallenges as never,
    jwt as never,
    config as never,
    mail as never,
    abac as never,
    audit as never,
  );

  return {
    audit,
    config,
    configValues,
    jwt,
    mail,
    mfaChallenges,
    resetTokens,
    response: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as Response,
    service,
    sessions,
    tenant,
    tenants,
    user,
    users,
  };
}

describe('AuthService', () => {
  it('emails an MFA challenge and does not set session cookies on login', async () => {
    const context = createAuthService();
    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.tenant.mfaEnabled = true;
    context.users.find.mockResolvedValue([context.user]);

    const result = await context.service.login({
      email: 'ANA@EXAMPLE.COM',
      password: 'correct-password',
    });

    expect(result.mfaRequired).toBe(true);
    if (!result.mfaRequired) {
      throw new Error('Expected an MFA challenge.');
    }
    expect(result.challengeId).toBe('challenge-id');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('token');
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.sessions.save).not.toHaveBeenCalled();
    expect(context.jwt.signAsync).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).toHaveBeenCalledWith(
      'ana@example.com',
      expect.stringMatching(/^\d{4}$/),
      '30 minutos',
    );
    const mailedToken = context.mail.sendMfaCode.mock.calls[0][1] as string;
    expect(context.mfaChallenges.save).toHaveBeenCalledWith(
      expect.objectContaining({
        failedAttempts: 0,
        tokenHash: createHash('sha256').update(mailedToken).digest('hex'),
        usedAt: null,
        userId: 'user-id',
      }),
    );
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(
      Date.now() + 29 * 60 * 1000,
    );
  });

  it('opens a session without an emailed code when the home tenant MFA is disabled', async () => {
    const context = createAuthService();
    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.tenant.mfaEnabled = false;
    context.users.find.mockResolvedValue([context.user]);

    const result = await context.service.login(
      {
        email: 'ana@example.com',
        password: 'correct-password',
      },
      context.response,
    );

    expect(result).toEqual(
      expect.objectContaining({
        email: 'ana@example.com',
        id: 'user-id',
        mfaRequired: false,
      }),
    );
    expect(result).not.toHaveProperty('challengeId');
    expect(result).not.toHaveProperty('mfaEnabled');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.mfaChallenges.save).not.toHaveBeenCalled();
    expect(context.response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(context.response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(context.audit.record).toHaveBeenCalledWith('login_succeeded', {
      tenantId: 'tenant-id',
      userId: 'user-id',
    });
  });

  it('keeps the MFA challenge when the home tenant row is missing', async () => {
    const context = createAuthService();
    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.users.find.mockResolvedValue([context.user]);
    context.tenants.findOne.mockResolvedValue(null);

    const result = await context.service.login(
      {
        email: 'ana@example.com',
        password: 'correct-password',
      },
      context.response,
    );

    expect(result.mfaRequired).toBe(true);
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).toHaveBeenCalled();
  });

  it('returns a generic error for invalid credentials', async () => {
    const context = createAuthService();
    context.users.find.mockResolvedValue([]);

    await expect(
      context.service.login({
        email: 'unknown@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials.');
    expect(context.audit.record).toHaveBeenCalledWith(
      'login_failed',
      expect.objectContaining({ metadata: { reason: 'invalid_credentials' } }),
    );
    expect(context.users.find).toHaveBeenCalledWith({
      where: {
        email: 'unknown@example.com',
        status: 'active',
      },
    });
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.tenants.findOne).not.toHaveBeenCalled();
  });

  it('does not email a code when the password matches more than one active account', async () => {
    const context = createAuthService();
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const other = Object.assign(new User(), context.user, {
      id: 'other-user',
      passwordHash,
      tenantId: 'other-tenant',
    });
    context.user.passwordHash = passwordHash;
    context.users.find.mockResolvedValue([context.user, other]);

    await expect(
      context.service.login({
        email: 'ana@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow('Invalid credentials.');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.mfaChallenges.save).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.tenants.findOne).not.toHaveBeenCalled();
  });

  it('hashes recovery tokens before persistence and sends the raw token by email', async () => {
    const context = createAuthService();
    context.users.find.mockResolvedValue([context.user]);

    await context.service.requestPasswordRecovery({
      email: context.user.email,
    });

    const savedToken = context.resetTokens.create.mock.calls[0][0];
    const sentToken = context.mail.sendPasswordReset.mock.calls[0][1];

    expect(savedToken.tokenHash).toBe(
      createHash('sha256').update(sentToken).digest('hex'),
    );
    expect(savedToken.tokenHash).not.toBe(sentToken);
    expect(sentToken).toHaveLength(64);
  });

  it('does not email a recovery token when the account is not active', async () => {
    const context = createAuthService();
    context.user.status = 'blocked';
    context.users.find.mockImplementation(
      ({ where }: { where: { email?: string; status?: string } }) =>
        Promise.resolve(
          where.status && where.status !== context.user.status
            ? []
            : where.email === context.user.email
              ? [context.user]
              : [],
        ),
    );

    await context.service.requestPasswordRecovery({
      email: context.user.email,
    });

    expect(context.mail.sendPasswordReset).not.toHaveBeenCalled();
    expect(context.resetTokens.save).not.toHaveBeenCalled();
  });

  it('resets a password from a token-only submit', async () => {
    const context = createAuthService();
    const token = 'a'.repeat(64);
    context.resetTokens.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      tokenHash: createHash('sha256').update(token).digest('hex'),
      usedAt: null,
      userId: context.user.id,
    });
    context.users.findOne.mockResolvedValue(context.user);

    await context.service.resetPassword({
      password: 'ExamplePassword12!',
      passwordConfirmation: 'ExamplePassword12!',
      token,
    });

    expect(context.users.save).toHaveBeenCalled();
    expect(context.mail.sendPasswordChanged).toHaveBeenCalledWith(
      context.user.email,
    );
  });

  it('rejects an expired token without changing the password', async () => {
    const context = createAuthService();
    context.resetTokens.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1000),
      tokenHash: createHash('sha256').update('a'.repeat(64)).digest('hex'),
      usedAt: null,
      userId: context.user.id,
    });

    await expect(
      context.service.resetPassword({
        password: 'ExamplePassword12!',
        passwordConfirmation: 'ExamplePassword12!',
        token: 'a'.repeat(64),
      }),
    ).rejects.toThrow('Invalid or expired recovery token.');
    expect(context.users.save).not.toHaveBeenCalled();
  });

  it('replaces the password hash, marks the token used, and revokes refresh sessions', async () => {
    const context = createAuthService();
    const token = 'b'.repeat(64);
    const resetToken = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      tokenHash: createHash('sha256').update(token).digest('hex'),
      usedAt: null as Date | null,
      userId: context.user.id,
    };
    context.user.passwordHash = await bcrypt.hash('OldPassword12!', 12);
    context.resetTokens.findOne.mockResolvedValue(resetToken);
    context.users.findOne.mockResolvedValue(context.user);

    await context.service.resetPassword({
      password: 'ExamplePassword12!',
      passwordConfirmation: 'ExamplePassword12!',
      token,
    });

    expect(
      await bcrypt.compare('OldPassword12!', context.user.passwordHash),
    ).toBe(false);
    expect(
      await bcrypt.compare('ExamplePassword12!', context.user.passwordHash),
    ).toBe(true);
    expect(resetToken.usedAt).toBeInstanceOf(Date);
    expect(context.sessions.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: context.user.id }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('rejects a used recovery token without changing the password', async () => {
    const context = createAuthService();
    const previousHash = 'kept-hash';
    context.user.passwordHash = previousHash;
    context.resetTokens.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      tokenHash: createHash('sha256').update('c'.repeat(64)).digest('hex'),
      usedAt: new Date(),
      userId: context.user.id,
    });

    await expect(
      context.service.resetPassword({
        password: 'ExamplePassword12!',
        passwordConfirmation: 'ExamplePassword12!',
        token: 'c'.repeat(64),
      }),
    ).rejects.toThrow('Invalid or expired recovery token.');
    expect(context.user.passwordHash).toBe(previousHash);
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.sessions.update).not.toHaveBeenCalled();
  });

  it('lets Administrador switch the working session tenant without rewriting users.tenant_id', async () => {
    const context = createAuthService();
    context.user.profile = 'Administrador';
    context.users.findOne.mockResolvedValue(context.user);
    const other = Object.assign(new Tenant(), {
      id: 'other-tenant',
      name: 'Other',
      photoUrl: '33333333-3333-4333-8333-333333333333.png',
      slug: 'other',
      status: 'active',
    });
    context.tenants.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === other.id) {
          return Promise.resolve(other);
        }

        return Promise.resolve(context.tenant);
      },
    );
    context.jwt.signAsync.mockResolvedValue('token');

    const result = await context.service.updateSessionTenant(
      {
        id: context.user.id,
        profile: 'Administrador',
        sessionId: 'session-id',
        tenantId: context.tenant.id,
      },
      { tenantId: other.id },
      context.response,
    );

    expect(result.tenantId).toBe(other.id);
    expect(result.tenantName).toBe('Other');
    expect(result.tenantPhotoUrl).toBe('/api/v1/tenants/other-tenant/photo');
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.jwt.signAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({ tenantId: other.id, tenantSlug: 'other' }),
    );
    expect(context.jwt.signAsync.mock.calls[0][0]).not.toHaveProperty(
      'tenantPhotoUrl',
    );
  });

  it('rejects a session tenant switch for Usuario', async () => {
    const context = createAuthService();
    context.users.findOne.mockResolvedValue(context.user);

    await expect(
      context.service.updateSessionTenant(
        {
          id: context.user.id,
          profile: 'Usuario',
          sessionId: 'session-id',
          tenantId: context.tenant.id,
        },
        { tenantId: context.tenant.id },
        context.response,
      ),
    ).rejects.toThrow('Access denied.');
  });

  it('rejects a session tenant switch for AdministradorTenant', async () => {
    const context = createAuthService();
    context.user.profile = 'AdministradorTenant';
    context.users.findOne.mockResolvedValue(context.user);

    await expect(
      context.service.updateSessionTenant(
        {
          id: context.user.id,
          profile: 'AdministradorTenant',
          sessionId: 'session-id',
          tenantId: context.tenant.id,
        },
        { tenantId: context.tenant.id },
        context.response,
      ),
    ).rejects.toThrow('Access denied.');
  });

  it('does not email a code when the digit count is unset', async () => {
    const context = createAuthService();
    context.configValues.MFA_EMAIL_TOKEN_DIGITS = '';
    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.users.find.mockResolvedValue([context.user]);

    await expect(
      context.service.login({
        email: 'ana@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow('Service Unavailable');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.mfaChallenges.save).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
  });

  it('sets session cookies only after the emailed code matches', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);

    const result = await context.service.verifyMfa(
      { challengeId: 'challenge-id', token: '0042' },
      context.response,
    );

    expect(result).toEqual(
      expect.objectContaining({
        email: 'ana@example.com',
        id: 'user-id',
        tenantPhotoUrl: '',
      }),
    );
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('passwordHash');
    expect(challenge.usedAt).toBeInstanceOf(Date);
    expect(context.response.cookie).toHaveBeenCalledTimes(2);
    expect(context.response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
      }),
    );
    const cookie = context.response.cookie as unknown as {
      mock: { calls: Array<[string, string, Record<string, unknown>]> };
    };
    expect(cookie.mock.calls[0][2]).not.toHaveProperty('domain');
    expect(cookie.mock.calls[1][2]).toEqual(
      expect.objectContaining({ sameSite: 'lax' }),
    );
    expect(cookie.mock.calls[1][2]).not.toHaveProperty('domain');
  });

  it('replaces the refresh session presented with the completed login', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);
    context.jwt.verifyAsync.mockResolvedValue({
      sessionId: 'old-session',
      sub: context.user.id,
      type: 'refresh',
    });

    await context.service.verifyMfa(
      { challengeId: 'challenge-id', token: '0042' },
      context.response,
      { cookies: { refresh_token: 'old-refresh' } } as never,
    );

    expect(context.sessions.update).toHaveBeenCalledWith(
      { id: 'old-session', userId: context.user.id },
      { revokedAt: expect.any(Date) },
    );
  });

  it('keeps another user session when the presented refresh cookie is not theirs', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);
    context.jwt.verifyAsync.mockResolvedValue({
      sessionId: 'other-session',
      sub: 'other-user',
      type: 'refresh',
    });

    await context.service.verifyMfa(
      { challengeId: 'challenge-id', token: '0042' },
      context.response,
      { cookies: { refresh_token: 'other-refresh' } } as never,
    );

    expect(context.sessions.update).not.toHaveBeenCalled();
    expect(context.response.cookie).toHaveBeenCalledTimes(2);
  });

  it('sets Secure session cookies in production and still omits Domain', async () => {
    const context = createAuthService();
    context.configValues.NODE_ENV = 'production';
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);

    await context.service.verifyMfa(
      { challengeId: 'challenge-id', token: '0042' },
      context.response,
    );

    const cookie = context.response.cookie as unknown as {
      mock: { calls: Array<[string, string, Record<string, unknown>]> };
    };
    expect(cookie.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
    );
    expect(cookie.mock.calls[0][2]).not.toHaveProperty('domain');
    expect(cookie.mock.calls[1][2]).toEqual(
      expect.objectContaining({ sameSite: 'lax', secure: true }),
    );
    expect(cookie.mock.calls[1][2]).not.toHaveProperty('domain');
  });

  it('does not issue new cookies when a blocked account presents a refresh token', async () => {
    const context = createAuthService();
    context.user.status = 'blocked';
    context.jwt.verifyAsync.mockResolvedValue({
      sessionId: 'session-id',
      sub: context.user.id,
      tenantId: context.user.tenantId,
      type: 'refresh',
    });
    context.sessions.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      id: 'session-id',
      revokedAt: null,
      tokenHash: createHash('sha256').update('refresh-cookie').digest('hex'),
      userId: context.user.id,
    });
    context.users.findOne.mockImplementation(
      async ({ where }: { where?: { id?: string; status?: string } }) => {
        if (where?.id !== context.user.id) {
          return null;
        }

        if (where.status && where.status !== context.user.status) {
          return null;
        }

        return context.user;
      },
    );

    await expect(
      context.service.refresh(
        { cookies: { refresh_token: 'refresh-cookie' } } as never,
        context.response,
      ),
    ).rejects.toThrow('Invalid session.');
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.sessions.save).not.toHaveBeenCalled();
  });

  it('blocks the account on the third wrong code and ignores an expired code', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null as Date | null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '1111' },
        context.response,
      ),
    ).rejects.toThrow('Invalid or expired code.');
    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '2222' },
        context.response,
      ),
    ).rejects.toThrow('Invalid or expired code.');
    expect(context.user.status).toBe('active');
    expect(context.response.cookie).not.toHaveBeenCalled();

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '3333' },
        context.response,
      ),
    ).rejects.toThrow('Account blocked.');
    expect(context.user.status).toBe('blocked');
    expect(challenge.usedAt).toBeInstanceOf(Date);
    expect(challenge.failedAttempts).toBe(3);
    expect(context.sessions.update).toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.audit.record).toHaveBeenCalledWith(
      'mfa_account_blocked',
      expect.objectContaining({ userId: context.user.id }),
    );

    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.mail.sendMfaCode.mockClear();
    context.users.find.mockImplementation(
      ({ where }: { where: { email?: string; status?: string } }) =>
        Promise.resolve(
          where.status && where.status !== context.user.status
            ? []
            : where.email === context.user.email
              ? [context.user]
              : [],
        ),
    );
    await expect(
      context.service.login({
        email: context.user.email,
        password: 'correct-password',
      }),
    ).rejects.toThrow('Invalid credentials.');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();

    const expired = {
      ...challenge,
      expiresAt: new Date(Date.now() - 1000),
      failedAttempts: 1,
      usedAt: null,
    };
    context.user.status = 'active';
    context.mfaChallenges.findOne.mockResolvedValue(expired);
    context.mfaChallenges.save.mockClear();

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '9999' },
        context.response,
      ),
    ).rejects.toThrow('Invalid or expired code.');
    expect(expired.failedAttempts).toBe(1);
    expect(context.mfaChallenges.save).not.toHaveBeenCalled();
  });

  it('still returns the login result when the audit record fails', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 2,
      id: 'challenge-id',
      tokenHash: createHash('sha256').update('0042').digest('hex'),
      usedAt: null as Date | null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);
    context.audit.record.mockRejectedValue(new Error('audit down'));

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '1111' },
        context.response,
      ),
    ).rejects.toThrow('Account blocked.');
    expect(context.user.status).toBe('blocked');
    expect(context.response.cookie).not.toHaveBeenCalled();

    context.user.status = 'active';
    challenge.failedAttempts = 0;
    challenge.usedAt = null;

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '0042' },
        context.response,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: context.user.id }));
    expect(context.response.cookie).toHaveBeenCalled();
  });

  it('resends only after expiry and refuses a user who is not active', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      failedAttempts: 2,
      id: 'challenge-id',
      tokenHash: 'hash',
      usedAt: null as Date | null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);

    await expect(
      context.service.resendMfa({ challengeId: 'challenge-id' }),
    ).rejects.toThrow('Invalid input.');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();

    challenge.expiresAt = new Date(Date.now() - 1000);
    const result = await context.service.resendMfa({
      challengeId: 'challenge-id',
    });

    expect(challenge.usedAt).toBeInstanceOf(Date);
    expect(result.challengeId).toBe('challenge-id');
    expect(result.mfaRequired).toBe(true);
    expect(context.mail.sendMfaCode).toHaveBeenCalledTimes(1);
    expect(context.mfaChallenges.create).toHaveBeenCalledWith(
      expect.objectContaining({ failedAttempts: 0, userId: context.user.id }),
    );

    context.mail.sendMfaCode.mockClear();
    context.users.findOne.mockResolvedValue(null);
    const blockedChallenge = {
      ...challenge,
      expiresAt: new Date(Date.now() - 1000),
      id: 'blocked-challenge',
      usedAt: null,
    };
    context.mfaChallenges.findOne.mockResolvedValue(blockedChallenge);

    await expect(
      context.service.resendMfa({ challengeId: 'blocked-challenge' }),
    ).rejects.toThrow('Invalid or expired code.');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
  });

  it('keeps the expired challenge when a replacement code cannot be issued', async () => {
    const context = createAuthService();
    const challenge = {
      expiresAt: new Date(Date.now() - 1000),
      failedAttempts: 0,
      id: 'challenge-id',
      tokenHash: 'hash',
      usedAt: null as Date | null,
      userId: context.user.id,
    };
    context.mfaChallenges.findOne.mockResolvedValue(challenge);
    context.users.findOne.mockResolvedValue(context.user);
    context.configValues.MFA_EMAIL_TOKEN_DIGITS = '';

    await expect(
      context.service.resendMfa({ challengeId: 'challenge-id' }),
    ).rejects.toThrow('Service Unavailable');
    expect(challenge.usedAt).toBeNull();
    expect(context.mfaChallenges.update).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();

    context.configValues.MFA_EMAIL_TOKEN_DIGITS = '4';
    context.mfaChallenges.save.mockClear();
    context.mail.sendMfaCode.mockRejectedValue(new Error('smtp down'));

    await expect(
      context.service.resendMfa({ challengeId: 'challenge-id' }),
    ).rejects.toThrow('Service Unavailable');
    expect(challenge.usedAt).toBeNull();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(
      context.mfaChallenges.save.mock.calls.some(
        (call) => call[0].usedAt instanceof Date,
      ),
    ).toBe(true);
  });

  it('marks the new challenge used when the MFA email fails', async () => {
    const context = createAuthService();
    context.user.passwordHash = await bcrypt.hash('correct-password', 10);
    context.users.find.mockResolvedValue([context.user]);
    context.mail.sendMfaCode.mockRejectedValue(new Error('smtp down'));

    await expect(
      context.service.login({
        email: 'ana@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow('Service Unavailable');
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.mfaChallenges.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id' }),
      expect.objectContaining({ usedAt: expect.any(Date) }),
    );
    const failedChallenge = context.mfaChallenges.save.mock.calls.at(
      -1,
    )?.[0] as {
      usedAt: Date | null;
    };
    expect(failedChallenge.usedAt).toBeInstanceOf(Date);
  });

  it('deletes the MFA challenge without a session or an account block', async () => {
    const context = createAuthService();

    await expect(
      context.service.cancelMfa({ challengeId: 'challenge-id' }),
    ).resolves.toBeUndefined();

    expect(context.mfaChallenges.delete).toHaveBeenCalledTimes(1);
    expect(context.mfaChallenges.delete).toHaveBeenCalledWith({
      id: 'challenge-id',
    });
    expect(context.user.status).toBe('active');
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.jwt.signAsync).not.toHaveBeenCalled();
  });

  it('completes when the challenge is already gone', async () => {
    const context = createAuthService();
    context.mfaChallenges.delete.mockResolvedValue({ affected: 0 });

    await expect(
      context.service.cancelMfa({ challengeId: 'missing-id' }),
    ).resolves.toBeUndefined();

    expect(context.mfaChallenges.delete).toHaveBeenCalledWith({
      id: 'missing-id',
    });
    expect(context.user.status).toBe('active');
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
  });

  it('does not verify or resend a deleted challenge', async () => {
    const context = createAuthService();
    context.mfaChallenges.findOne.mockResolvedValue(null);

    await context.service.cancelMfa({ challengeId: 'challenge-id' });

    await expect(
      context.service.verifyMfa(
        { challengeId: 'challenge-id', token: '0042' },
        context.response,
      ),
    ).rejects.toThrow('Invalid or expired code.');
    await expect(
      context.service.resendMfa({ challengeId: 'challenge-id' }),
    ).rejects.toThrow('Invalid or expired code.');
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.user.status).toBe('active');
  });

  it('leaves the account unchanged when cancel cannot delete the challenge', async () => {
    const context = createAuthService();
    context.mfaChallenges.delete.mockRejectedValue(new Error('db down'));

    await expect(
      context.service.cancelMfa({ challengeId: 'challenge-id' }),
    ).rejects.toThrow('db down');

    expect(context.user.status).toBe('active');
    expect(context.users.save).not.toHaveBeenCalled();
    expect(context.response.cookie).not.toHaveBeenCalled();
    expect(context.mail.sendMfaCode).not.toHaveBeenCalled();
  });
});
