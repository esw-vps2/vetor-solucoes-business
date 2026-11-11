import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import { FinanceProjectDocumentDto } from './dto/finance-document.dto.js';
import {
  financeDocumentPointerFor,
  isFinanceDocumentMime,
  matchesDeclaredFinanceDocumentType,
  matchesFinanceDocumentExtension,
  MAX_FINANCE_DOCUMENT_BYTES,
  MAX_FINANCE_DOCUMENTS,
  MAX_FINANCE_DOCUMENT_TOTAL_BYTES,
  safeFinanceDocumentName,
} from './finance-document-file.js';
import { FinanceProjectDocument } from './entities/finance-project-document.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';

type FinanceDocumentUpload = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class FinanceDocumentsService {
  constructor(
    @InjectRepository(FinanceProjectDocument)
    private readonly documents: Repository<FinanceProjectDocument>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectWorkspace)
    private readonly workspaces: Repository<ProjectWorkspace>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tenantStorage: TenantStorageService,
    private readonly config: ConfigService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<FinanceProjectDocumentDto[]> {
    const { project, tenantId } = await this.requireProject(actor, projectId);
    const rows = await this.documents.find({
      order: { createdAt: 'DESC', originalName: 'ASC' },
      where: { projectId: project.id, tenantId },
    });

    return rows.map((row) => this.toDto(row));
  }

  async upload(
    actor: AuthenticatedUser,
    projectId: string,
    file: FinanceDocumentUpload,
  ): Promise<FinanceProjectDocumentDto> {
    const { project, tenantId, user } = await this.requireProject(
      actor,
      projectId,
    );
    const originalName = safeFinanceDocumentName(file.originalname);
    const mime = file.mimetype;

    if (
      !originalName ||
      !isFinanceDocumentMime(mime) ||
      !matchesFinanceDocumentExtension(originalName, mime) ||
      file.size < 1 ||
      file.size > MAX_FINANCE_DOCUMENT_BYTES ||
      !matchesDeclaredFinanceDocumentType(mime, file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const vetorTenant = await this.requireVetorTenant();
    const documentId = randomUUID();
    const pointer = financeDocumentPointerFor(
      tenantId,
      project.id,
      documentId,
      mime,
    );

    await this.tenantStorage.writeTenantFile(
      vetorTenant.id,
      pointer,
      file.buffer,
      'finance',
    );

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const lockedProject = await manager.findOne(Project, {
          lock: { mode: 'pessimistic_write' },
          where: { id: project.id },
        });

        if (!lockedProject) {
          throw new NotFoundException('Not found.');
        }

        const repository = manager.getRepository(FinanceProjectDocument);
        const existing = await repository.find({
          select: { byteSize: true },
          where: { projectId: project.id },
        });
        const totalBytes = existing.reduce(
          (total, document) => total + document.byteSize,
          0,
        );

        if (
          existing.length >= MAX_FINANCE_DOCUMENTS ||
          totalBytes + file.size > MAX_FINANCE_DOCUMENT_TOTAL_BYTES
        ) {
          throw new BadRequestException('Invalid input.');
        }

        const document = repository.create({
          byteSize: file.size,
          contentType: mime,
          createdByUserId: user.id,
          originalName,
          projectId: project.id,
          storageFilename: pointer,
          tenantId,
        });

        return repository.save(document);
      });

      return this.toDto(saved);
    } catch (error) {
      await this.tenantStorage.deleteTenantFile(
        vetorTenant.id,
        pointer,
        'finance',
      );
      throw error;
    }
  }

  async read(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
  ): Promise<{
    bytes: Buffer;
    contentType: string;
    originalName: string;
  }> {
    const { project, tenantId } = await this.requireProject(actor, projectId);
    const document = await this.documents.findOne({
      where: { id: documentId, projectId: project.id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Not found.');
    }

    const vetorTenant = await this.requireVetorTenant();

    try {
      const bytes = await this.tenantStorage.readTenantFile(
        vetorTenant.id,
        document.storageFilename,
        'finance',
      );
      return {
        bytes,
        contentType: document.contentType,
        originalName: document.originalName,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Not found.');
      }

      throw error;
    }
  }

  async unlinkFilesForProjects(projectIds: string[]): Promise<void> {
    const uniqueProjectIds = [...new Set(projectIds)];

    if (uniqueProjectIds.length === 0) {
      return;
    }

    const rows = await this.documents.find({
      where: { projectId: In(uniqueProjectIds) },
    });

    if (rows.length === 0) {
      return;
    }

    const vetorTenant = await this.requireVetorTenant();

    for (const row of rows) {
      await this.tenantStorage.deleteTenantFile(
        vetorTenant.id,
        row.storageFilename,
        'finance',
      );
    }
  }

  private async requireProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ project: Project; tenantId: string; user: User }> {
    const user = await this.requireAdministrador(actor);
    const project = await this.projects.findOne({ where: { id: projectId } });
    const workspace = project
      ? await this.workspaces.findOne({ where: { id: project.workspaceId } })
      : null;

    if (!project || !workspace) {
      throw new NotFoundException('Not found.');
    }

    return { project, tenantId: workspace.tenantId, user };
  }

  private async requireAdministrador(actor: AuthenticatedUser): Promise<User> {
    const user = await this.users.findOne({
      where: { id: actor.id, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    return user;
  }

  private async requireVetorTenant(): Promise<Tenant> {
    const slug = this.config.get<string>(
      'BOOTSTRAP_ADMIN_TENANT_SLUG',
      'vetor',
    );
    const tenant = await this.tenants.findOne({ where: { slug } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    return tenant;
  }

  private toDto(document: FinanceProjectDocument): FinanceProjectDocumentDto {
    return {
      byteSize: document.byteSize,
      contentType: document.contentType,
      createdAt: document.createdAt.toISOString(),
      id: document.id,
      originalName: document.originalName,
      projectId: document.projectId,
    };
  }
}
