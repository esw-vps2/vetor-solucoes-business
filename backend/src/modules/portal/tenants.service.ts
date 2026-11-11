import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AuditService } from './audit.service.js';
import { AiTokenPricingDto } from './dto/ai-token-pricing.dto.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { TenantCreatedDto } from './dto/tenant-created.dto.js';
import { TenantListItemDto } from './dto/tenant-list-item.dto.js';
import { TenantMfaSettingDto } from './dto/tenant-mfa-setting.dto.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import {
  detectPhoto,
  isPhotoPointer,
  MAX_PHOTO_BYTES,
  photoContentType,
  photoPointerForUser,
} from './photo-url.js';
import { TenantStorageService } from './tenant-storage.service.js';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly tenantStorage: TenantStorageService,
    private readonly audit: AuditService,
  ) {}

  async listForActor(actorId: string): Promise<TenantListItemDto[]> {
    const actor = await this.users.findOne({
      where: { id: actorId, status: 'active' },
    });

    if (!actor) {
      throw new ForbiddenException('Access denied.');
    }

    if (actor.profile === 'AdministradorTenant') {
      const tenant = await this.tenants.findOne({
        where: { id: actor.tenantId },
      });

      return tenant ? [this.toListDto(tenant)] : [];
    }

    return this.listAll();
  }

  async listAll(): Promise<TenantListItemDto[]> {
    const tenants = await this.tenants.find({
      order: { name: 'ASC' },
    });

    return tenants.map((tenant) => this.toListDto(tenant));
  }

  async listMfaSettings(): Promise<TenantMfaSettingDto[]> {
    const tenants = await this.tenants.find({
      order: { name: 'ASC' },
    });

    return tenants.map((tenant) => this.toMfaSetting(tenant));
  }

  async getSharedAiTokenPricing(): Promise<AiTokenPricingDto> {
    return {
      aiTokenCostPerMillion: await this.sharedAiTokenCost(),
    };
  }

  async updateSharedAiTokenPricing(
    value: number,
    actorId: string,
  ): Promise<AiTokenPricingDto> {
    const rows = await this.tenants.find({ order: { name: 'ASC' } });
    const next = value.toFixed(4);
    const previous = rows[0] ? Number(rows[0].aiTokenCostPerMillion) : 0.6;
    const changed = rows.some(
      (row) => Number(row.aiTokenCostPerMillion).toFixed(4) !== next,
    );

    if (changed && rows.length > 0) {
      for (const row of rows) {
        row.aiTokenCostPerMillion = next;
      }

      await this.tenants.save(rows);

      try {
        await this.audit.record('ai_token_pricing_changed', {
          metadata: { next: Number(next), previous },
          userId: actorId,
        });
      } catch {
        this.logger.error('AI pricing audit failed.');
      }
    }

    return { aiTokenCostPerMillion: Number(next) };
  }

  async updateMfaEnabled(
    id: string,
    dto: { mfaEnabled: boolean },
    actorId: string,
  ): Promise<TenantMfaSettingDto> {
    const tenant = await this.tenants.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    const previousMfa = tenant.mfaEnabled;

    if (previousMfa !== dto.mfaEnabled) {
      tenant.mfaEnabled = dto.mfaEnabled;
      await this.tenants.save(tenant);

      try {
        await this.audit.record('tenant_mfa_changed', {
          metadata: { next: dto.mfaEnabled, previous: previousMfa },
          tenantId: tenant.id,
          userId: actorId,
        });
      } catch {
        this.logger.error('Tenant MFA audit failed.');
      }
    }

    return this.toMfaSetting(tenant);
  }

  async create(
    dto: CreateTenantDto,
    photo?: Express.Multer.File,
  ): Promise<TenantCreatedDto> {
    if (photo) {
      this.assertPhoto(photo);
    }

    const name = dto.name.trim();
    const slug = dto.slug.trim();
    const email = this.normalizeEmail(dto.email);

    if (await this.findDuplicate(name, slug, email)) {
      throw new ConflictException(
        'A tenant with these details already exists.',
      );
    }

    let saved: Tenant | null = null;
    const aiTokenCostPerMillion = (await this.sharedAiTokenCost()).toFixed(4);

    try {
      saved = await this.tenants.save(
        this.tenants.create({
          aiTokenCostPerMillion,
          email,
          mfaEnabled: false,
          name,
          photoUrl: '',
          slug,
          status: 'active',
        }),
      );
      await this.tenantStorage.ensureTenantFolder(saved.id);

      if (photo) {
        saved.photoUrl = await this.writePhoto(saved.id, photo);
        saved = await this.tenants.save(saved);
      }

      return this.toCreatedDto(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A tenant with these details already exists.',
        );
      }

      if (saved && photo) {
        if (isPhotoPointer(saved.photoUrl)) {
          await this.tenantStorage.deleteTenantFile(
            saved.id,
            saved.photoUrl,
            'photo',
          );
        }

        await this.tenants.delete({ id: saved.id });
      }

      throw error;
    }
  }

  async deletePhoto(id: string): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    const previous = tenant.photoUrl ?? '';
    tenant.photoUrl = '';
    await this.tenants.save(tenant);

    if (isPhotoPointer(previous)) {
      await this.tenantStorage.deleteTenantFile(tenant.id, previous, 'photo');
    }
  }

  async replacePhoto(id: string, photo?: Express.Multer.File): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    if (!photo) {
      throw new BadRequestException('Invalid input.');
    }

    this.assertPhoto(photo);
    const previous = tenant.photoUrl ?? '';
    const pointer = await this.writePhoto(tenant.id, photo);
    tenant.photoUrl = pointer;
    await this.tenants.save(tenant);

    if (
      isPhotoPointer(previous) &&
      previous.toLowerCase() !== pointer.toLowerCase()
    ) {
      await this.tenantStorage.deleteTenantFile(tenant.id, previous, 'photo');
    }
  }

  async readPhoto(
    id: string,
    actor: { profile: string; tenantId: string },
  ): Promise<{ bytes: Buffer; contentType: string }> {
    if (actor.profile !== 'Administrador' && id !== actor.tenantId) {
      throw new ForbiddenException('Access denied.');
    }

    const tenant = await this.tenants.findOne({ where: { id } });
    const contentType = tenant ? photoContentType(tenant.photoUrl) : null;

    if (!tenant || !contentType) {
      throw new NotFoundException('Not found.');
    }

    try {
      return {
        bytes: await this.tenantStorage.readUserPhoto(
          tenant.id,
          tenant.photoUrl,
        ),
        contentType,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  private async sharedAiTokenCost(): Promise<number> {
    const [tenant] = await this.tenants.find({
      order: { name: 'ASC' },
      take: 1,
    });

    return tenant ? Number(tenant.aiTokenCostPerMillion) : 0.6;
  }

  private async findDuplicate(
    name: string,
    slug: string,
    email: string | null,
  ): Promise<Tenant | null> {
    const matches = await this.tenants.find({
      where: email ? [{ name }, { slug }, { email }] : [{ name }, { slug }],
    });

    return matches[0] ?? null;
  }

  private normalizeEmail(email?: string): string | null {
    if (!email) {
      return null;
    }

    const trimmed = email.trim();
    return trimmed === '' ? null : trimmed;
  }

  private toListDto(tenant: Tenant): TenantListItemDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  private toMfaSetting(tenant: Tenant): TenantMfaSettingDto {
    return {
      aiTokenCostPerMillion: Number(tenant.aiTokenCostPerMillion),
      id: tenant.id,
      mfaEnabled: tenant.mfaEnabled,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  private toCreatedDto(tenant: Tenant): TenantCreatedDto {
    return {
      email: tenant.email ?? null,
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  private assertPhoto(photo: Express.Multer.File): void {
    if (photo.size > MAX_PHOTO_BYTES || !detectPhoto(photo.buffer)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private async writePhoto(
    tenantId: string,
    photo: Express.Multer.File,
  ): Promise<string> {
    const detected = detectPhoto(photo.buffer);

    if (!detected) {
      throw new BadRequestException('Invalid input.');
    }

    const pointer = photoPointerForUser(tenantId, detected.extension);
    await this.tenantStorage.writeUserPhoto(tenantId, pointer, photo.buffer);
    return pointer;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof (error as QueryFailedError & { code?: string }).code ===
        'string' &&
      (error as QueryFailedError & { code: string }).code === '23505'
    );
  }
}
