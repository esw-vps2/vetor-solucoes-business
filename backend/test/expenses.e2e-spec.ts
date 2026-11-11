import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:net';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { Tenant } from '../src/modules/portal/entities/tenant.entity.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { TenantStorageService } from '../src/modules/portal/tenant-storage.service.js';
import { ProjectWorkspace } from '../src/modules/projects/entities/project-workspace.entity.js';
import { Project } from '../src/modules/projects/entities/project.entity.js';
import { ExpenseCategory } from '../src/modules/expenses/entities/expense-category.entity.js';
import { ExpenseSeries } from '../src/modules/expenses/entities/expense-series.entity.js';
import { ExpenseSubcategory } from '../src/modules/expenses/entities/expense-subcategory.entity.js';
import { OperatingExpenseDocument } from '../src/modules/expenses/entities/operating-expense-document.entity.js';
import { OperatingExpense } from '../src/modules/expenses/entities/operating-expense.entity.js';
import {
  ExpenseCategoriesController,
  ExpenseSeriesController,
  ExpenseSubcategoriesController,
  ExpensesController,
} from '../src/modules/expenses/expenses.controller.js';
import { ExpensesService } from '../src/modules/expenses/expenses.service.js';

const secret = 'expenses-e2e-secret';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const clientId = '11111111-1111-4111-8111-111111111111';
const tenantId = '55555555-5555-4555-8555-555555555555';
const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

class MemoryRepository<T extends { id?: string }> {
  rows: T[] = [];

  create(value: Partial<T>): T {
    return { ...value } as T;
  }

  async save(entity: T): Promise<T> {
    const now = new Date();
    const record = entity as T & { createdAt?: Date; id?: string; updatedAt?: Date };

    if (!record.id) {
      record.id = randomUUID();
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

describe('Expenses API (e2e)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const expenses = new MemoryRepository<OperatingExpense>();
  const series = new MemoryRepository<ExpenseSeries>();
  const categories = new MemoryRepository<ExpenseCategory>();
  const subcategories = new MemoryRepository<ExpenseSubcategory>();
  const documents = new MemoryRepository<OperatingExpenseDocument>();
  const users = new MemoryRepository<User>();
  const tenants = new MemoryRepository<Tenant>();
  const projects = new MemoryRepository<Project>();
  const workspaces = new MemoryRepository<ProjectWorkspace>();
  const files = new Map<string, Buffer>();
  const repos = new Map<unknown, MemoryRepository<{ id?: string }>>([
    [OperatingExpense, expenses],
    [ExpenseSeries, series],
    [OperatingExpenseDocument, documents],
  ]);

  beforeEach(async () => {
    expenses.rows = [];
    series.rows = [];
    subcategories.rows = [];
    documents.rows = [];
    projects.rows = [];
    workspaces.rows = [];
    files.clear();
    users.rows = [
      Object.assign(new User(), { id: adminId, profile: 'Administrador', status: 'active', tenantId }),
      Object.assign(new User(), { id: clientId, profile: 'Usuario', status: 'active', tenantId }),
    ];
    tenants.rows = [Object.assign(new Tenant(), { id: tenantId, name: 'VETOR', slug: 'vetor' })];
    categories.rows = [
      Object.assign(new ExpenseCategory(), {
        active: true,
        id: categoryId,
        name: 'Infraestrutura e Cloud',
        position: 1,
        slug: 'infraestrutura-e-cloud',
      }),
    ];
    const moduleFixture = await Test.createTestingModule({
      controllers: [
        ExpensesController,
        ExpenseCategoriesController,
        ExpenseSubcategoriesController,
        ExpenseSeriesController,
      ],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ BOOTSTRAP_ADMIN_TENANT_SLUG: 'vetor', JWT_SECRET: secret })],
        }),
        JwtModule.register({ secret }),
      ],
      providers: [
        AccessTokenGuard,
        AdministradorGuard,
        ExpensesService,
        ConfigService,
        { provide: getRepositoryToken(OperatingExpense), useValue: expenses },
        { provide: getRepositoryToken(ExpenseSeries), useValue: series },
        { provide: getRepositoryToken(ExpenseCategory), useValue: categories },
        { provide: getRepositoryToken(ExpenseSubcategory), useValue: subcategories },
        { provide: getRepositoryToken(OperatingExpenseDocument), useValue: documents },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Tenant), useValue: tenants },
        { provide: getRepositoryToken(Project), useValue: projects },
        { provide: getRepositoryToken(ProjectWorkspace), useValue: workspaces },
        {
          provide: DataSource,
          useValue: {
            transaction: async (
              work: (manager: { getRepository: (entity: unknown) => unknown }) => Promise<unknown>,
            ) => work({ getRepository: (entity) => repos.get(entity) }),
          },
        },
        {
          provide: TenantStorageService,
          useValue: {
            deleteTenantFile: vi.fn(async (_tenant: string, pointer: string) => {
              files.delete(pointer);
            }),
            readTenantFile: vi.fn(async (_tenant: string, pointer: string) => {
              const bytes = files.get(pointer);

              if (!bytes) {
                const error = new Error('missing') as NodeJS.ErrnoException;
                error.code = 'ENOENT';
                throw error;
              }

              return bytes;
            }),
            writeTenantFile: vi.fn(async (_tenant: string, pointer: string, bytes: Buffer) => {
              files.set(pointer, Buffer.from(bytes));
            }),
          },
        },
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }),
    );
    await app.init();
    jwt = app.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  async function cookie(id: string, profile: string): Promise<string> {
    const token = await jwt.signAsync({
      profile,
      sessionId: '55555555-5555-4555-8555-555555555555',
      sub: id,
      tenantId,
      type: 'access',
    });
    return `access_token=${token}`;
  }

  const body = {
    amountCents: 245000,
    categoryId,
    competenceMonth: '2026-10',
    description: 'AWS',
    expenseType: 'fixed',
  };

  it('rejects a missing session, another profile, and an unknown property', async () => {
    await request(app.getHttpServer()).get('/api/v1/expenses').expect(401);
    const client = await cookie(clientId, 'Usuario');
    await request(app.getHttpServer()).get('/api/v1/expenses').set('Cookie', client).expect(403);
    const admin = await cookie(adminId, 'Administrador');
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Cookie', admin)
      .send({ ...body, interval: 'monthly' })
      .expect(400);
  });

  it('creates, lists by payment month, cancels, and stores a document outside the response', async () => {
    const admin = await cookie(adminId, 'Administrador');
    const created = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Cookie', admin)
      .send({ ...body, paidOn: '2026-11-02', status: 'paid' })
      .expect(201);
    expect(created.body.paidOn).toBe('2026-11-02');
    expect(created.body).not.toHaveProperty('createdByUserId');
    const october = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .query({ competence: '2026-10' })
      .set('Cookie', admin)
      .expect(200);
    expect(october.body.summary.periodTotalCents).toBe(245000);
    expect(october.body.summary.paidTotalCents).toBe(0);
    const november = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .query({ competence: '2026-11' })
      .set('Cookie', admin)
      .expect(200);
    expect(november.body.summary.paidTotalCents).toBe(245000);
    expect(november.body.items).toHaveLength(0);
    const cancelled = await request(app.getHttpServer())
      .post(`/api/v1/expenses/${created.body.id}/cancel`)
      .set('Cookie', admin)
      .expect(200);
    expect(cancelled.body.status).toBe('cancelled');
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${created.body.id}/documents`)
      .set('Cookie', admin)
      .attach('file', Buffer.from('plain'), { contentType: 'application/octet-stream', filename: 'notes.bin' })
      .expect(400);
    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/expenses/${created.body.id}/documents`)
      .set('Cookie', admin)
      .attach('file', Buffer.from('%PDF-1.4'), { contentType: 'application/pdf', filename: 'invoice.pdf' })
      .expect(201);
    expect(JSON.stringify(uploaded.body)).not.toContain('expenses/');
    const downloaded = await request(app.getHttpServer())
      .get(`/api/v1/expenses/${created.body.id}/documents/${uploaded.body.id}`)
      .set('Cookie', admin)
      .expect(200);
    expect(downloaded.headers['content-disposition']).toContain('invoice.pdf');
    expect(downloaded.body.equals(Buffer.from('%PDF-1.4'))).toBe(true);
    await request(app.getHttpServer())
      .delete(`/api/v1/expenses/${created.body.id}/documents/${uploaded.body.id}`)
      .set('Cookie', admin)
      .expect(204);
  });
});
