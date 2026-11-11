import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { FinanceController } from '../src/modules/projects/finance.controller.js';
import { ProjectFinanceController } from '../src/modules/projects/project-finance.controller.js';
import { ProjectFinanceService } from '../src/modules/projects/project-finance.service.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { Project } from '../src/modules/projects/entities/project.entity.js';
import { ProjectContractInstallment } from '../src/modules/projects/entities/project-contract-installment.entity.js';
import { ProjectContract } from '../src/modules/projects/entities/project-contract.entity.js';
import { ProjectCost } from '../src/modules/projects/entities/project-cost.entity.js';
import { ProjectPayment } from '../src/modules/projects/entities/project-payment.entity.js';
import { ProjectWorkspace } from '../src/modules/projects/entities/project-workspace.entity.js';
import { Tenant } from '../src/modules/portal/entities/tenant.entity.js';
import { TenantStorageService } from '../src/modules/portal/tenant-storage.service.js';
import { TenantNotesService } from '../src/modules/projects/tenant-notes.service.js';
import { FinanceDocumentsService } from '../src/modules/projects/finance-documents.service.js';

const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherProjectId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const paymentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const costId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const tenantId = '22222222-2222-4222-8222-222222222222';
const noteId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const documentId = '11111111-1111-4111-8111-111111111111';
const pdf = Buffer.from('%PDF-1.4');

const contractBody = {
  installmentCount: 1,
  installments: [{ amountCents: 100000 }],
  status: 'active',
  title: 'Contrato 1',
  totalAmountCents: 100000,
};

const totals = {
  contractedResultAmountCents: 60000,
  costAmountCents: 40000,
  openAmountCents: -50000,
  paidAmountCents: 150000,
  resultAmountCents: 110000,
  totalAmountCents: 100000,
};

function financeRoutes(server: Server) {
  return [
    () => request(server).get('/api/v1/finance/projects'),
    () =>
      request(server).get(`/api/v1/finance/projects/${projectId}/documents`),
    () =>
      request(server)
        .post(`/api/v1/finance/projects/${projectId}/documents`)
        .attach('file', pdf, {
          contentType: 'application/pdf',
          filename: 'document.pdf',
        }),
    () =>
      request(server).get(
        `/api/v1/finance/projects/${projectId}/documents/${documentId}`,
      ),
    () => request(server).get(`/api/v1/projects/${projectId}/finance`),
    () =>
      request(server)
        .put(`/api/v1/projects/${projectId}/contract`)
        .send(contractBody),
    () =>
      request(server)
        .post(`/api/v1/projects/${projectId}/contract/file`)
        .attach('file', pdf, {
          contentType: 'application/pdf',
          filename: 'c.pdf',
        }),
    () => request(server).get(`/api/v1/projects/${projectId}/contract/file`),
    () => request(server).delete(`/api/v1/projects/${projectId}/contract/file`),
    () =>
      request(server)
        .post(`/api/v1/projects/${projectId}/payments`)
        .send({ amountCents: 100, paidOn: '2026-09-21' }),
    () =>
      request(server)
        .patch(`/api/v1/projects/${projectId}/payments/${paymentId}`)
        .send({ amountCents: 100, paidOn: '2026-09-21' }),
    () =>
      request(server).delete(
        `/api/v1/projects/${projectId}/payments/${paymentId}`,
      ),
    () =>
      request(server)
        .post(`/api/v1/projects/${projectId}/costs`)
        .send({ amountCents: 100, category: 'team', incurredOn: '2026-09-21' }),
    () =>
      request(server)
        .patch(`/api/v1/projects/${projectId}/costs/${costId}`)
        .send({ amountCents: 100, category: 'team', incurredOn: '2026-09-21' }),
    () =>
      request(server).delete(`/api/v1/projects/${projectId}/costs/${costId}`),
    () =>
      request(server)
        .put(`/api/v1/projects/${projectId}/cost-lines`)
        .send({ lines: [] }),
    () => request(server).delete(`/api/v1/finance/projects/${projectId}`),
    () => request(server).get(`/api/v1/finance/tenants/${tenantId}/notes`),
    () =>
      request(server)
        .post(`/api/v1/finance/tenants/${tenantId}/notes`)
        .send({ body: 'Note body', title: 'Note title' }),
    () =>
      request(server)
        .patch(`/api/v1/finance/tenants/${tenantId}/notes/${noteId}`)
        .send({ body: 'Note body', title: 'Note title' }),
    () =>
      request(server).delete(
        `/api/v1/finance/tenants/${tenantId}/notes/${noteId}`,
      ),
  ];
}

describe('Finance API', () => {
  let app: INestApplication<Server>;
  const finance = {
    createCost: vi.fn().mockResolvedValue({ id: costId }),
    createPayment: vi.fn().mockResolvedValue({ id: paymentId }),
    deleteContractFile: vi.fn().mockResolvedValue(undefined),
    deleteCost: vi.fn().mockResolvedValue(undefined),
    deletePayment: vi.fn().mockResolvedValue(undefined),
    getProject: vi.fn().mockResolvedValue({
      contract: null,
      costs: [],
      payments: [],
      projectId,
      ...totals,
    }),
    list: vi.fn().mockResolvedValue({
      projects: [
        {
          contract: {
            hasFile: false,
            originalName: null,
            status: 'active',
            title: 'Contrato 1',
            totalAmountCents: 100000,
          },
          projectId,
          projectName: 'Portal',
          workspaceName: 'Delivery',
          ...totals,
        },
      ],
      tenantId: '22222222-2222-4222-8222-222222222222',
      tenantName: 'Example',
      totals,
    }),
    readContractFile: vi.fn().mockResolvedValue({
      bytes: pdf,
      originalName: 'contract.pdf',
    }),
    replaceCostLines: vi.fn().mockResolvedValue([]),
    saveContractFile: vi.fn().mockResolvedValue({
      hasFile: true,
      originalName: 'contract.pdf',
    }),
    unlinkContractFiles: vi.fn().mockResolvedValue(undefined),
    updateCost: vi.fn().mockResolvedValue({ id: costId }),
    updatePayment: vi.fn().mockResolvedValue({ id: paymentId }),
    upsertContract: vi.fn().mockResolvedValue({
      hasFile: false,
      originalName: null,
      status: 'active',
      title: 'Contrato 1',
      totalAmountCents: 100000,
    }),
  };

  const projects = {
    deleteProjectAnywhere: vi.fn().mockResolvedValue(undefined),
  };
  const financeDocuments = {
    list: vi.fn().mockResolvedValue([]),
    read: vi.fn().mockResolvedValue({
      bytes: pdf,
      contentType: 'application/pdf',
      originalName: 'document.pdf',
    }),
    upload: vi.fn().mockResolvedValue({
      byteSize: pdf.length,
      contentType: 'application/pdf',
      createdAt: '2026-10-14T10:00:00.000Z',
      id: documentId,
      originalName: 'document.pdf',
      projectId,
    }),
  };
  const notes = {
    create: vi.fn().mockResolvedValue({
      body: 'Note body',
      id: noteId,
      title: 'Note title',
      updatedAt: '2026-09-21T12:00:00.000Z',
    }),
    list: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue({
      body: 'Note body',
      id: noteId,
      title: 'Note title',
      updatedAt: '2026-09-21T12:00:00.000Z',
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController, ProjectFinanceController],
      providers: [
        { provide: ProjectFinanceService, useValue: finance },
        { provide: FinanceDocumentsService, useValue: financeDocuments },
        { provide: ProjectsService, useValue: projects },
        { provide: TenantNotesService, useValue: notes },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: { id: string } } };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'admin-id' };
          return true;
        },
      })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('saves a contract, entries, and a PDF, then returns recomputed totals', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send(contractBody)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/payments`)
      .send({ amountCents: 150000, note: '  ', paidOn: '2026-09-21' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/payments/${paymentId}`)
      .send({ amountCents: 150000, paidOn: '2026-09-22' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}/payments/${paymentId}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/costs`)
      .send({ amountCents: 40000, category: 'team', incurredOn: '2026-09-21' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/costs/${costId}`)
      .send({
        amountCents: 40000,
        category: 'infrastructure',
        incurredOn: '2026-09-21',
      })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}/costs/${costId}`)
      .expect(204);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/cost-lines`)
      .send({
        lines: [
          { amountCents: 40000, label: 'Infraestrutura' },
          { amountCents: 30000, label: 'imposto' },
        ],
      })
      .expect(200);
    expect(finance.replaceCostLines).toHaveBeenCalledWith(
      { id: 'admin-id' },
      projectId,
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            amountCents: 40000,
            label: 'Infraestrutura',
          }),
          expect.objectContaining({ amountCents: 30000, label: 'imposto' }),
        ],
      }),
    );
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/cost-lines`)
      .send({ lines: [] })
      .expect(200);

    const file = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/contract/file`)
      .attach('file', pdf, {
        contentType: 'application/pdf',
        filename: 'contract.pdf',
      })
      .expect(201);

    expect(file.body).toEqual({ hasFile: true, originalName: 'contract.pdf' });
    expect(JSON.stringify(file.body)).not.toContain('contracts/');
    expect(JSON.stringify(file.body)).not.toContain('infrastructure');

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/contract/file`)
      .attach('file', pdf, {
        contentType: 'application/pdf',
        filename: 'next.pdf',
      })
      .expect(201);
    expect(finance.saveContractFile).toHaveBeenCalledTimes(2);

    const downloaded = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/contract/file`)
      .expect(200);
    expect(downloaded.headers['content-type']).toContain('application/pdf');
    expect(downloaded.body).toEqual(pdf);

    const list = await request(app.getHttpServer())
      .get('/api/v1/finance/projects')
      .expect(200);
    expect(list.body.totals).toEqual(totals);
    expect(list.body.projects[0].resultAmountCents).toBe(110000);
    expect(list.body.projects[0].contractedResultAmountCents).toBe(60000);
  });

  it('rejects a non-PDF and a PDF larger than 10 MB', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/contract/file`)
      .attach('file', Buffer.from('hello'), {
        contentType: 'text/plain',
        filename: 'notes.txt',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/contract/file`)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1, 1), {
        contentType: 'application/pdf',
        filename: 'big.pdf',
      })
      .expect(400);
    expect(finance.saveContractFile).not.toHaveBeenCalled();
  });

  it('rejects invalid contract, payment, and cost input', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({ status: 'active', totalAmountCents: 1 })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({
        ...contractBody,
        endsOn: '2026-01-01',
        startsOn: '2026-02-01',
      })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({ ...contractBody, status: 'signed' })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({ ...contractBody, projectId })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({ ...contractBody, installmentCount: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({ ...contractBody, installmentCount: 2 })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({
        ...contractBody,
        installments: [{ amountCents: 100000000000 }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({
        ...contractBody,
        installments: [{ amountCents: 100000, dueOn: '2026-02-31' }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/contract`)
      .send({
        ...contractBody,
        installments: [{ amountCents: 100000, dueOn: 'ontem' }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/cost-lines`)
      .send({
        lines: [{ amountCents: 100, label: 'a'.repeat(81) }],
      })
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/cost-lines`)
      .send({
        lines: Array.from({ length: 501 }, () => ({
          amountCents: 1,
          label: 'Custo',
        })),
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/payments`)
      .send({ amountCents: 0, paidOn: '2026-09-21' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/costs`)
      .send({ amountCents: 100, category: 'tax', incurredOn: '2026-09-21' })
      .expect(400);
    expect(finance.upsertContract).not.toHaveBeenCalled();
    expect(finance.createPayment).not.toHaveBeenCalled();
    expect(finance.createCost).not.toHaveBeenCalled();
    expect(finance.replaceCostLines).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .delete(`/api/v1/finance/projects/${projectId}`)
      .expect(204);
    expect(projects.deleteProjectAnywhere).toHaveBeenCalledWith(
      { id: 'admin-id' },
      projectId,
    );
  });
});

describe('Finance API without a session', () => {
  let app: INestApplication<Server>;
  const finance = { list: vi.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController, ProjectFinanceController],
      providers: [
        { provide: ProjectFinanceService, useValue: finance },
        {
          provide: FinanceDocumentsService,
          useValue: { list: vi.fn(), read: vi.fn(), upload: vi.fn() },
        },
        {
          provide: ProjectsService,
          useValue: { deleteProjectAnywhere: vi.fn() },
        },
        { provide: TenantNotesService, useValue: { list: vi.fn() } },
        AccessTokenGuard,
        AdministradorGuard,
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'secret' } },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 on every finance route', async () => {
    for (const call of financeRoutes(app.getHttpServer())) {
      await call().expect(401);
    }
    expect(finance.list).not.toHaveBeenCalled();
  });
});

describe('Finance API as a non-administrator', () => {
  let app: INestApplication<Server>;
  const finance = { list: vi.fn(), getProject: vi.fn() };
  const users = { findOne: vi.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController, ProjectFinanceController],
      providers: [
        { provide: ProjectFinanceService, useValue: finance },
        {
          provide: FinanceDocumentsService,
          useValue: { list: vi.fn(), read: vi.fn(), upload: vi.fn() },
        },
        {
          provide: ProjectsService,
          useValue: { deleteProjectAnywhere: vi.fn() },
        },
        { provide: TenantNotesService, useValue: { list: vi.fn() } },
        { provide: getRepositoryToken(User), useValue: users },
        AdministradorGuard,
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'actor-id' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each(['Usuario', 'AdministradorTenant'])(
    'returns 403 for %s on every finance route',
    async (profile) => {
      users.findOne.mockResolvedValue({
        enabledActions: ['viewProjects', 'manageProjects'],
        id: 'actor-id',
        profile,
        status: 'active',
      });

      for (const call of financeRoutes(app.getHttpServer())) {
        await call().expect(403);
      }
      expect(finance.list).not.toHaveBeenCalled();
      expect(finance.getProject).not.toHaveBeenCalled();
    },
  );
});

describe('Finance API tenant boundary and entry limit', () => {
  let app: INestApplication<Server>;
  const users = { findOne: vi.fn() };
  const projects = {
    find: vi.fn(),
    findOne: vi.fn(),
    manager: { query: vi.fn() },
  };
  const workspaces = { find: vi.fn(), findOne: vi.fn() };
  const contracts = {
    create: vi.fn((value) => value),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const payments = {
    count: vi.fn(),
    create: vi.fn((value) => value),
    delete: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const costs = {
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    delete: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    users.findOne.mockResolvedValue({
      id: 'admin-id',
      profile: 'Administrador',
      status: 'active',
    });
    projects.findOne.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === otherProjectId) {
          return { id: otherProjectId, workspaceId: 'other-workspace' };
        }
        return null;
      },
    );
    workspaces.findOne.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === 'other-workspace') {
          return {
            id: 'other-workspace',
            tenantId: '33333333-3333-4333-8333-333333333333',
          };
        }
        return null;
      },
    );
    payments.count.mockResolvedValue(500);
    projects.manager.query.mockResolvedValue([]);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController, ProjectFinanceController],
      providers: [
        ProjectFinanceService,
        {
          provide: FinanceDocumentsService,
          useValue: { list: vi.fn(), read: vi.fn(), upload: vi.fn() },
        },
        {
          provide: ProjectsService,
          useValue: { deleteProjectAnywhere: vi.fn() },
        },
        { provide: TenantNotesService, useValue: { list: vi.fn() } },
        AdministradorGuard,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Project), useValue: projects },
        { provide: getRepositoryToken(ProjectWorkspace), useValue: workspaces },
        { provide: getRepositoryToken(ProjectContract), useValue: contracts },
        {
          provide: getRepositoryToken(ProjectContractInstallment),
          useValue: { find: vi.fn().mockResolvedValue([]) },
        },
        { provide: getRepositoryToken(ProjectPayment), useValue: payments },
        { provide: getRepositoryToken(ProjectCost), useValue: costs },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: vi.fn().mockResolvedValue({
              id: '22222222-2222-4222-8222-222222222222',
              name: 'Example',
            }),
          },
        },
        {
          provide: TenantStorageService,
          useValue: { deleteTenantFile: vi.fn(), writeTenantFile: vi.fn() },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: 'admin-id',
            profile: 'Administrador',
            sessionId: 'session',
            tenantId: '22222222-2222-4222-8222-222222222222',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns finance for a project in another tenant and 404 when it is missing', async () => {
    projects.manager.query.mockResolvedValue([
      {
        contractFilename: null,
        contractId: null,
        costAmountCents: 0,
        endsOn: null,
        originalName: null,
        paidAmountCents: 0,
        projectId: otherProjectId,
        projectName: 'Site',
        signedOn: null,
        startsOn: null,
        status: null,
        tenantId: '33333333-3333-4333-8333-333333333333',
        tenantName: 'Acme',
        title: null,
        totalAmountCents: null,
        workspaceId: 'other-workspace',
        workspaceName: 'Growth',
      },
    ]);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/projects/${otherProjectId}/finance`)
      .expect(200);
    expect(detail.body.tenantName).toBe('Acme');
    expect(detail.body.projectId).toBe(otherProjectId);

    const list = await request(app.getHttpServer())
      .get('/api/v1/finance/projects')
      .expect(200);
    expect(
      list.body.projects.map(
        (project: { projectId: string }) => project.projectId,
      ),
    ).toContain(otherProjectId);

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/finance`)
      .expect(404);
  });

  it('returns 400 for the 501st payment', async () => {
    projects.findOne.mockResolvedValue({
      id: projectId,
      workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    workspaces.findOne.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      tenantId: '22222222-2222-4222-8222-222222222222',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/payments`)
      .send({ amountCents: 100, paidOn: '2026-09-21' })
      .expect(400);
    expect(payments.save).not.toHaveBeenCalled();
  });
});
