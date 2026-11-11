import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Tenant } from '../portal/entities/tenant.entity.js';
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
import { PowerBiReportDistribution } from './entities/powerbi-report-distribution.entity.js';
import { PowerBiReport } from './entities/powerbi-report.entity.js';
import { PowerBiProxyService } from './powerbi-proxy.service.js';

@Injectable()
export class PowerBiService {
  constructor(
    @InjectRepository(PowerBiReport)
    private readonly reports: Repository<PowerBiReport>,
    @InjectRepository(PowerBiReportDistribution)
    private readonly distributions: Repository<PowerBiReportDistribution>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly proxy: PowerBiProxyService,
  ) {}

  listWorkspaces(): Promise<PowerBiWorkspaceDto[]> {
    return this.proxy.listWorkspaces();
  }

  listWorkspaceReports(workspaceId: string): Promise<PowerBiPythonReportDto[]> {
    return this.proxy.listReports(workspaceId);
  }

  listWorkspaceReportPages(
    workspaceId: string,
    reportId: string,
  ): Promise<PowerBiPageDto[]> {
    return this.proxy.listPages(workspaceId, reportId);
  }

  async listCatalog(): Promise<PowerBiCatalogReportDto[]> {
    const reports = await this.reports.find({ order: { name: 'ASC' } });
    return reports.map((report) => this.toCatalogDto(report));
  }

  async importReport(dto: CreatePowerBiReportDto): Promise<PowerBiCatalogReportDto> {
    const remote = await this.proxy.getReport(dto.workspaceId, dto.reportId);
    const report = this.reports.create({
      active: true,
      datasetId: remote.datasetId,
      description: dto.descricao?.trim() ? dto.descricao.trim() : null,
      embedUrl: remote.embedUrl,
      name: dto.nome.trim(),
      reportId: dto.reportId,
      workspaceId: dto.workspaceId,
    });

    try {
      const saved = await this.reports.save(report);
      return this.toCatalogDto(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('This report is already registered.');
      }
      throw error;
    }
  }

  async updateReport(
    id: string,
    dto: UpdatePowerBiReportDto,
  ): Promise<PowerBiCatalogReportDto> {
    const report = await this.requireReport(id);
    if (dto.nome !== undefined) {
      report.name = dto.nome.trim();
    }
    if (dto.descricao !== undefined) {
      report.description = dto.descricao.trim() ? dto.descricao.trim() : null;
    }
    return this.toCatalogDto(await this.reports.save(report));
  }

  async updateReportStatus(
    id: string,
    dto: UpdatePowerBiStatusDto,
  ): Promise<PowerBiCatalogReportDto> {
    const report = await this.requireReport(id);
    report.active = dto.ativo;
    return this.toCatalogDto(await this.reports.save(report));
  }

  async listDistributions(reportId: string): Promise<PowerBiDistributionDto[]> {
    await this.requireReport(reportId);
    const rows = await this.distributions.find({
      order: { sortOrder: 'ASC', displayName: 'ASC' },
      relations: { tenant: true },
      where: { reportId },
    });
    return rows.map((row) => this.toDistributionDto(row));
  }

  async distribute(
    reportId: string,
    dto: CreatePowerBiDistributionDto,
  ): Promise<PowerBiDistributionDto> {
    const report = await this.requireReport(reportId);
    if (!report.active) {
      throw new BadRequestException('Invalid input.');
    }

    const tenant = await this.tenants.findOne({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid input.');
    }

    const distribution = this.distributions.create({
      active: true,
      defaultPage: dto.paginaPadrao?.trim() ? dto.paginaPadrao.trim() : null,
      displayName: dto.nomeExibicao?.trim() ? dto.nomeExibicao.trim() : null,
      icon: dto.icone?.trim() ? dto.icone.trim() : null,
      reportId: report.id,
      sortOrder: dto.ordem ?? 0,
      tenantId: tenant.id,
    });

    try {
      const saved = await this.distributions.save(distribution);
      saved.tenant = tenant;
      return this.toDistributionDto(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'This report is already distributed to this tenant.',
        );
      }
      throw error;
    }
  }

  async updateDistribution(
    id: string,
    dto: UpdatePowerBiDistributionDto,
  ): Promise<PowerBiDistributionDto> {
    const distribution = await this.requireDistribution(id);
    if (dto.nomeExibicao !== undefined) {
      distribution.displayName = dto.nomeExibicao.trim()
        ? dto.nomeExibicao.trim()
        : null;
    }
    if (dto.icone !== undefined) {
      distribution.icon = dto.icone.trim() ? dto.icone.trim() : null;
    }
    if (dto.ordem !== undefined) {
      distribution.sortOrder = dto.ordem;
    }
    if (dto.paginaPadrao !== undefined) {
      distribution.defaultPage = dto.paginaPadrao.trim()
        ? dto.paginaPadrao.trim()
        : null;
    }
    const saved = await this.distributions.save(distribution);
    return this.toDistributionDto(await this.requireDistribution(saved.id));
  }

  async updateDistributionStatus(
    id: string,
    dto: UpdatePowerBiStatusDto,
  ): Promise<PowerBiDistributionDto> {
    const distribution = await this.requireDistribution(id);
    distribution.active = dto.ativo;
    await this.distributions.save(distribution);
    return this.toDistributionDto(await this.requireDistribution(id));
  }

  async listMyReports(tenantId: string): Promise<PowerBiMyReportDto[]> {
    const rows = await this.distributions.find({
      order: { sortOrder: 'ASC', displayName: 'ASC' },
      relations: { report: true },
      where: { active: true, report: { active: true }, tenantId },
    });

    return rows.map((row) => ({
      icone: row.icon,
      id: row.id,
      nomeExibicao: row.displayName,
      ordem: row.sortOrder,
      paginaPadrao: row.defaultPage,
      relatorio: {
        descricao: row.report.description,
        id: row.report.id,
        nome: row.report.name,
      },
      tenantId: row.tenantId,
    }));
  }

  async createEmbedToken(
    tenantId: string,
    distributionId: string,
  ): Promise<PowerBiEmbedTokenDto> {
    const distribution = await this.distributions.findOne({
      relations: { report: true },
      where: { id: distributionId },
    });

    if (!distribution) {
      throw new NotFoundException('Not found.');
    }

    if (distribution.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied.');
    }

    if (!distribution.active || !distribution.report.active) {
      throw new BadRequestException('Invalid input.');
    }

    const token = await this.proxy.generateEmbedToken(
      distribution.report.datasetId,
      distribution.report.reportId,
    );

    return {
      embedToken: token.token,
      embedUrl: distribution.report.embedUrl,
      expiration: token.expiration,
      id: distribution.id,
      nome: distribution.displayName || distribution.report.name,
      paginaPadrao: distribution.defaultPage,
    };
  }

  private async requireReport(id: string): Promise<PowerBiReport> {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Not found.');
    }
    return report;
  }

  private async requireDistribution(
    id: string,
  ): Promise<PowerBiReportDistribution> {
    const distribution = await this.distributions.findOne({
      relations: { tenant: true },
      where: { id },
    });
    if (!distribution) {
      throw new NotFoundException('Not found.');
    }
    return distribution;
  }

  private toCatalogDto(report: PowerBiReport): PowerBiCatalogReportDto {
    return {
      ativo: report.active,
      datasetId: report.datasetId,
      descricao: report.description,
      embedUrl: report.embedUrl,
      id: report.id,
      nome: report.name,
      reportId: report.reportId,
      workspaceId: report.workspaceId,
    };
  }

  private toDistributionDto(
    distribution: PowerBiReportDistribution,
  ): PowerBiDistributionDto {
    return {
      ativo: distribution.active,
      icone: distribution.icon,
      id: distribution.id,
      nomeExibicao: distribution.displayName,
      ordem: distribution.sortOrder,
      paginaPadrao: distribution.defaultPage,
      relatorioId: distribution.reportId,
      tenantId: distribution.tenantId,
      tenantName: distribution.tenant?.name ?? '',
      tenantSlug: distribution.tenant?.slug ?? '',
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    typeof (error as QueryFailedError & { code?: string }).code === 'string' &&
    (error as QueryFailedError & { code: string }).code === '23505'
  );
}
