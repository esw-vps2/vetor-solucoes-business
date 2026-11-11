import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { isPhotoPointer } from './photo-url.js';
import {
  contractFileId,
  isAttachmentPointer,
  isContractPointer,
} from '../projects/attachment-file.js';
import { isFinanceDocumentPointer } from '../projects/finance-document-file.js';
import { isExpenseDocumentPointer } from '../expenses/expense-document-file.js';
import { isAiAttachmentPointer } from '../ai-agent/ai-attachment-file.js';

type TenantFileKind =
  | 'photo'
  | 'attachment'
  | 'contract'
  | 'finance'
  | 'expense'
  | 'ai';

const TENANT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantStorageService implements OnModuleInit {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureExistingTenantFolders();
  }

  async ensureTenantFolder(tenantId: string): Promise<string> {
    if (!TENANT_ID_PATTERN.test(tenantId)) {
      throw new Error('Invalid tenant id.');
    }

    const folder = join(this.root(), tenantId);
    await mkdir(folder, { recursive: true });
    return folder;
  }

  async ensureExistingTenantFolders(): Promise<void> {
    const tenants = await this.tenants.find();

    for (const tenant of tenants) {
      await this.ensureTenantFolder(tenant.id);
    }
  }

  async writeUserPhoto(
    tenantId: string,
    pointer: string,
    bytes: Buffer,
  ): Promise<void> {
    await this.writeTenantFile(tenantId, pointer, bytes, 'photo');
  }

  async readUserPhoto(tenantId: string, pointer: string): Promise<Buffer> {
    return this.readTenantFile(tenantId, pointer, 'photo');
  }

  async writeTenantFile(
    tenantId: string,
    pointer: string,
    bytes: Buffer,
    kind: TenantFileKind = 'attachment',
  ): Promise<void> {
    const path = this.tenantFilePath(tenantId, pointer, kind);
    await this.ensureTenantFolder(tenantId);

    if (kind === 'contract') {
      await mkdir(join(this.root(), tenantId, 'contracts'), {
        recursive: true,
      });
      const temporary = `${path}.tmp`;
      await writeFile(temporary, bytes);
      await rename(temporary, path);
      return;
    }

    if (kind === 'finance' || kind === 'expense' || kind === 'ai') {
      await mkdir(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      await writeFile(temporary, bytes);
      await rename(temporary, path);
      return;
    }

    await writeFile(path, bytes);
  }

  async readTenantFile(
    tenantId: string,
    pointer: string,
    kind: TenantFileKind = 'attachment',
  ): Promise<Buffer> {
    return readFile(this.tenantFilePath(tenantId, pointer, kind));
  }

  async deleteTenantFile(
    tenantId: string,
    pointer: string,
    kind: TenantFileKind = 'attachment',
  ): Promise<void> {
    try {
      await unlink(this.tenantFilePath(tenantId, pointer, kind));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private tenantFilePath(
    tenantId: string,
    pointer: string,
    kind: TenantFileKind,
  ): string {
    if (!TENANT_ID_PATTERN.test(tenantId)) {
      throw new Error('Invalid tenant id.');
    }

    if (kind === 'contract') {
      const projectId = isContractPointer(pointer)
        ? contractFileId(pointer)
        : null;

      if (!projectId) {
        throw new Error('Invalid attachment pointer.');
      }

      return join(this.root(), tenantId, 'contracts', `${projectId}.pdf`);
    }

    const validPointer =
      kind === 'photo'
        ? isPhotoPointer(pointer)
        : kind === 'finance'
          ? isFinanceDocumentPointer(pointer)
          : kind === 'expense'
            ? isExpenseDocumentPointer(pointer)
            : kind === 'ai'
              ? isAiAttachmentPointer(pointer)
              : isAttachmentPointer(pointer);

    if (!validPointer) {
      throw new Error(
        kind === 'photo'
          ? 'Invalid photo pointer.'
          : kind === 'finance'
            ? 'Invalid finance document pointer.'
            : kind === 'expense'
              ? 'Invalid expense document pointer.'
              : kind === 'ai'
                ? 'Invalid AI attachment pointer.'
                : 'Invalid attachment pointer.',
      );
    }

    return join(this.root(), tenantId, pointer);
  }

  private root(): string {
    return (
      this.config.get<string>('TENANT_FILES_ROOT') ??
      join(process.cwd(), '../infrastructure/repository/files')
    );
  }
}
