import { ProjectFinanceService } from './project-finance.service.js';
import { ProjectContract } from './entities/project-contract.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import { User } from '../portal/entities/user.entity.js';
import {
  calendarDate,
  financeAmounts,
  isCalendarDate,
  saoPauloCalendarDate,
} from './finance-amounts.js';
import { contractPointerFor } from './attachment-file.js';

const tenantId = '22222222-2222-4222-8222-222222222222';
const otherTenantId = '33333333-3333-4333-8333-333333333333';
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const paymentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const costId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function actor(profile = 'Administrador', sessionTenant = tenantId) {
  return {
    id: 'admin-id',
    profile,
    sessionId: 'session-id',
    tenantId: sessionTenant,
  };
}

describe('finance amounts', () => {
  it('keeps a negative open balance and a negative result', () => {
    expect(financeAmounts(100000, 150000, 40000)).toEqual({
      contractedResultAmountCents: 60000,
      costAmountCents: 40000,
      openAmountCents: -50000,
      paidAmountCents: 150000,
      resultAmountCents: 110000,
      totalAmountCents: 100000,
    });
    expect(financeAmounts(0, 0, 2500).resultAmountCents).toBe(-2500);
    expect(financeAmounts(0, 0, 0)).toEqual({
      contractedResultAmountCents: 0,
      costAmountCents: 0,
      openAmountCents: 0,
      paidAmountCents: 0,
      resultAmountCents: 0,
      totalAmountCents: 0,
    });
  });

  it('uses the Sao Paulo calendar date and rejects impossible dates', () => {
    expect(saoPauloCalendarDate(new Date('2026-11-09T02:30:00.000Z'))).toBe(
      '2026-11-08',
    );
    expect(saoPauloCalendarDate(new Date('2026-11-09T15:00:00.000Z'))).toBe(
      '2026-11-09',
    );
    expect(isCalendarDate('2026-02-28')).toBe(true);
    expect(isCalendarDate('2026-02-31')).toBe(false);
  });
});

describe('ProjectFinanceService', () => {
  function createService() {
    const user = Object.assign(new User(), {
      id: 'admin-id',
      profile: 'Administrador',
      status: 'active',
      tenantId,
    });
    const workspace = Object.assign(new ProjectWorkspace(), {
      id: workspaceId,
      name: 'Delivery',
      tenantId,
    });
    const project = Object.assign(new Project(), {
      id: projectId,
      name: 'Portal',
      workspaceId,
    });
    const projects = {
      find: vi.fn().mockResolvedValue([project]),
      findOne: vi.fn().mockResolvedValue(project),
      manager: { query: vi.fn().mockResolvedValue([]) },
    };
    const workspaces = {
      find: vi.fn().mockResolvedValue([workspace]),
      findOne: vi.fn().mockResolvedValue(workspace),
    };
    const installments = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      save: vi.fn(async (value) => value),
    };
    const contracts = {
      create: vi.fn((value) => value),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? 'contract-id' }),
      ),
      manager: {
        transaction: vi.fn(
          async (
            work: (manager: {
              getRepository: (entity: { name: string }) => unknown;
            }) => Promise<unknown>,
          ) =>
            work({
              getRepository(entity) {
                if (entity.name === 'ProjectContract') {
                  return contracts;
                }

                if (entity.name === 'ProjectContractInstallment') {
                  return installments;
                }

                if (entity.name === 'ProjectCost') {
                  return costs;
                }

                throw new Error(entity.name);
              },
            }),
        ),
      },
    };
    const payments = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? paymentId }),
      ),
    };
    const costs = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (value) => {
        if (Array.isArray(value)) {
          return value.map((item, index) => ({
            ...item,
            id: item.id ?? `cost-${index + 1}`,
          }));
        }

        return Object.assign(value, { id: value.id ?? costId });
      }),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue(user),
    };
    const tenantStorage = {
      deleteTenantFile: vi.fn().mockResolvedValue(undefined),
      readTenantFile: vi.fn(),
      writeTenantFile: vi.fn().mockResolvedValue(undefined),
    };
    const financeDocuments = {
      upload: vi.fn().mockResolvedValue({
        byteSize: 1,
        contentType: 'application/pdf',
        createdAt: '2026-10-14T00:00:00.000Z',
        id: 'document-id',
        originalName: 'contract.pdf',
        projectId,
      }),
    };
    const service = new ProjectFinanceService(
      projects as never,
      workspaces as never,
      contracts as never,
      installments as never,
      payments as never,
      costs as never,
      users as never,
      tenantStorage as never,
      financeDocuments as never,
    );

    return {
      contracts,
      costs,
      financeDocuments,
      installments,
      payments,
      project,
      projects,
      service,
      tenantStorage,
      user,
      users,
      workspace,
      workspaces,
    };
  }

  it('lists a project without a contract as zeros and does not insert a row', async () => {
    const context = createService();
    context.projects.manager.query.mockResolvedValue([
      {
        contractFilename: null,
        contractId: null,
        costAmountCents: '0',
        endsOn: null,
        originalName: null,
        paidAmountCents: '0',
        projectId,
        projectName: 'Portal',
        signedOn: null,
        startsOn: null,
        status: null,
        tenantId,
        tenantName: 'VETOR',
        title: null,
        totalAmountCents: null,
        workspaceId,
        workspaceName: 'Delivery',
      },
    ]);

    const list = await context.service.list(actor());

    expect(list.projects[0].contract).toBeNull();
    expect(list.projects[0].installmentCount).toBeNull();
    expect(list.projects[0].paidAmountCents).toBe(0);
    expect(list.projects[0].openAmountCents).toBe(0);
    expect(list.totals.totalAmountCents).toBe(0);
    expect(context.contracts.save).not.toHaveBeenCalled();
    expect(context.projects.manager.query).toHaveBeenCalledTimes(1);
    const [sql, params] = context.projects.manager.query.mock.calls[0];
    expect(sql).toContain('project_contract_installments');
    expect(sql).toContain('due_on IS NOT NULL AND due_on <= $1::date');
    expect(sql).not.toContain('project_payments');
    expect(params).toEqual([saoPauloCalendarDate()]);
  });

  it('sums received, open, cost, and both results, including negatives', async () => {
    const context = createService();
    context.projects.manager.query.mockResolvedValue([
      {
        contractFilename: null,
        contractId: 'contract-id',
        costAmountCents: '40000',
        endsOn: null,
        originalName: null,
        paidAmountCents: '150000',
        projectId,
        projectName: 'Portal',
        signedOn: null,
        startsOn: null,
        installmentCount: 12,
        status: 'active',
        tenantId,
        tenantName: 'VETOR',
        title: 'C-1',
        totalAmountCents: '100000',
        workspaceId,
        workspaceName: 'Delivery',
      },
    ]);

    const list = await context.service.list(actor());

    expect(list.projects[0]).toEqual(
      expect.objectContaining({
        contractedResultAmountCents: 60000,
        costAmountCents: 40000,
        installmentCount: 12,
        openAmountCents: -50000,
        paidAmountCents: 150000,
        resultAmountCents: 110000,
        totalAmountCents: 100000,
      }),
    );
    expect(list.totals.resultAmountCents).toBe(110000);
    expect(list.totals.contractedResultAmountCents).toBe(60000);
    expect(context.projects.manager.query.mock.calls[0][0]).not.toContain(
      'workspace.tenant_id = $1',
    );
  });

  it('loads finance for a project in another tenant', async () => {
    const context = createService();
    context.workspace.tenantId = otherTenantId;
    context.projects.manager.query.mockResolvedValue([
      {
        contractFilename: null,
        contractId: null,
        costAmountCents: '0',
        endsOn: null,
        originalName: null,
        paidAmountCents: '0',
        projectId,
        projectName: 'Portal',
        signedOn: null,
        startsOn: null,
        status: null,
        tenantId: otherTenantId,
        tenantName: 'Acme',
        title: null,
        totalAmountCents: null,
        workspaceId,
        workspaceName: 'Delivery',
      },
    ]);

    const detail = await context.service.getProject(actor(), projectId);

    expect(detail.tenantId).toBe(otherTenantId);
    expect(detail.tenantName).toBe('Acme');
    expect(detail.projectId).toBe(projectId);
  });

  it('returns not found when the project does not exist', async () => {
    const context = createService();
    context.projects.findOne.mockResolvedValue(null);

    await expect(
      context.service.getProject(actor(), projectId),
    ).rejects.toThrow('Not found.');
  });

  it('rejects the 501st payment', async () => {
    const context = createService();
    context.payments.count.mockResolvedValue(500);

    await expect(
      context.service.createPayment(actor(), projectId, {
        amountCents: 100,
        paidOn: '2026-09-21',
      }),
    ).rejects.toThrow('Invalid input.');
    expect(context.payments.save).not.toHaveBeenCalled();
  });

  it('overwrites the contract PDF without deleting the previous bytes first', async () => {
    const context = createService();
    const contract = Object.assign(new ProjectContract(), {
      contractFilename: contractPointerFor(projectId),
      id: 'contract-id',
      originalName: 'old.pdf',
      projectId,
    });
    context.contracts.findOne.mockResolvedValue(contract);
    const bytes = Buffer.from('%PDF-1.4');

    const saved = await context.service.saveContractFile(actor(), projectId, {
      buffer: bytes,
      mimetype: 'application/pdf',
      originalname: '../evil.pdf',
      size: bytes.length,
    });

    expect(saved.originalName).toBe('evil.pdf');
    expect(context.tenantStorage.writeTenantFile).toHaveBeenCalledWith(
      tenantId,
      contractPointerFor(projectId),
      bytes,
      'contract',
    );
    expect(context.tenantStorage.deleteTenantFile).not.toHaveBeenCalled();
    expect(context.financeDocuments.upload).toHaveBeenCalledWith(
      actor(),
      projectId,
      {
        buffer: bytes,
        mimetype: 'application/pdf',
        originalname: 'evil.pdf',
        size: bytes.length,
      },
    );
    expect(JSON.stringify(saved)).not.toContain('infrastructure');
    expect(JSON.stringify(saved)).not.toContain('contracts/');
  });

  it('rejects a PDF whose bytes are not a PDF', async () => {
    const context = createService();
    context.contracts.findOne.mockResolvedValue(
      Object.assign(new ProjectContract(), { projectId }),
    );

    await expect(
      context.service.saveContractFile(actor(), projectId, {
        buffer: Buffer.from('not-a-pdf'),
        mimetype: 'application/pdf',
        originalname: 'note.pdf',
        size: 10,
      }),
    ).rejects.toThrow('Invalid input.');
    expect(context.tenantStorage.writeTenantFile).not.toHaveBeenCalled();
    expect(context.financeDocuments.upload).not.toHaveBeenCalled();
  });

  it('unlinks the contract file when projects are removed', async () => {
    const context = createService();
    context.contracts.find.mockResolvedValue([
      Object.assign(new ProjectContract(), {
        contractFilename: contractPointerFor(projectId),
        projectId,
      }),
    ]);

    await context.service.unlinkContractFiles([projectId]);

    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      tenantId,
      contractPointerFor(projectId),
      'contract',
    );
  });

  it('replaces installment amounts in count order and rejects a length mismatch', async () => {
    const context = createService();

    const saved = await context.service.upsertContract(actor(), projectId, {
      installmentCount: 2,
      installments: [{ amountCents: 15000 }, { amountCents: 0 }],
      status: 'active',
      title: 'C-1',
      totalAmountCents: 100000,
    });

    expect(saved.installments).toEqual([
      { amountCents: 15000, dueOn: null, position: 1 },
      { amountCents: 0, dueOn: null, position: 2 },
    ]);
    expect(context.installments.delete).toHaveBeenCalledWith({ projectId });
    expect(context.installments.save).toHaveBeenCalledWith([
      expect.objectContaining({
        amountCents: 15000,
        dueOn: null,
        position: 1,
        projectId,
      }),
      expect.objectContaining({
        amountCents: 0,
        dueOn: null,
        position: 2,
        projectId,
      }),
    ]);

    const dated = await context.service.upsertContract(actor(), projectId, {
      installmentCount: 1,
      installments: [{ amountCents: 15000, dueOn: '2026-11-09' }],
      status: 'active',
      title: 'C-1',
      totalAmountCents: 100000,
    });
    expect(dated.installments).toEqual([
      { amountCents: 15000, dueOn: '2026-11-09', position: 1 },
    ]);

    await expect(
      context.service.upsertContract(actor(), projectId, {
        installmentCount: 1,
        installments: [{ amountCents: 15000, dueOn: '2026-02-31' }],
        status: 'active',
        title: 'C-1',
        totalAmountCents: 100000,
      }),
    ).rejects.toThrow('Invalid input.');

    await expect(
      context.service.upsertContract(actor(), projectId, {
        installmentCount: 2,
        installments: [{ amountCents: 1 }],
        status: 'active',
        title: 'C-1',
        totalAmountCents: 100000,
      }),
    ).rejects.toThrow('Invalid input.');
  });

  it('replaces named cost lines in order and clears them with an empty list', async () => {
    const context = createService();

    const saved = await context.service.replaceCostLines(actor(), projectId, {
      lines: [
        { amountCents: 40000, label: 'Infraestrutura' },
        { amountCents: 30000, label: 'imposto' },
      ],
    });

    expect(
      saved.map((cost) => [cost.label, cost.amountCents, cost.category]),
    ).toEqual([
      ['Infraestrutura', 40000, 'other'],
      ['imposto', 30000, 'other'],
    ]);
    expect(saved[0]?.incurredOn).toBe(calendarDate());
    expect(context.costs.delete).toHaveBeenCalledWith({ projectId });

    const cleared = await context.service.replaceCostLines(actor(), projectId, {
      lines: [],
    });
    expect(cleared).toEqual([]);
  });

  it('rejects 501 cost lines', async () => {
    const context = createService();

    await expect(
      context.service.replaceCostLines(actor(), projectId, {
        lines: Array.from({ length: 501 }, () => ({
          amountCents: 1,
          label: 'Custo',
        })),
      }),
    ).rejects.toThrow('Invalid input.');
    expect(context.contracts.manager.transaction).not.toHaveBeenCalled();
  });

  it('stores the category name when a cost is created without a label', async () => {
    const context = createService();
    context.costs.find.mockResolvedValueOnce([{ position: 2 }]);

    const saved = await context.service.createCost(actor(), projectId, {
      amountCents: 100,
      category: 'team',
      incurredOn: '2026-09-21',
    });

    expect(saved.label).toBe('Equipe');
    expect(context.costs.create).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Equipe', position: 1 }),
    );
  });

  it('refuses a non-administrador', async () => {
    const context = createService();
    context.users.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 'user-id',
        profile: 'Usuario',
        status: 'active',
      }),
    );

    await expect(context.service.list(actor('Usuario'))).rejects.toThrow(
      'Access denied.',
    );
  });
});
