import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import { TenantStorageService } from './tenant-storage.service.js';

const BCRYPT_COST = 12;

const BOOTSTRAP_ADMIN_PROFILE = {
  age: 40,
  cargo: '',
  firstName: 'Admin',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  sex: 'M',
} as const;

@Injectable()
export class BootstrapAdminService {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly tenantStorage: TenantStorageService,
  ) {}

  async ensure(): Promise<void> {
    const email = this.config
      .get<string>('BOOTSTRAP_ADMIN_EMAIL', 'admin@vetor.tech')
      .toLowerCase();
    const tenantName = this.config.get<string>(
      'BOOTSTRAP_ADMIN_TENANT_NAME',
      'VETOR',
    );
    const tenantSlug = this.config.get<string>(
      'BOOTSTRAP_ADMIN_TENANT_SLUG',
      'vetor',
    );
    const tenant = await this.ensureTenant(tenantName, tenantSlug);
    await this.tenantStorage.ensureTenantFolder(tenant.id);
    const existing = await this.users.findOne({
      where: { email, tenantId: tenant.id },
    });

    if (existing) {
      await this.syncBootstrapProfile(existing);
      await this.tenantStorage.ensureExistingTenantFolders();
      this.logger.log('Bootstrap administrator already exists.');
      return;
    }

    const password = this.config.get<string>('BOOTSTRAP_ADMIN_PASSWORD');

    if (!password) {
      throw new Error(
        'Missing BOOTSTRAP_ADMIN_PASSWORD for bootstrap administrator creation.',
      );
    }

    await this.users.save(
      this.users.create({
        ...BOOTSTRAP_ADMIN_PROFILE,
        email,
        enabledActions: [],
        passwordHash: await bcrypt.hash(password, BCRYPT_COST),
        profile: 'Administrador',
        status: 'active',
        tenantId: tenant.id,
      }),
    );
    await this.tenantStorage.ensureExistingTenantFolders();
    this.logger.log('Bootstrap administrator created.');
  }

  private async syncBootstrapProfile(user: User): Promise<void> {
    const needsUpdate =
      user.firstName !== BOOTSTRAP_ADMIN_PROFILE.firstName ||
      user.lastName !== BOOTSTRAP_ADMIN_PROFILE.lastName ||
      user.age !== BOOTSTRAP_ADMIN_PROFILE.age ||
      user.sex !== BOOTSTRAP_ADMIN_PROFILE.sex ||
      user.photoUrl !== BOOTSTRAP_ADMIN_PROFILE.photoUrl;

    if (!needsUpdate) {
      return;
    }

    user.firstName = BOOTSTRAP_ADMIN_PROFILE.firstName;
    user.lastName = BOOTSTRAP_ADMIN_PROFILE.lastName;
    user.age = BOOTSTRAP_ADMIN_PROFILE.age;
    user.sex = BOOTSTRAP_ADMIN_PROFILE.sex;
    user.photoUrl = BOOTSTRAP_ADMIN_PROFILE.photoUrl;
    await this.users.save(user);
  }

  private async ensureTenant(name: string, slug: string): Promise<Tenant> {
    const existing = await this.tenants.findOne({ where: { slug } });

    if (existing) {
      return existing;
    }

    const tenant = await this.tenants.save(
      this.tenants.create({
        mfaEnabled: false,
        name,
        photoUrl: '',
        slug,
        status: 'active',
      }),
    );
    await this.tenantStorage.ensureTenantFolder(tenant.id);
    return tenant;
  }
}
