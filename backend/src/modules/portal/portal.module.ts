import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { AdminAiPricingController } from './admin-ai-pricing.controller.js';
import { AdminTenantSettingsController } from './admin-tenant-settings.controller.js';
import { AbacService } from './abac.service.js';
import { AbacGuard } from './abac.guard.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuditService } from './audit.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { BootstrapAdminService } from './bootstrap-admin.service.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { MfaEmailChallenge } from './entities/mfa-email-challenge.entity.js';
import { RefreshSession } from './entities/refresh-session.entity.js';
import { SecurityAuditEvent } from './entities/security-audit-event.entity.js';
import { Tenant } from './entities/tenant.entity.js';
import { User } from './entities/user.entity.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from './guards/administrador-or-create-user.guard.js';
import { SelfOrAdministradorGuard } from './guards/self-or-administrador.guard.js';
import { TenantStorageService } from './tenant-storage.service.js';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersListGuard } from './guards/users-list.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([
      PasswordResetToken,
      MfaEmailChallenge,
      RefreshSession,
      SecurityAuditEvent,
      Tenant,
      User,
    ]),
    MailModule,
  ],
  controllers: [
    AdminAiPricingController,
    AdminTenantSettingsController,
    AuthController,
    TenantsController,
    UsersController,
  ],
  providers: [
    AbacGuard,
    AbacService,
    AccessTokenGuard,
    AdministradorGuard,
    AdministradorOrCreateUserGuard,
    SelfOrAdministradorGuard,
    AuditService,
    AuthService,
    BootstrapAdminService,
    TenantStorageService,
    TenantsService,
    UsersService,
    UsersListGuard,
  ],
  exports: [
    AbacGuard,
    AbacService,
    AuthService,
    BootstrapAdminService,
    JwtModule,
    TenantStorageService,
  ],
})
export class PortalModule {}
