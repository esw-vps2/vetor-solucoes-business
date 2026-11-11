import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinanceProjectDocument } from './entities/finance-project-document.entity.js';
import {
  MAX_FINANCE_DOCUMENTS,
  MAX_FINANCE_DOCUMENT_TOTAL_BYTES,
} from './finance-document-file.js';
import { FinanceDocumentsService } from './finance-documents.service.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';

const tenantId = '22222222-2222-4222-8222-222222222222';
const vetorTenantId = '33333333-3333-4333-8333-333333333333';
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const documentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const adminId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function actor(profile: string = 'Administrador') {
  return {
    id: adminId,
    profile,
    sessionId: 'session-id',
    tenantId,
  } as const;
}

function pdfFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: Buffer.from('%PDF-1.7'),
    destination: '',
    encoding: '7bit',
    fieldname: 'file',
    filename: '',
    mimetype: 'application/pdf',
    originalname: 'budget.pdf',
    path: '',
    size: 8,
    stream: undefined as never,
    ...overrides,
  };
}

describe('FinanceDocumentsService', () => {
  function createService(options?: {
    existing?: FinanceProjectDocument[];
    document?: FinanceProjectDocument | null;
    profile?: string;
  }) {
    const user = Object.assign(new User(), {
      id: adminId,
      profile: options?.profile ?? 'Administrador',
      status: 'active',
      tenantId,
    });
    const project = Object.assign(new Project(), {
      id: projectId,
      name: 'Website',
      workspaceId,
    });
    const workspace = Object.assign(new ProjectWorkspace(), {
      id: workspaceId,
      tenantId,
    });
    const vetorTenant = Object.assign(new Tenant(), {
      id: vetorTenantId,
      slug: 'vetor',
    });
    const existing = options?.existing ?? [];
    const documentRepository = {
      create: vi.fn((value: Partial<FinanceProjectDocument>) =>
        Object.assign(new FinanceProjectDocument(), value, {
          createdAt: new Date('2026-10-14T10:00:00.000Z'),
          id: documentId,
        }),
      ),
      find: vi.fn().mockResolvedValue(existing),
      findOne: vi.fn().mockResolvedValue(options?.document ?? null),
      save: vi.fn(async (value: FinanceProjectDocument) => value),
    };
    const manager = {
      findOne: vi.fn().mockResolvedValue(project),
      getRepository: vi.fn().mockReturnValue(documentRepository),
    };
    const projects = {
      findOne: vi.fn().mockResolvedValue(project),
    };
    const workspaces = {
      findOne: vi.fn().mockResolvedValue(workspace),
    };
    const tenants = {
      findOne: vi.fn().mockResolvedValue(vetorTenant),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue(user),
    };
    const dataSource = {
      transaction: vi.fn(
        async (callback: (value: typeof manager) => Promise<unknown>) =>
          callback(manager),
      ),
    };
    const tenantStorage = {
      deleteTenantFile: vi.fn().mockResolvedValue(undefined),
      readTenantFile: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.7')),
      writeTenantFile: vi.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: vi.fn().mockReturnValue('vetor'),
    } as unknown as ConfigService;
    const documents = {
      find: vi.fn().mockResolvedValue(existing),
      findOne: vi.fn().mockResolvedValue(options?.document ?? null),
    };
    const service = new FinanceDocumentsService(
      documents as never,
      projects as never,
      workspaces as never,
      tenants as never,
      users as never,
      dataSource as never,
      tenantStorage as never,
      config,
    );

    return {
      dataSource,
      documentRepository,
      documents,
      project,
      service,
      tenantStorage,
    };
  }

  it('lists documents only for the requested project and tenant', async () => {
    const document = Object.assign(new FinanceProjectDocument(), {
      byteSize: 8,
      contentType: 'application/pdf',
      createdAt: new Date('2026-10-14T10:00:00.000Z'),
      id: documentId,
      originalName: 'budget.pdf',
      projectId,
      tenantId,
    });
    const { documents, service } = createService({ existing: [document] });

    await expect(service.list(actor(), projectId)).resolves.toEqual([
      {
        byteSize: 8,
        contentType: 'application/pdf',
        createdAt: '2026-10-14T10:00:00.000Z',
        id: documentId,
        originalName: 'budget.pdf',
        projectId,
      },
    ]);
    expect(documents.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC', originalName: 'ASC' },
      where: { projectId, tenantId },
    });
  });

  it('rejects non-global administrators', async () => {
    const { service } = createService({ profile: 'AdministradorTenant' });

    await expect(
      service.list(actor('AdministradorTenant'), projectId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores a document below the VETOR root with trusted project metadata', async () => {
    const { dataSource, documentRepository, tenantStorage, service } =
      createService();

    await expect(
      service.upload(actor(), projectId, pdfFile()),
    ).resolves.toMatchObject({
      byteSize: 8,
      contentType: 'application/pdf',
      id: documentId,
      originalName: 'budget.pdf',
      projectId,
    });
    expect(tenantStorage.writeTenantFile).toHaveBeenCalledWith(
      vetorTenantId,
      expect.stringMatching(
        new RegExp(`^finance/${tenantId}/${projectId}/[0-9a-f-]+\\.pdf$`),
      ),
      Buffer.from('%PDF-1.7'),
      'finance',
    );
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        byteSize: 8,
        contentType: 'application/pdf',
        createdByUserId: adminId,
        originalName: 'budget.pdf',
        projectId,
        tenantId,
      }),
    );
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects unsafe names and content mismatches before writing bytes', async () => {
    const { service, tenantStorage } = createService();

    await expect(
      service.upload(
        actor(),
        projectId,
        pdfFile({ originalname: '../secret.pdf' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upload(
        actor(),
        projectId,
        pdfFile({
          buffer: Buffer.from('not a pdf'),
          originalname: 'budget.pdf',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upload(actor(), projectId, {
        ...pdfFile(),
        buffer: Buffer.from('<svg><script>alert(1)</script></svg>'),
        mimetype: 'text/plain',
        originalname: 'notes.txt',
        size: 36,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tenantStorage.writeTenantFile).not.toHaveBeenCalled();
  });

  it('rejects aggregate and document-count limits and removes the staged file', async () => {
    const atTotal = Array.from({ length: 20 }, (_, index) =>
      Object.assign(new FinanceProjectDocument(), {
        byteSize: 25 * 1024 * 1024,
        id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      }),
    );
    const totalContext = createService({ existing: atTotal });

    await expect(
      totalContext.service.upload(actor(), projectId, pdfFile()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(totalContext.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      vetorTenantId,
      expect.stringMatching(
        new RegExp(`^finance/${tenantId}/${projectId}/[0-9a-f-]+\\.pdf$`),
      ),
      'finance',
    );

    const countContext = createService({
      existing: Array.from({ length: MAX_FINANCE_DOCUMENTS }, () =>
        Object.assign(new FinanceProjectDocument(), { byteSize: 1 }),
      ),
    });
    await expect(
      countContext.service.upload(actor(), projectId, pdfFile()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(MAX_FINANCE_DOCUMENT_TOTAL_BYTES).toBe(500 * 1024 * 1024);
  });

  it('downloads only a document belonging to the requested project', async () => {
    const document = Object.assign(new FinanceProjectDocument(), {
      contentType: 'application/pdf',
      id: documentId,
      originalName: 'budget.pdf',
      projectId,
      storageFilename: `finance/${tenantId}/${projectId}/${documentId}.pdf`,
      tenantId,
    });
    const context = createService({ document });

    await expect(
      context.service.read(actor(), projectId, documentId),
    ).resolves.toEqual({
      bytes: Buffer.from('%PDF-1.7'),
      contentType: 'application/pdf',
      originalName: 'budget.pdf',
    });
    expect(context.tenantStorage.readTenantFile).toHaveBeenCalledWith(
      vetorTenantId,
      document.storageFilename,
      'finance',
    );
  });

  it('unlinks finance document bytes before project deletion', async () => {
    const document = Object.assign(new FinanceProjectDocument(), {
      id: documentId,
      projectId,
      storageFilename: `finance/${tenantId}/${projectId}/${documentId}.pdf`,
    });
    const context = createService({ existing: [document] });

    await context.service.unlinkFilesForProjects([projectId, projectId]);

    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      vetorTenantId,
      document.storageFilename,
      'finance',
    );
  });

  it('returns not found when the requested document is not linked to the project', async () => {
    const context = createService();

    await expect(
      context.service.read(actor(), projectId, documentId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(context.tenantStorage.readTenantFile).not.toHaveBeenCalled();
  });
});
