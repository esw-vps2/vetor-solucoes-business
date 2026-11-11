import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import type { Tenant } from '../portal/entities/tenant.entity.js';
import type { User } from '../portal/entities/user.entity.js';
import type { TenantStorageService } from '../portal/tenant-storage.service.js';
import type { ProjectWorkspace } from '../projects/entities/project-workspace.entity.js';
import type { Project } from '../projects/entities/project.entity.js';
import type { CreateExpenseDto } from './dto/expense.dto.js';
import { ExpenseCategory } from './entities/expense-category.entity.js';
import { ExpenseSeries } from './entities/expense-series.entity.js';
import { ExpenseSubcategory } from './entities/expense-subcategory.entity.js';
import { OperatingExpenseDocument } from './entities/operating-expense-document.entity.js';
import { OperatingExpense } from './entities/operating-expense.entity.js';
import { ExpensesService } from './expenses.service.js';

class MemoryRepository<T extends { id?: string }> {
  rows: T[] = [];

  create(value: Partial<T>): T {
    return { ...value } as T;
  }

  async save(entity: T): Promise<T> {
    const now = new Date();
    const record = entity as T & { createdAt?: Date; id?: string; updatedAt?: Date };

    if (!record.id) {
      record.id = crypto.randomUUID();
    }

    if (!record.createdAt) {
      record.createdAt = now;
    }

    record.updatedAt = now;
    const index = this.rows.findIndex((row) => row.id === record.id);

    if (index >= 0) {
      this.rows[index] = record;
    } else {
      this.rows.push(record);
    }

    return record;
  }

  async findOne(options?: { where?: Record<string, unknown> }): Promise<T | null> {
    if (!options?.where) {
      return this.rows[0] ?? null;
    }

    return this.rows.find((row) => matches(row, options.where ?? {})) ?? null;
  }

  async find(options?: { where?: Record<string, unknown> }): Promise<T[]> {
    if (!options?.where) {
      return [...this.rows];
    }

    return this.rows.filter((row) => matches(row, options.where ?? {}));
  }

  async delete(criteria: { id: string }): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== criteria.id);
  }
}

function matches(row: object, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => (row as Record<string, unknown>)[key] === expected);
}

const admin: AuthenticatedUser = {
  id: 'admin',
  profile: 'Administrador',
  sessionId: 'session',
  tenantId: 'tenant',
};

describe('ExpensesService', () => {
  const expenses = new MemoryRepository<OperatingExpense>();
  const series = new MemoryRepository<ExpenseSeries>();
  const categories = new MemoryRepository<ExpenseCategory>();
  const subcategories = new MemoryRepository<ExpenseSubcategory>();
  const documents = new MemoryRepository<OperatingExpenseDocument>();
  const tenants = new MemoryRepository<Tenant>();
  const users = new MemoryRepository<User>();
  const projects = new MemoryRepository<Project>();
  const workspaces = new MemoryRepository<ProjectWorkspace>();
  const files = new Map<string, Buffer>();
  const repos = new Map<unknown, MemoryRepository<{ id?: string }>>([
    [OperatingExpense, expenses],
    [ExpenseSeries, series],
    [ExpenseCategory, categories],
    [ExpenseSubcategory, subcategories],
    [OperatingExpenseDocument, documents],
  ]);
  const service = new ExpensesService(
    expenses as never,
    series as never,
    categories as never,
    subcategories as never,
    documents as never,
    tenants as never,
    users as never,
    projects as never,
    workspaces as never,
    {
      transaction: async (work: (manager: { getRepository: (entity: unknown) => unknown }) => Promise<unknown>) =>
        work({ getRepository: (entity) => repos.get(entity) }),
    } as unknown as DataSource,
    {
      deleteTenantFile: async (_tenantId: string, pointer: string) => {
        files.delete(pointer);
      },
      readTenantFile: async (_tenantId: string, pointer: string) => {
        const bytes = files.get(pointer);

        if (!bytes) {
          const error = new Error('missing') as NodeJS.ErrnoException;
          error.code = 'ENOENT';
          throw error;
        }

        return bytes;
      },
      writeTenantFile: async (_tenantId: string, pointer: string, bytes: Buffer) => {
        files.set(pointer, Buffer.from(bytes));
      },
    } as unknown as TenantStorageService,
    { get: (_key: string, fallback?: string) => fallback ?? 'vetor' } as ConfigService,
  );

  beforeEach(() => {
    for (const repository of repos.values()) {
      repository.rows = [];
    }

    tenants.rows = [];
    users.rows = [];
    projects.rows = [];
    workspaces.rows = [];
    files.clear();
    users.rows.push({ id: 'admin', profile: 'Administrador', status: 'active' } as User);
    users.rows.push({ id: 'client', profile: 'Usuario', status: 'active' } as User);
    categories.rows.push({
      active: true,
      id: 'category',
      name: 'Infraestrutura e Cloud',
      position: 1,
      slug: 'infraestrutura-e-cloud',
    } as ExpenseCategory);
    tenants.rows.push({ id: 'vetor', name: 'Vetor', slug: 'vetor' } as Tenant);
  });

  function payload(overrides: Partial<CreateExpenseDto> = {}): CreateExpenseDto {
    return {
      amountCents: 245000,
      categoryId: 'category',
      competenceMonth: '2026-10',
      description: 'AWS',
      expenseType: 'fixed',
      ...overrides,
    };
  }

  it('denies a non-administrator', async () => {
    await expect(service.list({ ...admin, id: 'client' }, {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a pending expense and a paid expense with a payment date', async () => {
    const pending = await service.create(admin, payload({ paidOn: null, status: 'pending' }));
    expect('status' in pending && pending.status).toBe('pending');
    expect('paidOn' in pending && pending.paidOn).toBeNull();
    expect('notes' in pending).toBe(true);
    expect(pending).not.toHaveProperty('createdByUserId');
    await expect(service.create(admin, payload({ paidOn: '2026-10-05', status: 'pending' }))).rejects.toThrow(
      'Invalid input.',
    );
    const paid = await service.create(admin, payload({ paidOn: '2026-11-02', status: 'paid' }));

    if (!('id' in paid)) {
      throw new Error('expected a detail');
    }

    const october = await service.list(admin, { competence: '2026-10' });
    const november = await service.list(admin, { competence: '2026-11' });
    expect(october.summary.periodTotalCents).toBe(490000);
    expect(october.summary.paidTotalCents).toBe(0);
    expect(november.summary.paidTotalCents).toBe(245000);
    expect(november.summary.periodTotalCents).toBe(0);
    expect(november.items).toHaveLength(0);
    if (!('id' in pending) || !('id' in paid)) {
      throw new Error('expected details');
    }

    const edited = await service.update(admin, paid.id, { paidOn: null, status: 'pending' });
    expect(edited.status).toBe('pending');
    expect(edited.paidOn).toBeNull();
    const cancelled = await service.cancelOne(admin, pending.id);
    const again = await service.cancelOne(admin, pending.id);
    expect(cancelled.status).toBe('cancelled');
    expect(again.status).toBe('cancelled');
    const restored = await service.update(admin, pending.id, { paidOn: '2026-10-20', status: 'paid' });
    expect(restored.status).toBe('paid');
  });

  it('projects a series, detaches one row, and adjusts only the pending tail', async () => {
    const created = await service.create(admin, payload({
      competenceMonth: undefined,
      recurrence: { count: 3, interval: 'monthly', startsOn: '2026-10-27' },
    }));

    if (!('generatedCount' in created)) {
      throw new Error('expected a series');
    }

    expect(created.generatedCount).toBe(3);
    const rows = expenses.rows.toSorted((left, right) => (left.seriesIndex ?? 0) - (right.seriesIndex ?? 0));
    expect(rows.map((row) => String(row.dueOn))).toEqual(['2026-10-27', '2026-11-27', '2026-12-27']);
    expect(rows.every((row) => row.status === 'pending' && row.paidOn == null)).toBe(true);
    const middle = rows[1];

    if (!middle) {
      throw new Error('missing occurrence');
    }

    await service.update(admin, middle.id, { amountCents: 50, scope: 'occurrence' });
    await service.update(admin, rows[0]?.id ?? '', { amountCents: 2000, count: 4, scope: 'series' });
    const afterRaise = expenses.rows.toSorted((left, right) => (left.seriesIndex ?? 0) - (right.seriesIndex ?? 0));
    expect(afterRaise).toHaveLength(4);
    expect(afterRaise.find((row) => row.id === middle.id)?.amountCents).toBe(50);
    expect(afterRaise.find((row) => row.id === middle.id)?.seriesDetached).toBe(true);
    expect(afterRaise.find((row) => row.seriesIndex === 3)?.status).toBe('pending');
    expect(afterRaise.filter((row) => row.seriesIndex !== 1).every((row) => Number(row.amountCents) === 2000)).toBe(
      true,
    );
    await service.update(admin, rows[0]?.id ?? '', { count: 2, scope: 'series' });
    expect(expenses.rows.find((row) => row.seriesIndex === 3)?.status).toBe('cancelled');
    expect(expenses.rows.find((row) => row.seriesIndex === 0)?.status).toBe('pending');
    const listed = await service.list(admin, { competence: '2026-10' });
    expect(listed.items[0]).not.toHaveProperty('notes');
  });

  it('cancels selected rows only when every id exists', async () => {
    const first = await service.create(admin, payload());
    const second = await service.create(admin, payload({ description: 'VPS' }));

    if (!('id' in first) || !('id' in second)) {
      throw new Error('expected details');
    }

    await expect(service.cancelMany(admin, [first.id, crypto.randomUUID()])).rejects.toBeInstanceOf(NotFoundException);
    expect(expenses.rows.every((row) => row.status !== 'cancelled')).toBe(true);
    const result = await service.cancelMany(admin, [first.id, second.id, first.id]);
    expect(result.cancelledIds).toEqual([first.id, second.id]);
    const repeated = await service.cancelMany(admin, [first.id]);
    expect(repeated.alreadyCancelledIds).toEqual([first.id]);
    const seriesResult = await service.create(admin, {
      amountCents: 30000,
      categoryId: 'category',
      description: 'Domínio',
      expenseType: 'fixed',
      recurrence: { count: 2, interval: 'yearly', startsOn: '2026-10-27' },
    });

    if (!('generatedCount' in seriesResult)) {
      throw new Error('expected a series');
    }

    const cancelled = await service.cancelSeries(admin, seriesResult.seriesId);
    expect(cancelled.cancelledCount).toBe(2);
    expect(series.rows.find((row) => row.id === seriesResult.seriesId)?.active).toBe(false);
  });

  it('refuses an inactive category for a new expense and a category that still has rows', async () => {
    categories.rows[0] = { ...categories.rows[0], active: false } as ExpenseCategory;
    await expect(service.create(admin, payload())).rejects.toThrow('Invalid input.');
    categories.rows[0] = { ...categories.rows[0], active: true } as ExpenseCategory;
    await service.create(admin, payload());
    await expect(service.deleteCategory(admin, 'category')).rejects.toThrow('Conflict.');
    const created = await service.createCategory(admin, 'Escritório');
    expect(created.slug).toBe('escritorio');
    await service.deleteCategory(admin, created.id);
    expect(categories.rows.some((row) => row.id === created.id)).toBe(false);
  });

  it('stores a project tenant when only the project is sent and rejects a mismatched client', async () => {
    tenants.rows.push({ id: 'client-tenant', name: 'Acme', slug: 'acme' } as Tenant);
    workspaces.rows.push({ id: 'workspace', tenantId: 'client-tenant' } as ProjectWorkspace);
    projects.rows.push({ id: 'project', name: 'Site', workspaceId: 'workspace' } as Project);
    const saved = await service.create(admin, payload({ projectId: 'project' }));

    if (!('clientTenantId' in saved)) {
      throw new Error('expected a detail');
    }

    expect(saved.clientTenantId).toBe('client-tenant');
    expect(saved.projectId).toBe('project');
    await expect(
      service.create(admin, payload({ clientTenantId: 'vetor', projectId: 'project' })),
    ).rejects.toThrow('Invalid input.');
  });

  it('rejects a disallowed file and omits the storage path from a saved document', async () => {
    const created = await service.create(admin, payload());

    if (!('id' in created)) {
      throw new Error('expected a detail');
    }

    await expect(
      service.addDocument(admin, created.id, {
        buffer: Buffer.from('hello'),
        mimetype: 'application/octet-stream',
        originalname: 'notes.bin',
        size: 5,
      }),
    ).rejects.toThrow('Invalid input.');
    const document = await service.addDocument(admin, created.id, {
      buffer: Buffer.from('%PDF-1.4'),
      mimetype: 'application/pdf',
      originalname: 'invoice.pdf',
      size: 8,
    });
    expect(document).toEqual({
      byteSize: 8,
      contentType: 'application/pdf',
      createdAt: expect.any(String),
      id: expect.any(String),
      originalName: 'invoice.pdf',
    });
    const detail = await service.get(admin, created.id);
    expect(JSON.stringify(detail)).not.toContain('expenses/');
    await service.cancelOne(admin, created.id);
    await service.deleteDocument(admin, created.id, document.id);
    expect(files.size).toBe(0);
  });
});
