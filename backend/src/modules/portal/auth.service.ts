import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  randomBytes,
  randomInt,
  randomUUID,
  createHash,
  timingSafeEqual,
} from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { In, IsNull, Repository } from 'typeorm';
import { parseDuration } from '../../common/config/duration.js';
import { MailService } from '../mail/mail.service.js';
import { AbacService } from './abac.service.js';
import { AuditService } from './audit.service.js';
import {
  AccessTokenPayload,
  AuthenticatedUser,
  SafeUser,
} from './auth.types.js';
import { PasswordRecoveryResetDto } from './dto/password-recovery-reset.dto.js';
import { PasswordRecoveryRequestDto } from './dto/password-recovery-request.dto.js';
import { PasswordRecoveryVerifyDto } from './dto/password-recovery-verify.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { MfaCancelDto } from './dto/mfa-cancel.dto.js';
import { MfaResendDto } from './dto/mfa-resend.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { MfaEmailChallenge } from './entities/mfa-email-challenge.entity.js';
import { RefreshSession } from './entities/refresh-session.entity.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import { toPublicPhotoUrl, toPublicTenantPhotoUrl } from './photo-url.js';

interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  profile: string;
  sessionId: string;
  type: 'refresh';
}

export interface MfaChallengeResult {
  challengeId: string;
  expiresAt: string;
  mfaRequired: true;
}

export interface LoginSessionResult extends SafeUser {
  mfaRequired: false;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(RefreshSession)
    private readonly sessions: Repository<RefreshSession>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    @InjectRepository(MfaEmailChallenge)
    private readonly mfaChallenges: Repository<MfaEmailChallenge>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly abac: AbacService,
    private readonly audit: AuditService,
  ) {}

  async login(
    dto: LoginDto,
    response?: Response,
    request?: Request,
  ): Promise<MfaChallengeResult | LoginSessionResult> {
    const candidates = await this.users.find({
      where: {
        email: dto.email.toLowerCase(),
        status: 'active',
      },
    });
    const matchedUsers: User[] = [];

    for (const candidate of candidates) {
      const passwordMatches = await bcrypt.compare(
        dto.password,
        candidate.passwordHash,
      );

      if (
        passwordMatches &&
        this.abac.canAccessTenant(candidate, candidate.tenantId)
      ) {
        matchedUsers.push(candidate);
      }
    }

    const user = matchedUsers.length === 1 ? matchedUsers[0] : null;

    if (!user) {
      try {
        await this.audit.record('login_failed', {
          metadata: { reason: 'invalid_credentials' },
        });
      } catch {
        this.logger.error('Login failure audit failed.');
      }
      throw new UnauthorizedException('Invalid credentials.');
    }

    const homeTenant = await this.tenants.findOne({
      where: { id: user.tenantId },
    });

    if (!homeTenant || homeTenant.mfaEnabled !== false) {
      return this.issueMfaChallenge(user);
    }

    if (!response) {
      throw new ServiceUnavailableException();
    }

    const safeUser = await this.issueSession(
      user,
      response,
      user.tenantId,
      await this.presentedSessionId(request, user.id),
    );

    try {
      await this.audit.record('login_succeeded', {
        tenantId: user.tenantId,
        userId: user.id,
      });
    } catch {
      this.logger.error('Login success audit failed.');
    }

    return {
      ...safeUser,
      mfaRequired: false,
    };
  }

  async verifyMfa(
    dto: MfaVerifyDto,
    response: Response,
    request?: Request,
  ): Promise<SafeUser> {
    const outcome = await this.mfaChallenges.manager.transaction(
      async (manager) => {
        const challenges = manager.getRepository(MfaEmailChallenge);
        const users = manager.getRepository(User);
        const sessions = manager.getRepository(RefreshSession);
        const challenge = await challenges.findOne({
          lock: { mode: 'pessimistic_write' },
          where: { id: dto.challengeId },
        });
        const user = challenge
          ? await users.findOne({ where: { id: challenge.userId } })
          : null;

        if (
          !challenge ||
          !user ||
          user.status !== 'active' ||
          challenge.usedAt ||
          challenge.expiresAt.getTime() <= Date.now()
        ) {
          return 'invalid' as const;
        }

        if (!this.matchesHash(dto.token, challenge.tokenHash)) {
          challenge.failedAttempts += 1;

          if (challenge.failedAttempts >= 3) {
            challenge.usedAt = new Date();
            user.status = 'blocked';
            await challenges.save(challenge);
            await users.save(user);
            await sessions.update(
              { revokedAt: IsNull(), userId: user.id },
              { revokedAt: new Date() },
            );
            return { kind: 'blocked' as const, user };
          }

          await challenges.save(challenge);
          return 'rejected' as const;
        }

        challenge.usedAt = new Date();
        await challenges.save(challenge);
        return { kind: 'accepted' as const, user };
      },
    );

    if (outcome === 'invalid' || outcome === 'rejected') {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    if (outcome.kind === 'blocked') {
      try {
        await this.audit.record('mfa_account_blocked', {
          tenantId: outcome.user.tenantId,
          userId: outcome.user.id,
        });
      } catch {
        this.logger.error('MFA account block audit failed.');
      }
      throw new ForbiddenException('Account blocked.');
    }

    const safeUser = await this.issueSession(
      outcome.user,
      response,
      outcome.user.tenantId,
      await this.presentedSessionId(request, outcome.user.id),
    );
    try {
      await this.audit.record('login_succeeded', {
        tenantId: outcome.user.tenantId,
        userId: outcome.user.id,
      });
    } catch {
      this.logger.error('Login audit failed.');
    }
    return safeUser;
  }

  async resendMfa(dto: MfaResendDto): Promise<MfaChallengeResult> {
    const claimed = await this.mfaChallenges.manager.transaction(
      async (manager) => {
        const challenges = manager.getRepository(MfaEmailChallenge);
        const users = manager.getRepository(User);
        const challenge = await challenges.findOne({
          lock: { mode: 'pessimistic_write' },
          where: { id: dto.challengeId },
        });
        const user = challenge
          ? await users.findOne({
              where: { id: challenge.userId, status: 'active' },
            })
          : null;

        if (!challenge || !user || challenge.usedAt) {
          return 'invalid' as const;
        }

        if (challenge.expiresAt.getTime() > Date.now()) {
          return 'early' as const;
        }

        challenge.usedAt = new Date();
        await challenges.save(challenge);
        return { challenge, user };
      },
    );

    if (claimed === 'invalid') {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    if (claimed === 'early') {
      throw new BadRequestException('Invalid input.');
    }

    try {
      return await this.issueMfaChallenge(claimed.user);
    } catch (error) {
      claimed.challenge.usedAt = null;
      await this.mfaChallenges.save(claimed.challenge);
      throw error;
    }
  }

  async cancelMfa(dto: MfaCancelDto): Promise<void> {
    await this.mfaChallenges.delete({ id: dto.challengeId });
  }

  async refresh(request: Request, response: Response): Promise<SafeUser> {
    const token = request.cookies?.refresh_token;

    if (!token) {
      throw new UnauthorizedException('Invalid session.');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid session.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid session.');
    }

    const session = await this.sessions.findOne({
      where: { id: payload.sessionId, userId: payload.sub },
    });
    const user = await this.users.findOne({
      where: { id: payload.sub, status: 'active' },
    });
    const validSession =
      session &&
      user &&
      !session.revokedAt &&
      session.expiresAt.getTime() > Date.now() &&
      this.matchesHash(token, session.tokenHash);

    if (!validSession || !user) {
      throw new UnauthorizedException('Invalid session.');
    }

    session.revokedAt = new Date();
    session.lastUsedAt = new Date();
    await this.sessions.save(session);
    const workingTenantId = this.resolveWorkingTenantId(user, payload.tenantId);
    const safeUser = await this.issueSession(
      user,
      response,
      workingTenantId,
    );
    await this.audit.record('session_refreshed', {
      tenantId: user.tenantId,
      userId: user.id,
    });
    return safeUser;
  }

  async logout(user: AuthenticatedUser, response: Response): Promise<void> {
    const session = await this.sessions.findOne({
      where: { id: user.sessionId, userId: user.id },
    });

    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await this.sessions.save(session);
    }

    this.clearCookies(response);
    await this.audit.record('logout', {
      tenantId: user.tenantId,
      userId: user.id,
    });
  }

  async getSession(
    userId: string,
    workingTenantId: string,
  ): Promise<SafeUser> {
    const user = await this.users.findOne({
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session.');
    }

    return this.toSafeUser(
      user,
      this.resolveWorkingTenantId(user, workingTenantId),
    );
  }

  async updateSessionTenant(
    actor: AuthenticatedUser,
    dto: { tenantId: string },
    response: Response,
  ): Promise<SafeUser> {
    const user = await this.users.findOne({
      where: { id: actor.id, status: 'active' },
    });

    if (!user || user.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    const tenant = await this.tenants.findOne({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid input.');
    }

    return this.issueSession(user, response, tenant.id, actor.sessionId);
  }

  async requestPasswordRecovery(
    dto: PasswordRecoveryRequestDto,
  ): Promise<void> {
    const users = await this.users.find({
      where: {
        email: dto.email.toLowerCase(),
        status: 'active',
      },
    });

    if (users.length === 0) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        parseDuration(
          this.config.get<string>('PASSWORD_RESET_TOKEN_EXPIRES_IN', '15m'),
          900,
        ) *
          1000,
    );

    for (const user of users) {
      await this.resetTokens.update(
        { userId: user.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await this.resetTokens.save(
        this.resetTokens.create({
          expiresAt,
          tokenHash: this.hash(rawToken),
          usedAt: null,
          userId: user.id,
        }),
      );
      await this.audit.record('password_recovery_requested', {
        tenantId: user.tenantId,
        userId: user.id,
      });
    }

    try {
      await this.mail.sendPasswordReset(users[0].email, rawToken);
    } catch {
      this.logger.error('Password recovery email delivery failed.');
    }
  }

  async verifyPasswordRecovery(
    dto: PasswordRecoveryVerifyDto,
  ): Promise<{ valid: true }> {
    await this.findValidResetToken(dto);
    return { valid: true };
  }

  async resetPassword(dto: PasswordRecoveryResetDto): Promise<void> {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match.');
    }

    const token = await this.findValidResetToken(dto);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.findOne({
      where: { id: token.userId, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired recovery token.');
    }

    user.passwordHash = passwordHash;
    token.usedAt = new Date();
    await this.users.save(user);
    await this.resetTokens.save(token);
    await this.sessions.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    try {
      await this.mail.sendPasswordChanged(user.email);
    } catch {
      this.logger.error('Password change confirmation email delivery failed.');
    }

    await this.audit.record('password_reset_completed', {
      tenantId: user.tenantId,
      userId: user.id,
    });
  }

  private async findValidResetToken(dto: {
    token: string;
    email?: string;
  }): Promise<PasswordResetToken> {
    const tokenHash = this.hash(dto.token);
    let token: PasswordResetToken | null = null;

    if (dto.email) {
      const users = await this.users.find({
        where: {
          email: dto.email.toLowerCase(),
          status: 'active',
        },
      });
      token =
        users.length > 0
          ? await this.resetTokens.findOne({
              where: {
                tokenHash,
                userId: In(users.map((user) => user.id)),
              },
            })
          : null;
    } else {
      token = await this.resetTokens.findOne({
        where: { tokenHash },
      });
    }

    if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired recovery token.');
    }

    return token;
  }

  private async presentedSessionId(
    request: Request | undefined,
    userId: string,
  ): Promise<string | undefined> {
    const token = request?.cookies?.refresh_token;

    if (!token) {
      return undefined;
    }

    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh' || payload.sub !== userId) {
        return undefined;
      }

      return payload.sessionId;
    } catch {
      return undefined;
    }
  }

  private async issueSession(
    user: User,
    response: Response,
    workingTenantId: string = user.tenantId,
    previousSessionId?: string,
  ): Promise<SafeUser> {
    const accessSeconds = parseDuration(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      900,
    );
    const refreshSeconds = parseDuration(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      604800,
    );
    const sessionId = randomUUID();
    const resolvedTenantId = this.resolveWorkingTenantId(
      user,
      workingTenantId,
    );
    const safeUser = await this.toSafeUser(user, resolvedTenantId);
    const accessToken = await this.jwt.signAsync<AccessTokenPayload>(
      {
        age: safeUser.age,
        cargo: safeUser.cargo,
        email: safeUser.email,
        enabledActions: safeUser.enabledActions,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        photoUrl: safeUser.photoUrl,
        profile: safeUser.profile,
        sessionId,
        sex: safeUser.sex,
        sub: safeUser.id,
        tenantId: safeUser.tenantId,
        tenantName: safeUser.tenantName,
        tenantSlug: safeUser.tenantSlug,
        type: 'access',
      },
      {
        expiresIn: accessSeconds,
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      },
    );
    const refreshToken = await this.jwt.signAsync<RefreshTokenPayload>(
      {
        profile: user.profile,
        sessionId,
        sub: user.id,
        tenantId: safeUser.tenantId,
        type: 'refresh',
      },
      {
        expiresIn: refreshSeconds,
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      },
    );

    if (previousSessionId) {
      await this.sessions.update(
        { id: previousSessionId, userId: user.id },
        { revokedAt: new Date() },
      );
    }

    await this.sessions.save(
      this.sessions.create({
        id: sessionId,
        expiresAt: new Date(Date.now() + refreshSeconds * 1000),
        lastUsedAt: null,
        revokedAt: null,
        tokenHash: this.hash(refreshToken),
        userId: user.id,
      }),
    );

    const secure = this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: accessSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure,
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: refreshSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure,
    });

    return safeUser;
  }

  private clearCookies(response: Response): void {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
  }

  private resolveWorkingTenantId(user: User, workingTenantId: string): string {
    if (user.profile !== 'Administrador') {
      return user.tenantId;
    }

    return workingTenantId || user.tenantId;
  }

  private async toSafeUser(
    user: User,
    workingTenantId: string = user.tenantId,
  ): Promise<SafeUser> {
    const tenant = await this.tenants.findOne({
      where: { id: workingTenantId },
    });
    const resolvedTenantId = tenant ? workingTenantId : user.tenantId;
    const resolvedTenant =
      tenant ??
      (await this.tenants.findOne({
        where: { id: user.tenantId },
      }));

    return {
      age: user.age,
      cargo: user.cargo ?? '',
      email: user.email,
      enabledActions: user.enabledActions ?? [],
      firstName: user.firstName,
      id: user.id,
      lastName: user.lastName,
      photoUrl: toPublicPhotoUrl(user.id, user.photoUrl),
      profile: user.profile,
      sex: user.sex,
      tenantId: resolvedTenant?.id ?? resolvedTenantId,
      tenantName: resolvedTenant?.name ?? '',
      tenantPhotoUrl: toPublicTenantPhotoUrl(
        resolvedTenant?.id ?? resolvedTenantId,
        resolvedTenant?.photoUrl,
      ),
      tenantSlug: resolvedTenant?.slug ?? '',
    };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private numericToken(): string {
    const count = Number(this.config.get<string>('MFA_EMAIL_TOKEN_DIGITS', ''));

    if (!Number.isInteger(count) || count < 1 || count > 32) {
      throw new ServiceUnavailableException();
    }

    let token = '';

    for (let index = 0; index < count; index += 1) {
      token += String(randomInt(0, 10));
    }

    return token;
  }

  private mfaExpiryPhrase(): string {
    const seconds = parseDuration(
      this.config.get<string>('MFA_EMAIL_TOKEN_EXPIRES_IN', '30m'),
      1800,
    );
    const minutes = Math.max(1, Math.round(seconds / 60));

    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }

  private async issueMfaChallenge(user: User): Promise<MfaChallengeResult> {
    const token = this.numericToken();
    const seconds = parseDuration(
      this.config.get<string>('MFA_EMAIL_TOKEN_EXPIRES_IN', '30m'),
      1800,
    );
    const expiresAt = new Date(Date.now() + seconds * 1000);

    await this.mfaChallenges.update(
      { usedAt: IsNull(), userId: user.id },
      { usedAt: new Date() },
    );

    const challenge = await this.mfaChallenges.save(
      this.mfaChallenges.create({
        expiresAt,
        failedAttempts: 0,
        tokenHash: this.hash(token),
        usedAt: null,
        userId: user.id,
      }),
    );

    try {
      await this.mail.sendMfaCode(user.email, token, this.mfaExpiryPhrase());
    } catch {
      challenge.usedAt = new Date();
      await this.mfaChallenges.save(challenge);
      this.logger.error('MFA email delivery failed.');
      throw new ServiceUnavailableException();
    }

    return {
      challengeId: challenge.id,
      expiresAt: expiresAt.toISOString(),
      mfaRequired: true,
    };
  }

  private matchesHash(value: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hash(value));
    const expected = Buffer.from(expectedHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
