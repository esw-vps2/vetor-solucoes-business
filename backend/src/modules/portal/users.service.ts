import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import { parseDuration } from '../../common/config/duration.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from './audit.service.js';
import type { SafeUser } from './auth.types.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserListItemDto } from './dto/user-list-item.dto.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import {
  detectPhoto,
  isPhotoPointer,
  MAX_PHOTO_BYTES,
  photoContentType,
  photoPointerForUser,
  toPublicPhotoUrl,
  toPublicTenantPhotoUrl,
} from './photo-url.js';
import { TenantStorageService } from './tenant-storage.service.js';
import {
  enabledActionsForActor,
  parseEnabledActions,
  hasMappedAction,
  hasProjectsAccess,
} from './enabled-actions.js';

const BCRYPT_COST = 12;

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly tenantStorage: TenantStorageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateUserDto,
    photo: Express.Multer.File | undefined,
    actorId: string,
  ): Promise<void> {
    const actor = await this.requireActor(actorId);

    if (!hasMappedAction(actor, 'createUser')) {
      throw new ForbiddenException('Access denied.');
    }

    if (
      actor.profile === 'AdministradorTenant' &&
      dto.tenantId !== actor.tenantId
    ) {
      throw new BadRequestException('Invalid input.');
    }

    if (dto.profile && actor.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    const tenant = await this.tenants.findOne({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid input.');
    }

    if (photo) {
      this.assertPhoto(photo);
    }

    const email = dto.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = this.users.create({
      age: dto.age,
      cargo: dto.cargo ?? '',
      email,
      enabledActions: enabledActionsForActor(
        actor,
        [],
        parseEnabledActions(dto.enabledActions),
      ),
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      photoUrl: '',
      profile:
        dto.profile === 'Administrador' || dto.profile === 'AdministradorTenant'
          ? dto.profile
          : 'Usuario',
      sex: dto.sex,
      status: 'active',
      tenantId: tenant.id,
    });

    let saved: User;

    try {
      saved = await this.users.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('Invalid input.');
      }

      throw error;
    }

    if (photo) {
      saved.photoUrl = await this.storePhoto(saved, photo);
      await this.users.save(saved);
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

    await this.resetTokens.update(
      { userId: saved.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    await this.resetTokens.save(
      this.resetTokens.create({
        expiresAt,
        tokenHash: this.hash(rawToken),
        usedAt: null,
        userId: saved.id,
      }),
    );

    const origin = this.frontendOrigin();
    const changeUrl = `${origin}/portal/change-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await this.mail.sendPasswordChangeInvitation(email, changeUrl);
    } catch {
      this.logger.error('Password change invitation email delivery failed.');
    }

    await this.audit.record('user_created', {
      tenantId: saved.tenantId,
      userId: saved.id,
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    photo: Express.Multer.File | undefined,
    actorId: string,
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Not found.');
    }

    const isRegistrationPatch =
      dto.firstName !== undefined ||
      dto.lastName !== undefined ||
      dto.cargo !== undefined ||
      dto.age !== undefined ||
      dto.sex !== undefined ||
      dto.email !== undefined;

    if (
      !isRegistrationPatch &&
      dto.enabledActions === undefined &&
      dto.profile === undefined &&
      dto.tenantId === undefined &&
      !photo
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const actor = await this.requireActor(actorId);

    if (actor.id !== user.id && !this.canEditOtherUser(actor, user)) {
      throw new ForbiddenException('Access denied.');
    }

    if (dto.tenantId !== undefined && actor.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    if (dto.tenantId !== undefined) {
      const nextTenant = await this.tenants.findOne({
        where: { id: dto.tenantId },
      });

      if (!nextTenant) {
        throw new BadRequestException('Invalid input.');
      }
    }

    if (dto.profile !== undefined) {
      if (actor.profile !== 'Administrador') {
        throw new ForbiddenException('Access denied.');
      }

      if (user.profile === 'Administrador' && dto.profile !== 'Administrador') {
        throw new ForbiddenException('Access denied.');
      }

      user.profile = dto.profile;
    }

    if (dto.enabledActions !== undefined) {
      if (!this.canWriteEnabledActions(actor, user)) {
        throw new ForbiddenException('Access denied.');
      }

      user.enabledActions = enabledActionsForActor(
        actor,
        user.enabledActions ?? [],
        parseEnabledActions(dto.enabledActions),
      );
    }

    if (photo) {
      this.assertPhoto(photo);
    }

    if (isRegistrationPatch) {
      user.age = dto.age as number;
      user.cargo = dto.cargo ?? user.cargo;
      user.email = (dto.email as string).toLowerCase();
      user.firstName = dto.firstName as string;
      user.lastName = dto.lastName as string;
      user.sex = dto.sex as string;
    }

    const previousTenantId = user.tenantId;
    const previousPhoto = user.photoUrl;
    const nextTenantId = dto.tenantId ?? previousTenantId;
    const tenantChanged = nextTenantId !== previousTenantId;

    if (tenantChanged) {
      user.tenantId = nextTenantId;
    }

    let copiedPhoto = false;

    if (photo) {
      user.photoUrl = await this.storePhoto(user, photo);
    } else if (tenantChanged && isPhotoPointer(previousPhoto)) {
      try {
        const bytes = await this.tenantStorage.readUserPhoto(
          previousTenantId,
          previousPhoto,
        );
        await this.tenantStorage.writeUserPhoto(
          nextTenantId,
          previousPhoto,
          bytes,
        );
        copiedPhoto = true;
      } catch (error) {
        if (!isMissingFile(error)) {
          throw error;
        }

        this.logger.error('User photo file missing during tenant change.');
      }
    }

    try {
      await this.users.save(user);
    } catch (error) {
      const writtenPhoto = user.photoUrl;
      user.tenantId = previousTenantId;
      user.photoUrl = previousPhoto;

      if (copiedPhoto) {
        await this.tenantStorage.deleteTenantFile(
          nextTenantId,
          previousPhoto,
          'photo',
        );
      } else if (tenantChanged && photo && isPhotoPointer(writtenPhoto)) {
        await this.tenantStorage.deleteTenantFile(
          nextTenantId,
          writtenPhoto,
          'photo',
        );
      }

      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('Invalid input.');
      }

      throw error;
    }

    if (
      copiedPhoto ||
      (tenantChanged && photo && isPhotoPointer(previousPhoto))
    ) {
      await this.tenantStorage.deleteTenantFile(
        previousTenantId,
        previousPhoto,
        'photo',
      );
    }

    await this.audit.record('user_updated', {
      tenantId: user.tenantId,
      userId: user.id,
      ...(tenantChanged ? { metadata: { previousTenantId } } : {}),
    });
  }

  async listForActor(actorId: string): Promise<UserListItemDto[]> {
    const actor = await this.requireActor(actorId);
    let users: User[];

    if (actor.profile === 'Administrador') {
      users = await this.users.find({
        order: { email: 'ASC' },
      });
    } else if (actor.profile === 'AdministradorTenant') {
      users = await this.users.find({
        order: { email: 'ASC' },
        where: { tenantId: actor.tenantId },
      });
    } else if (hasMappedAction(actor, 'viewProjects')) {
      users = (
        await this.users.find({
          order: { email: 'ASC' },
          where: { tenantId: actor.tenantId },
        })
      ).filter((user) => hasProjectsAccess(user));
    } else {
      throw new ForbiddenException('Access denied.');
    }

    const tenants = await this.tenants.find();
    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

    return users.map((user) => {
      const tenant = tenantById.get(user.tenantId);

      return {
        email: user.email,
        enabledActions: user.enabledActions ?? [],
        cargo: user.cargo ?? '',
        firstName: user.firstName,
        id: user.id,
        lastName: user.lastName,
        profile: user.profile,
        status: user.status,
        tenantId: user.tenantId,
        tenantName: tenant?.name ?? '',
        tenantSlug: tenant?.slug ?? '',
      };
    });
  }

  async findPublicProfile(id: string): Promise<SafeUser & { status: string }> {
    const user = await this.users.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Not found.');
    }

    return {
      ...(await this.toSafeUser(user)),
      status: user.status,
    };
  }

  async delete(targetId: string, actorId: string): Promise<void> {
    const actor = await this.requireActor(actorId);

    if (actor.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    if (targetId === actorId) {
      throw new BadRequestException('Invalid input.');
    }

    const target = await this.users.findOne({ where: { id: targetId } });

    if (!target) {
      throw new NotFoundException('Not found.');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query(
          `UPDATE "cards" SET "assignee_user_id" = $1 WHERE "assignee_user_id" = $2`,
          [actor.id, targetId],
        );
        await manager.remove(User, target);
      });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('Invalid input.');
      }

      throw error;
    }

    if (isPhotoPointer(target.photoUrl)) {
      try {
        await this.tenantStorage.deleteTenantFile(
          target.tenantId,
          target.photoUrl,
          'photo',
        );
      } catch (error) {
        if (!isMissingFile(error)) {
          this.logger.error('User photo cleanup after delete failed.');
        }
      }
    }

    try {
      await this.audit.record('user_deleted', {
        metadata: { deletedUserId: target.id },
        tenantId: target.tenantId,
        userId: actor.id,
      });
    } catch {
      this.logger.error('User deletion audit failed.');
    }
  }

  async reactivate(targetId: string, actorId: string): Promise<void> {
    const actor = await this.requireActor(actorId);

    if (
      actor.profile !== 'Administrador' &&
      actor.profile !== 'AdministradorTenant'
    ) {
      throw new ForbiddenException('Access denied.');
    }

    const target = await this.users.findOne({ where: { id: targetId } });

    if (!target) {
      throw new NotFoundException('Not found.');
    }

    if (
      actor.profile === 'AdministradorTenant' &&
      target.tenantId !== actor.tenantId
    ) {
      throw new ForbiddenException('Access denied.');
    }

    if (target.status !== 'blocked') {
      throw new BadRequestException('Invalid input.');
    }

    target.status = 'active';
    await this.users.save(target);
    try {
      await this.audit.record('user_reactivated', {
        tenantId: target.tenantId,
        userId: target.id,
      });
    } catch {
      this.logger.error('User reactivation audit failed.');
    }
  }

  async sendPasswordResetLink(
    targetId: string,
    actorId: string,
  ): Promise<void> {
    const actor = await this.requireActor(actorId);

    if (
      actor.profile !== 'Administrador' &&
      actor.profile !== 'AdministradorTenant'
    ) {
      throw new ForbiddenException('Access denied.');
    }

    const target = await this.users.findOne({ where: { id: targetId } });

    if (!target) {
      throw new NotFoundException('Not found.');
    }

    if (
      actor.profile === 'AdministradorTenant' &&
      target.tenantId !== actor.tenantId
    ) {
      throw new ForbiddenException('Access denied.');
    }

    if (target.status !== 'active') {
      throw new BadRequestException('Invalid input.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        parseDuration(
          this.config.get<string>(
            'ADMIN_PASSWORD_RESET_LINK_EXPIRES_IN',
            '30m',
          ),
          1800,
        ) *
          1000,
    );

    await this.resetTokens.update(
      { userId: target.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    const token = await this.resetTokens.save(
      this.resetTokens.create({
        expiresAt,
        tokenHash: this.hash(rawToken),
        usedAt: null,
        userId: target.id,
      }),
    );
    const changeUrl = `${this.frontendOrigin()}/portal/change-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await this.mail.sendPasswordResetLink(target.email, changeUrl);
    } catch {
      token.usedAt = new Date();
      await this.resetTokens.save(token);
      this.logger.error('Password reset link email delivery failed.');
      throw new ServiceUnavailableException();
    }

    try {
      await this.audit.record('password_reset_link_requested', {
        metadata: { targetUserId: target.id },
        tenantId: target.tenantId,
        userId: actor.id,
      });
    } catch {
      this.logger.error('Password reset link audit failed.');
    }
  }

  async readPhoto(id: string): Promise<{ bytes: Buffer; contentType: string }> {
    const user = await this.users.findOne({ where: { id } });
    const contentType = user ? photoContentType(user.photoUrl) : null;

    if (!user || !contentType) {
      throw new NotFoundException('Not found.');
    }

    try {
      return {
        bytes: await this.tenantStorage.readUserPhoto(
          user.tenantId,
          user.photoUrl,
        ),
        contentType,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  private assertPhoto(photo: Express.Multer.File): void {
    if (photo.size > MAX_PHOTO_BYTES || !detectPhoto(photo.buffer)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private async storePhoto(
    user: User,
    photo: Express.Multer.File,
  ): Promise<string> {
    this.assertPhoto(photo);
    const detected = detectPhoto(photo.buffer);

    if (!detected) {
      throw new BadRequestException('Invalid input.');
    }

    const pointer = photoPointerForUser(user.id, detected.extension);

    if (
      isPhotoPointer(user.photoUrl) &&
      user.photoUrl.toLowerCase() !== pointer.toLowerCase()
    ) {
      await this.tenantStorage.deleteTenantFile(
        user.tenantId,
        user.photoUrl,
        'photo',
      );
    }

    await this.tenantStorage.writeUserPhoto(
      user.tenantId,
      pointer,
      photo.buffer,
    );
    return pointer;
  }

  private async toSafeUser(user: User): Promise<SafeUser> {
    const tenant = await this.tenants.findOne({
      where: { id: user.tenantId },
    });

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
      tenantId: user.tenantId,
      tenantName: tenant?.name ?? '',
      tenantPhotoUrl: toPublicTenantPhotoUrl(user.tenantId, tenant?.photoUrl),
      tenantSlug: tenant?.slug ?? '',
    };
  }

  private async requireActor(actorId: string): Promise<User> {
    const actor = await this.users.findOne({
      where: { id: actorId, status: 'active' },
    });

    if (!actor) {
      throw new ForbiddenException('Access denied.');
    }

    return actor;
  }

  private canEditOtherUser(actor: User, target: User): boolean {
    if (actor.profile === 'Administrador') {
      return true;
    }

    return (
      actor.profile === 'AdministradorTenant' &&
      target.tenantId === actor.tenantId &&
      target.profile !== 'Administrador'
    );
  }

  private canWriteEnabledActions(actor: User, target: User): boolean {
    if (actor.profile === 'Administrador') {
      return true;
    }

    return (
      actor.profile === 'AdministradorTenant' &&
      target.tenantId === actor.tenantId &&
      target.profile !== 'Administrador'
    );
  }

  private frontendOrigin(): string {
    const cors = this.config.get<string>('CORS', 'http://localhost:3000');
    return cors.split(',')[0].trim().replace(/\/$/, '');
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    return this.hasQueryCode(error, '23505');
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return this.hasQueryCode(error, '23503');
  }

  private hasQueryCode(error: unknown, code: string): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const failed = error as QueryFailedError & {
      code?: string;
      driverError?: { code?: string };
    };

    return failed.code === code || failed.driverError?.code === code;
  }
}
