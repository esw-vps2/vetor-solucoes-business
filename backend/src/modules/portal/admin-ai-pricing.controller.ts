import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { AiTokenPricingDto } from './dto/ai-token-pricing.dto.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { TenantsService } from './tenants.service.js';

@ApiTags('admin')
@Controller('admin/ai-pricing')
@UseGuards(AccessTokenGuard, AdministradorGuard)
@ApiCookieAuth('access-cookie')
export class AdminAiPricingController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Read the shared Agente Beta token price' })
  @ApiOkResponse({ type: AiTokenPricingDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  get(): Promise<AiTokenPricingDto> {
    return this.tenantsService.getSharedAiTokenPricing();
  }

  @Patch()
  @ApiOperation({ summary: 'Set the Agente Beta token price for every tenant' })
  @ApiOkResponse({ type: AiTokenPricingDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Body() dto: AiTokenPricingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AiTokenPricingDto> {
    return this.tenantsService.updateSharedAiTokenPricing(
      dto.aiTokenCostPerMillion,
      request.user.id,
    );
  }
}
