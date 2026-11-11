import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { TenantMfaSettingDto } from './dto/tenant-mfa-setting.dto.js';
import { UpdateTenantMfaDto } from './dto/update-tenant-mfa.dto.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { TenantsService } from './tenants.service.js';

@ApiTags('admin')
@Controller('admin/tenant-settings')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class AdminTenantSettingsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List MFA settings for every tenant' })
  @ApiOkResponse({ type: TenantMfaSettingDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async list(): Promise<TenantMfaSettingDto[]> {
    return this.tenantsService.listMfaSettings();
  }

  @Patch(':tenantId')
  @ApiOperation({ summary: 'Set MFA for one tenant' })
  @ApiOkResponse({ type: TenantMfaSettingDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Body() dto: UpdateTenantMfaDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<TenantMfaSettingDto> {
    return this.tenantsService.updateMfaEnabled(tenantId, dto, request.user.id);
  }
}
