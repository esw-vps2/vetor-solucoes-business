import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RateLimit } from '../../common/security/rate-limit.decorator.js';
import {
  createPowerBiDistributionExample,
  createPowerBiReportExample,
  powerBiCatalogReportExample,
  powerBiDistributionExample,
  powerBiEmbedTokenExample,
  powerBiMyReportExample,
  powerBiPageExample,
  powerBiPythonReportExample,
  powerBiStatusExample,
  powerBiWorkspaceExample,
  updatePowerBiDistributionExample,
  updatePowerBiReportExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from '../portal/access-token.guard.js';
import type { AuthenticatedRequest } from '../portal/auth.types.js';
import { AdministradorGuard } from '../portal/guards/administrador.guard.js';
import { ViewReportsGuard } from './guards/view-reports.guard.js';
import { CreatePowerBiDistributionDto } from './dto/create-powerbi-distribution.dto.js';
import { CreatePowerBiReportDto } from './dto/create-powerbi-report.dto.js';
import { PowerBiCatalogReportDto } from './dto/powerbi-catalog-report.dto.js';
import { PowerBiDistributionDto } from './dto/powerbi-distribution.dto.js';
import { PowerBiEmbedTokenDto } from './dto/powerbi-embed-token.dto.js';
import { PowerBiMyReportDto } from './dto/powerbi-my-report.dto.js';
import { PowerBiPageDto } from './dto/powerbi-page.dto.js';
import { PowerBiPythonReportDto } from './dto/powerbi-python-report.dto.js';
import { PowerBiWorkspaceDto } from './dto/powerbi-workspace.dto.js';
import { UpdatePowerBiDistributionDto } from './dto/update-powerbi-distribution.dto.js';
import { UpdatePowerBiReportDto } from './dto/update-powerbi-report.dto.js';
import { UpdatePowerBiStatusDto } from './dto/update-powerbi-status.dto.js';
import { PowerBiService } from './powerbi.service.js';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

const proxyRateLimit = {
  identifier: 'ip' as const,
  key: 'powerbi-proxy',
  maxEnvironmentVariable: 'POWERBI_PROXY_RATE_LIMIT_MAX',
  windowEnvironmentVariable: 'POWERBI_PROXY_RATE_LIMIT_WINDOW',
};

@ApiTags('powerbi')
@Controller('powerbi')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class PowerBiController {
  constructor(private readonly powerBiService: PowerBiService) {}

  @Get('workspaces')
  @UseGuards(AdministradorGuard)
  @RateLimit(proxyRateLimit)
  @ApiOperation({ summary: 'List Power BI workspaces from the report service' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiWorkspaceExample] },
    },
    isArray: true,
    type: PowerBiWorkspaceDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Report service unavailable' })
  listWorkspaces(): Promise<PowerBiWorkspaceDto[]> {
    return this.powerBiService.listWorkspaces();
  }

  @Get('workspaces/:workspaceId/reports')
  @UseGuards(AdministradorGuard)
  @RateLimit(proxyRateLimit)
  @ApiOperation({ summary: 'List Power BI reports in a workspace' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiPythonReportExample] },
    },
    isArray: true,
    type: PowerBiPythonReportDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Report service unavailable' })
  listWorkspaceReports(
    @Param('workspaceId', uuidPipe) workspaceId: string,
  ): Promise<PowerBiPythonReportDto[]> {
    return this.powerBiService.listWorkspaceReports(workspaceId);
  }

  @Get('workspaces/:workspaceId/reports/:reportId/pages')
  @UseGuards(AdministradorGuard)
  @RateLimit(proxyRateLimit)
  @ApiOperation({ summary: 'List pages for a Power BI report' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiPageExample] },
    },
    isArray: true,
    type: PowerBiPageDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Report service unavailable' })
  listWorkspaceReportPages(
    @Param('workspaceId', uuidPipe) workspaceId: string,
    @Param('reportId', uuidPipe) reportId: string,
  ): Promise<PowerBiPageDto[]> {
    return this.powerBiService.listWorkspaceReportPages(workspaceId, reportId);
  }

  @Get('relatorios')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'List imported Power BI reports' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiCatalogReportExample] },
    },
    isArray: true,
    type: PowerBiCatalogReportDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  listCatalog(): Promise<PowerBiCatalogReportDto[]> {
    return this.powerBiService.listCatalog();
  }

  @Post('relatorios')
  @UseGuards(AdministradorGuard)
  @RateLimit(proxyRateLimit)
  @ApiOperation({ summary: 'Import a Power BI report into the catalog' })
  @ApiBody({
    examples: { mock: { value: createPowerBiReportExample } },
    type: CreatePowerBiReportDto,
  })
  @ApiCreatedResponse({
    content: {
      'application/json': { example: powerBiCatalogReportExample },
    },
    type: PowerBiCatalogReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 409, description: 'Report already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Report service unavailable' })
  importReport(
    @Body() dto: CreatePowerBiReportDto,
  ): Promise<PowerBiCatalogReportDto> {
    return this.powerBiService.importReport(dto);
  }

  @Patch('relatorios/:id/status')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'Activate or deactivate an imported report' })
  @ApiBody({
    examples: { mock: { value: powerBiStatusExample } },
    type: UpdatePowerBiStatusDto,
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: powerBiCatalogReportExample },
    },
    type: PowerBiCatalogReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateReportStatus(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdatePowerBiStatusDto,
  ): Promise<PowerBiCatalogReportDto> {
    return this.powerBiService.updateReportStatus(id, dto);
  }

  @Patch('relatorios/:id')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'Update an imported report name and description' })
  @ApiBody({
    examples: { mock: { value: updatePowerBiReportExample } },
    type: UpdatePowerBiReportDto,
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: powerBiCatalogReportExample },
    },
    type: PowerBiCatalogReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateReport(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdatePowerBiReportDto,
  ): Promise<PowerBiCatalogReportDto> {
    return this.powerBiService.updateReport(id, dto);
  }

  @Get('relatorios/:id/distribuicoes')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'List distributions for an imported report' })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiDistributionExample] },
    },
    isArray: true,
    type: PowerBiDistributionDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  listDistributions(
    @Param('id', uuidPipe) id: string,
  ): Promise<PowerBiDistributionDto[]> {
    return this.powerBiService.listDistributions(id);
  }

  @Post('relatorios/:id/distribuicoes')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'Distribute an imported report to a tenant' })
  @ApiBody({
    examples: { mock: { value: createPowerBiDistributionExample } },
    type: CreatePowerBiDistributionDto,
  })
  @ApiCreatedResponse({
    content: {
      'application/json': { example: powerBiDistributionExample },
    },
    type: PowerBiDistributionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Already distributed' })
  distribute(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreatePowerBiDistributionDto,
  ): Promise<PowerBiDistributionDto> {
    return this.powerBiService.distribute(id, dto);
  }

  @Patch('distribuicoes/:id/status')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'Activate or deactivate a distribution' })
  @ApiBody({
    examples: { mock: { value: powerBiStatusExample } },
    type: UpdatePowerBiStatusDto,
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: powerBiDistributionExample },
    },
    type: PowerBiDistributionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateDistributionStatus(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdatePowerBiStatusDto,
  ): Promise<PowerBiDistributionDto> {
    return this.powerBiService.updateDistributionStatus(id, dto);
  }

  @Patch('distribuicoes/:id')
  @UseGuards(AdministradorGuard)
  @ApiOperation({ summary: 'Update a report distribution' })
  @ApiBody({
    examples: { mock: { value: updatePowerBiDistributionExample } },
    type: UpdatePowerBiDistributionDto,
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: powerBiDistributionExample },
    },
    type: PowerBiDistributionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateDistribution(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdatePowerBiDistributionDto,
  ): Promise<PowerBiDistributionDto> {
    return this.powerBiService.updateDistribution(id, dto);
  }

  @Get('meus-relatorios')
  @UseGuards(ViewReportsGuard)
  @ApiOperation({
    summary: 'List active reports distributed to the session tenant',
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: [powerBiMyReportExample] },
    },
    isArray: true,
    type: PowerBiMyReportDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  listMyReports(
    @Req() request: AuthenticatedRequest,
  ): Promise<PowerBiMyReportDto[]> {
    return this.powerBiService.listMyReports(request.user.tenantId);
  }

  @Post('meus-relatorios/:distribuicaoId/embed-token')
  @UseGuards(ViewReportsGuard)
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    identifier: 'ip',
    key: 'powerbi-embed-token',
    maxEnvironmentVariable: 'POWERBI_EMBED_TOKEN_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'POWERBI_EMBED_TOKEN_RATE_LIMIT_WINDOW',
  })
  @ApiOperation({ summary: 'Issue an embed token for a distributed report' })
  @ApiOkResponse({
    content: {
      'application/json': { example: powerBiEmbedTokenExample },
    },
    type: PowerBiEmbedTokenDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Report service unavailable' })
  createEmbedToken(
    @Param('distribuicaoId', uuidPipe) distribuicaoId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<PowerBiEmbedTokenDto> {
    return this.powerBiService.createEmbedToken(
      request.user.tenantId,
      distribuicaoId,
    );
  }
}
