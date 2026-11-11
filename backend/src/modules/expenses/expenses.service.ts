import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import { ProjectWorkspace } from '../projects/entities/project-workspace.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import {
  isFinanceDocumentMime,
  matchesDeclaredFinanceDocumentType,
  matchesFinanceDocumentExtension,
  MAX_FINANCE_DOCUMENT_BYTES,
  safeFinanceDocumentName,
} from '../projects/finance-document-file.js';
import {
  DEFAULT_EXPENSE_PAGE_LIMIT,
  MAX_EXPENSE_DOCUMENT_TOTAL_BYTES,
  MAX_EXPENSE_DOCUMENTS,
  type ExpenseInterval,
  type ExpenseStatus,
  type ExpenseType,
} from './expense.constants.js';
import {
  competenceDate,
  currentCompetenceMonth,
  isIsoDate,
  monthKey,
  temporaryCompetence,
} from './expense-dates.js';
import { expenseDocumentPointerFor } from './expense-document-file.js';
import { queryExpenses, type ExpenseListRow } from './expense-query.js';
import { applySeriesPatch, projectSeries, type SeriesExpenseRecord, type SeriesRecord } from './expense-series.js';
import { slugifyName, uniqueSlug } from './expense-slug.js';
import { resolveCreateStatus, resolveStatus } from './expense-status.js';
import type { CreateExpenseDto, ListExpensesQueryDto, UpdateExpenseDto } from './dto/expense.dto.js';
import type {
  CancelExpensesResultDto,
  CancelSeriesResultDto,
  ExpenseAssociationsDto,
  ExpenseCategoryNodeDto,
  ExpenseDetailDto,
  ExpenseDocumentDto,
  ExpenseItemDto,
  ExpenseListDto,
  ExpenseSeriesCreatedDto,
  ExpenseSubcategoryNodeDto,
} from './dto/expense-response.dto.js';
import { ExpenseCategory } from './entities/expense-category.entity.js';
import { ExpenseSeries } from './entities/expense-series.entity.js';
import { ExpenseSubcategory } from './entities/expense-subcategory.entity.js';
import { OperatingExpenseDocument } from './entities/operating-expense-document.entity.js';
import { OperatingExpense } from './entities/operating-expense.entity.js';

interface ExpenseUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

interface Association {
  clientTenantId: string | null;
  projectId: string | null;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(OperatingExpense)
    private readonly expenses: Repository<OperatingExpense>,
    @InjectRepository(ExpenseSeries)
    private readonly seriesRepo: Repository<ExpenseSeries>,
    @InjectRepository(ExpenseCategory)
    private readonly categories: Repository<ExpenseCategory>,
    @InjectRepository(ExpenseSubcategory)
    private readonly subcategories: Repository<ExpenseSubcategory>,
    @InjectRepository(OperatingExpenseDocument)
    private readonly documents: Repository<OperatingExpenseDocument>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectWorkspace)
    private readonly workspaces: Repository<ProjectWorkspace>,
    private readonly dataSource: DataSource,
    private readonly storage: TenantStorageService,
    private readonly config: ConfigService,
  ) {}

  async list(actor: AuthenticatedUser, query: ListExpensesQueryDto): Promise<ExpenseListDto> {
    await this.requireAdministrador(actor);
    const sort = query.sort ?? 'competence';
    const result = queryExpenses(await this.loadRows(), {
      categoryId: query.categoryId,
      competence: query.competence ?? currentCompetenceMonth(),
      direction: query.direction ?? (sort === 'competence' ? 'desc' : 'asc'),
      limit: query.limit ?? DEFAULT_EXPENSE_PAGE_LIMIT,
      page: query.page ?? 1,
      projectId: query.projectId,
      q: query.q || undefined,
      sort,
      status: query.status,
      subcategoryId: query.subcategoryId,
      supplier: query.supplier || undefined,
      type: query.type,
    });

    return result;
  }

  async associations(actor: AuthenticatedUser): Promise<ExpenseAssociationsDto> {
    await this.requireAdministrador(actor);
    const [tenants, projects, workspaces] = await Promise.all([
      this.tenants.find(),
      this.projects.find(),
      this.workspaces.find(),
    ]);
    const workspaceTenant = new Map(workspaces.map((workspace) => [workspace.id, workspace.tenantId]));
    const tenantName = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

    return {
      projects: projects
        .flatMap((project) => {
          const tenantId = workspaceTenant.get(project.workspaceId);

          if (!tenantId) {
            return [];
          }

          return [
            {
              id: project.id,
              name: project.name,
              tenantId,
              tenantName: tenantName.get(tenantId) ?? '',
            },
          ];
        })
        .toSorted((left, right) => left.tenantName.localeCompare(right.tenantName, 'pt-BR') || left.name.localeCompare(right.name, 'pt-BR')),
      tenants: tenants
        .map((tenant) => ({ id: tenant.id, name: tenant.name }))
        .toSorted((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
    };
  }

  async get(actor: AuthenticatedUser, id: string): Promise<ExpenseDetailDto> {
    await this.requireAdministrador(actor);
    return this.detail(await this.requireExpense(id));
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateExpenseDto,
  ): Promise<ExpenseDetailDto | ExpenseSeriesCreatedDto> {
    const user = await this.requireAdministrador(actor);

    if (dto.recurrence) {
      if (
        dto.status !== undefined ||
        dto.paidOn !== undefined ||
        dto.competenceMonth !== undefined ||
        dto.dueOn !== undefined
      ) {
        throw new BadRequestException('Invalid input.');
      }

      return this.createSeries(user, dto);
    }

    return this.createOne(user, dto);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateExpenseDto): Promise<ExpenseDetailDto> {
    const user = await this.requireAdministrador(actor);
    const expense = await this.requireExpense(id);
    this.assertDates(dto.dueOn, dto.paidOn, dto.startsOn);

    if (expense.seriesId && !expense.seriesDetached) {
      if (!dto.scope) {
        throw new BadRequestException('Invalid input.');
      }

      if (dto.scope === 'occurrence' && (dto.count !== undefined || dto.startsOn !== undefined)) {
        throw new BadRequestException('Invalid input.');
      }

      if (dto.scope === 'series') {
        await this.updateSeries(user, expense.seriesId, dto);
        return this.detail(await this.requireExpense(id));
      }
    } else if (dto.scope !== undefined || dto.count !== undefined || dto.startsOn !== undefined) {
      throw new BadRequestException('Invalid input.');
    }

    await this.applyOccurrence(expense, dto, user, Boolean(expense.seriesId));
    await this.expenses.save(expense);
    this.logger.log(`actor=${user.id} expense=${expense.id} outcome=updated`);
    return this.detail(expense);
  }

  async cancelOne(actor: AuthenticatedUser, id: string): Promise<ExpenseDetailDto> {
    const user = await this.requireAdministrador(actor);
    const expense = await this.requireExpense(id);

    if (expense.status !== 'cancelled') {
      this.markCancelled(expense, user);
      await this.expenses.save(expense);
      this.logger.log(`actor=${user.id} expense=${expense.id} outcome=cancelled`);
    }

    return this.detail(expense);
  }

  async cancelMany(actor: AuthenticatedUser, ids: string[]): Promise<CancelExpensesResultDto> {
    const user = await this.requireAdministrador(actor);
    const uniqueIds = [...new Set(ids)];
    const rows = await this.expenses.find();
    const selected = uniqueIds.map((id) => rows.find((row) => row.id === id));

    if (selected.some((row) => !row)) {
      throw new NotFoundException('Not found.');
    }

    const cancelledIds: string[] = [];
    const alreadyCancelledIds: string[] = [];

    for (const row of selected) {
      if (!row) {
        continue;
      }

      if (row.status === 'cancelled') {
        alreadyCancelledIds.push(row.id);
        continue;
      }

      this.markCancelled(row, user);
      cancelledIds.push(row.id);
      await this.expenses.save(row);
    }

    this.logger.log(`actor=${user.id} expense=${cancelledIds.join(',') || 'none'} outcome=cancelled`);
    return { alreadyCancelledIds, cancelledIds };
  }

  async cancelSeries(actor: AuthenticatedUser, id: string): Promise<CancelSeriesResultDto> {
    const user = await this.requireAdministrador(actor);
    const series = await this.seriesRepo.findOne({ where: { id } });

    if (!series) {
      throw new NotFoundException('Not found.');
    }

    const rows = (await this.expenses.find()).filter((row) => row.seriesId === id && row.status !== 'cancelled');

    for (const row of rows) {
      this.markCancelled(row, user);
      await this.expenses.save(row);
    }

    series.active = false;
    await this.seriesRepo.save(series);
    this.logger.log(`actor=${user.id} series=${series.id} outcome=cancelled`);
    return { cancelledCount: rows.length };
  }

  async listCategories(actor: AuthenticatedUser): Promise<ExpenseCategoryNodeDto[]> {
    await this.requireAdministrador(actor);
    const [categories, subcategories, expenses] = await Promise.all([
      this.categories.find(),
      this.subcategories.find(),
      this.expenses.find(),
    ]);

    return categories
      .toSorted((left, right) => left.position - right.position)
      .map((category) => ({
        active: category.active,
        expenseCount: expenses.filter((expense) => expense.categoryId === category.id).length,
        id: category.id,
        name: category.name,
        position: category.position,
        slug: category.slug,
        subcategories: subcategories
          .filter((subcategory) => subcategory.categoryId === category.id)
          .toSorted((left, right) => left.position - right.position)
          .map((subcategory) => this.subcategoryNode(subcategory, expenses)),
      }));
  }

  async createCategory(actor: AuthenticatedUser, name: string): Promise<ExpenseCategoryNodeDto> {
    const user = await this.requireAdministrador(actor);
    const categories = await this.categories.find();
    this.assertUniqueName(categories, name);
    const saved = await this.categories.save(
      this.categories.create({
        active: true,
        name,
        position: this.nextPosition(categories),
        slug: uniqueSlug(slugifyName(name), new Set(categories.map((category) => category.slug))),
      }),
    );
    this.logger.log(`actor=${user.id} category=${saved.id} outcome=created`);
    return { ...this.categoryNode(saved, 0), subcategories: [] };
  }

  async updateCategory(
    actor: AuthenticatedUser,
    id: string,
    patch: { active?: boolean; name?: string },
  ): Promise<ExpenseCategoryNodeDto> {
    const user = await this.requireAdministrador(actor);
    const category = await this.categories.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Not found.');
    }

    if (patch.name !== undefined) {
      this.assertUniqueName(await this.categories.find(), patch.name, category.id);
      category.name = patch.name;
    }

    if (patch.active !== undefined) {
      category.active = patch.active;
    }

    const saved = await this.categories.save(category);
    this.logger.log(`actor=${user.id} category=${saved.id} outcome=updated`);
    const tree = await this.listCategories(actor);
    return tree.find((node) => node.id === saved.id) ?? { ...this.categoryNode(saved, 0), subcategories: [] };
  }

  async deleteCategory(actor: AuthenticatedUser, id: string): Promise<void> {
    const user = await this.requireAdministrador(actor);
    const category = await this.categories.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Not found.');
    }

    const [subcategories, expenses] = await Promise.all([this.subcategories.find(), this.expenses.find()]);

    if (
      subcategories.some((subcategory) => subcategory.categoryId === id) ||
      expenses.some((expense) => expense.categoryId === id)
    ) {
      throw new ConflictException('Conflict.');
    }

    await this.categories.delete({ id });
    this.logger.log(`actor=${user.id} category=${id} outcome=deleted`);
  }

  async createSubcategory(
    actor: AuthenticatedUser,
    categoryId: string,
    name: string,
  ): Promise<ExpenseSubcategoryNodeDto> {
    const user = await this.requireAdministrador(actor);
    const category = await this.categories.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException('Not found.');
    }

    const siblings = (await this.subcategories.find()).filter((row) => row.categoryId === categoryId);
    this.assertUniqueName(siblings, name);
    const saved = await this.subcategories.save(
      this.subcategories.create({
        active: true,
        categoryId,
        name,
        position: this.nextPosition(siblings),
        slug: uniqueSlug(slugifyName(name), new Set(siblings.map((row) => row.slug))),
      }),
    );
    this.logger.log(`actor=${user.id} subcategory=${saved.id} outcome=created`);
    return this.subcategoryNode(saved, []);
  }

  async updateSubcategory(
    actor: AuthenticatedUser,
    id: string,
    patch: { active?: boolean; name?: string },
  ): Promise<ExpenseSubcategoryNodeDto> {
    const user = await this.requireAdministrador(actor);
    const subcategory = await this.subcategories.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException('Not found.');
    }

    if (patch.name !== undefined) {
      const siblings = (await this.subcategories.find()).filter(
        (row) => row.categoryId === subcategory.categoryId,
      );
      this.assertUniqueName(siblings, patch.name, subcategory.id);
      subcategory.name = patch.name;
    }

    if (patch.active !== undefined) {
      subcategory.active = patch.active;
    }

    const saved = await this.subcategories.save(subcategory);
    this.logger.log(`actor=${user.id} subcategory=${saved.id} outcome=updated`);
    const expenses = await this.expenses.find();
    return this.subcategoryNode(saved, expenses);
  }

  async deleteSubcategory(actor: AuthenticatedUser, id: string): Promise<void> {
    const user = await this.requireAdministrador(actor);
    const subcategory = await this.subcategories.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException('Not found.');
    }

    if ((await this.expenses.find()).some((expense) => expense.subcategoryId === id)) {
      throw new ConflictException('Conflict.');
    }

    await this.subcategories.delete({ id });
    this.logger.log(`actor=${user.id} subcategory=${id} outcome=deleted`);
  }

  async addDocument(
    actor: AuthenticatedUser,
    expenseId: string,
    file: ExpenseUpload | undefined,
  ): Promise<ExpenseDocumentDto> {
    const user = await this.requireAdministrador(actor);
    await this.requireExpense(expenseId);
    const originalName = safeFinanceDocumentName(file?.originalname);
    const mime = file?.mimetype ?? '';

    if (
      !file ||
      !originalName ||
      !isFinanceDocumentMime(mime) ||
      !matchesFinanceDocumentExtension(originalName, mime) ||
      file.size < 1 ||
      file.size > MAX_FINANCE_DOCUMENT_BYTES ||
      !matchesDeclaredFinanceDocumentType(mime, file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const vetor = await this.requireVetorTenant();
    const documentId = randomUUID();
    const pointer = expenseDocumentPointerFor(expenseId, documentId, mime);
    await this.storage.writeTenantFile(vetor.id, pointer, file.buffer, 'expense');

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(OperatingExpenseDocument);
        const expense = await manager.getRepository(OperatingExpense).findOne({ where: { id: expenseId } });

        if (!expense) {
          throw new NotFoundException('Not found.');
        }

        const existing = (await repository.find()).filter((document) => document.expenseId === expenseId);
        const totalBytes = existing.reduce((total, document) => total + document.byteSize, 0);

        if (
          existing.length >= MAX_EXPENSE_DOCUMENTS ||
          totalBytes + file.size > MAX_EXPENSE_DOCUMENT_TOTAL_BYTES
        ) {
          throw new BadRequestException('Invalid input.');
        }

        return repository.save(
          repository.create({
            byteSize: file.size,
            contentType: mime,
            createdByUserId: user.id,
            expenseId,
            id: documentId,
            originalName,
            storageFilename: pointer,
          }),
        );
      });
      this.logger.log(`actor=${user.id} expense=${expenseId} document=${saved.id} outcome=uploaded`);
      return this.documentDto(saved);
    } catch (error) {
      await this.storage.deleteTenantFile(vetor.id, pointer, 'expense');
      throw error;
    }
  }

  async readDocument(
    actor: AuthenticatedUser,
    expenseId: string,
    documentId: string,
  ): Promise<{ bytes: Buffer; contentType: string; originalName: string }> {
    await this.requireAdministrador(actor);
    const document = await this.requireDocument(expenseId, documentId);
    const vetor = await this.requireVetorTenant();

    try {
      const bytes = await this.storage.readTenantFile(vetor.id, document.storageFilename, 'expense');
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

  async deleteDocument(actor: AuthenticatedUser, expenseId: string, documentId: string): Promise<void> {
    const user = await this.requireAdministrador(actor);
    const document = await this.requireDocument(expenseId, documentId);
    const vetor = await this.requireVetorTenant();
    await this.documents.delete({ id: document.id });
    await this.storage.deleteTenantFile(vetor.id, document.storageFilename, 'expense');
    this.logger.log(`actor=${user.id} expense=${expenseId} document=${documentId} outcome=deleted`);
  }

  private async createOne(user: User, dto: CreateExpenseDto): Promise<ExpenseDetailDto> {
    if (!dto.competenceMonth) {
      throw new BadRequestException('Invalid input.');
    }

    this.assertDates(dto.dueOn, dto.paidOn);
    const payment = resolveCreateStatus(dto.status, dto.paidOn ?? null);

    if (!payment) {
      throw new BadRequestException('Invalid input.');
    }

    const association = await this.resolveAssociation(dto.clientTenantId ?? null, dto.projectId ?? null);
    await this.requireCategory(dto.categoryId);
    await this.requireSubcategory(dto.subcategoryId ?? null, dto.categoryId);
    const saved = await this.expenses.save(
      this.expenses.create({
        amountCents: dto.amountCents,
        cancelledAt: null,
        cancelledByUserId: null,
        categoryId: dto.categoryId,
        clientTenantId: association.clientTenantId,
        competenceMonth: competenceDate(dto.competenceMonth),
        createdByUserId: user.id,
        description: dto.description,
        dueOn: dto.dueOn ?? null,
        expenseType: dto.expenseType,
        notes: dto.notes ?? null,
        paidOn: payment.paidOn,
        paymentMethod: dto.paymentMethod ?? null,
        projectId: association.projectId,
        seriesDetached: false,
        seriesId: null,
        seriesIndex: null,
        status: payment.status,
        subcategoryId: dto.subcategoryId ?? null,
        supplierName: dto.supplierName ?? null,
      }),
    );
    this.logger.log(`actor=${user.id} expense=${saved.id} outcome=created`);
    return this.detail(saved);
  }

  private async createSeries(user: User, dto: CreateExpenseDto): Promise<ExpenseSeriesCreatedDto> {
    const recurrence = dto.recurrence;

    if (!recurrence || !isIsoDate(recurrence.startsOn)) {
      throw new BadRequestException('Invalid input.');
    }

    const association = await this.resolveAssociation(dto.clientTenantId ?? null, dto.projectId ?? null);
    await this.requireCategory(dto.categoryId);
    await this.requireSubcategory(dto.subcategoryId ?? null, dto.categoryId);
    const seriesId = randomUUID();
    const shared = {
      amountCents: dto.amountCents,
      categoryId: dto.categoryId,
      clientTenantId: association.clientTenantId,
      description: dto.description,
      expenseType: dto.expenseType,
      notes: dto.notes ?? null,
      paymentMethod: dto.paymentMethod ?? null,
      projectId: association.projectId,
      subcategoryId: dto.subcategoryId ?? null,
      supplierName: dto.supplierName ?? null,
    };
    const series: SeriesRecord = {
      active: true,
      id: seriesId,
      interval: recurrence.interval,
      occurrenceCount: recurrence.count,
      shared,
      startsOn: recurrence.startsOn,
    };
    const projected = projectSeries(series);
    await this.dataSource.transaction(async (manager) => {
      const seriesRepository = manager.getRepository(ExpenseSeries);
      const expenseRepository = manager.getRepository(OperatingExpense);
      await seriesRepository.save(seriesRepository.create(this.seriesEntity(series, user.id)));

      for (const row of projected) {
        await expenseRepository.save(expenseRepository.create(this.expenseEntity(row, user.id)));
      }
    });
    this.logger.log(`actor=${user.id} series=${seriesId} outcome=created`);
    return {
      firstExpenseId: projected[0]?.id ?? seriesId,
      generatedCount: projected.length,
      seriesId,
    };
  }

  private async updateSeries(user: User, seriesId: string, dto: UpdateExpenseDto): Promise<void> {
    const series = await this.seriesRepo.findOne({ where: { id: seriesId } });

    if (!series) {
      throw new NotFoundException('Not found.');
    }

    const current = this.seriesRecord(series);
    const merged = { ...current.shared, ...this.sharedPatch(dto) };
    const association = await this.resolveAssociation(
      dto.clientTenantId !== undefined || dto.projectId !== undefined ? merged.clientTenantId : current.shared.clientTenantId,
      dto.projectId !== undefined ? merged.projectId : current.shared.projectId,
    );

    if (dto.clientTenantId !== undefined || dto.projectId !== undefined) {
      merged.clientTenantId = association.clientTenantId;
      merged.projectId = association.projectId;
    }

    await this.requireCategory(
      merged.categoryId,
      dto.categoryId === undefined || dto.categoryId === series.categoryId ? series.categoryId : undefined,
    );
    await this.requireSubcategory(
      merged.subcategoryId,
      merged.categoryId,
      dto.subcategoryId === undefined ? series.subcategoryId : undefined,
    );
    const existing = (await this.expenses.find()).filter((row) => row.seriesId === seriesId);
    const next = applySeriesPatch(
      current,
      existing.map((row) => this.seriesExpenseRecord(row)),
      {
        count: dto.count,
        shared: merged,
        startsOn: dto.startsOn,
      },
    );
    await this.dataSource.transaction(async (manager) => {
      const expenseRepository = manager.getRepository(OperatingExpense);
      const seriesRepository = manager.getRepository(ExpenseSeries);
      const known = new Map(existing.map((row) => [row.id, row]));
      const finals = new Map<string, string>();

      for (const record of next.expenses) {
        const entity = known.get(record.id);

        if (!entity) {
          continue;
        }

        this.copyRecord(entity, record, user);
        finals.set(entity.id, entity.competenceMonth);
        entity.competenceMonth = temporaryCompetence(entity.seriesIndex ?? record.seriesIndex);
        await expenseRepository.save(entity);
      }

      for (const record of next.expenses) {
        const entity = known.get(record.id);

        if (!entity) {
          continue;
        }

        entity.competenceMonth = finals.get(entity.id) ?? entity.competenceMonth;
        await expenseRepository.save(entity);
      }

      for (const record of next.expenses) {
        if (known.has(record.id)) {
          continue;
        }

        await expenseRepository.save(expenseRepository.create(this.expenseEntity(record, user.id)));
      }

      this.copySeries(series, next.series);
      await seriesRepository.save(series);
    });
    this.logger.log(`actor=${user.id} series=${series.id} outcome=updated`);
  }

  private async applyOccurrence(
    expense: OperatingExpense,
    dto: UpdateExpenseDto,
    user: User,
    detach: boolean,
  ): Promise<void> {
    const categoryId = dto.categoryId ?? expense.categoryId;
    await this.requireCategory(categoryId, dto.categoryId === undefined ? expense.categoryId : undefined);
    const subcategoryId = dto.subcategoryId === undefined ? expense.subcategoryId : dto.subcategoryId;
    await this.requireSubcategory(
      subcategoryId,
      categoryId,
      dto.subcategoryId === undefined ? expense.subcategoryId : undefined,
    );
    const association = await this.resolveAssociation(
      dto.clientTenantId === undefined && dto.projectId === undefined
        ? expense.clientTenantId
        : dto.clientTenantId === undefined
          ? expense.clientTenantId
          : dto.clientTenantId,
      dto.projectId === undefined ? expense.projectId : dto.projectId,
    );

    if (dto.clientTenantId !== undefined || dto.projectId !== undefined) {
      expense.clientTenantId = association.clientTenantId;
      expense.projectId = association.projectId;
    }

    if (dto.description !== undefined) {
      expense.description = dto.description;
    }

    if (dto.categoryId !== undefined) {
      expense.categoryId = dto.categoryId;
    }

    if (dto.subcategoryId !== undefined) {
      expense.subcategoryId = subcategoryId;
    }

    if (dto.amountCents !== undefined) {
      expense.amountCents = dto.amountCents;
    }

    if (dto.expenseType !== undefined) {
      expense.expenseType = dto.expenseType;
    }

    if (dto.supplierName !== undefined) {
      expense.supplierName = dto.supplierName;
    }

    if (dto.paymentMethod !== undefined) {
      expense.paymentMethod = dto.paymentMethod;
    }

    if (dto.notes !== undefined) {
      expense.notes = dto.notes;
    }

    if (dto.competenceMonth !== undefined) {
      expense.competenceMonth = competenceDate(dto.competenceMonth);
    }

    if (dto.dueOn !== undefined) {
      expense.dueOn = dto.dueOn;
    }

    const payment = resolveStatus(
      { paidOn: this.dateOnly(expense.paidOn), status: expense.status as ExpenseStatus },
      { paidOn: dto.paidOn, status: dto.status },
    );

    if (!payment) {
      throw new BadRequestException('Invalid input.');
    }

    this.applyPayment(expense, payment.status, payment.paidOn, user);

    if (detach) {
      expense.seriesDetached = true;
    }
  }

  private async loadRows(): Promise<ExpenseListRow[]> {
    const [expenses, categories, subcategories, series, tenants, projects] = await Promise.all([
      this.expenses.find(),
      this.categories.find(),
      this.subcategories.find(),
      this.seriesRepo.find(),
      this.tenants.find(),
      this.projects.find(),
    ]);
    const categoryName = new Map(categories.map((category) => [category.id, category.name]));
    const subcategoryName = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory.name]));
    const seriesInterval = new Map(series.map((row) => [row.id, row.interval as ExpenseInterval]));
    const tenantName = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));
    const projectName = new Map(projects.map((project) => [project.id, project.name]));

    return expenses.map((expense) => ({
      amountCents: Number(expense.amountCents),
      categoryId: expense.categoryId,
      categoryName: categoryName.get(expense.categoryId) ?? '',
      clientTenantId: expense.clientTenantId,
      clientTenantName: expense.clientTenantId ? (tenantName.get(expense.clientTenantId) ?? null) : null,
      competenceMonth: monthKey(this.dateOnly(expense.competenceMonth)) ?? '',
      createdAt: this.iso(expense.createdAt),
      description: expense.description,
      dueOn: this.dateOnly(expense.dueOn),
      expenseType: expense.expenseType as ExpenseType,
      id: expense.id,
      notes: expense.notes,
      paidOn: this.dateOnly(expense.paidOn),
      paymentMethod: expense.paymentMethod,
      projectId: expense.projectId,
      projectName: expense.projectId ? (projectName.get(expense.projectId) ?? null) : null,
      recurrence: expense.seriesId ? (seriesInterval.get(expense.seriesId) ?? null) : null,
      seriesDetached: expense.seriesDetached,
      seriesId: expense.seriesId,
      seriesIndex: expense.seriesIndex,
      status: expense.status as ExpenseStatus,
      subcategoryId: expense.subcategoryId,
      subcategoryName: expense.subcategoryId ? (subcategoryName.get(expense.subcategoryId) ?? null) : null,
      supplierName: expense.supplierName,
      updatedAt: this.iso(expense.updatedAt),
    }));
  }

  private async detail(expense: OperatingExpense): Promise<ExpenseDetailDto> {
    const rows = await this.loadRows();
    const row = rows.find((item) => item.id === expense.id);

    if (!row) {
      throw new NotFoundException('Not found.');
    }

    const documents = (await this.documents.find())
      .filter((document) => document.expenseId === expense.id)
      .toSorted((left, right) => this.iso(left.createdAt).localeCompare(this.iso(right.createdAt)));

    return {
      ...this.withoutNotes(row),
      documents: documents.map((document) => this.documentDto(document)),
      notes: row.notes,
    };
  }

  private withoutNotes(row: ExpenseListRow): ExpenseItemDto {
    const { notes: _notes, ...item } = row;
    return item;
  }

  private async requireExpense(id: string): Promise<OperatingExpense> {
    const expense = await this.expenses.findOne({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Not found.');
    }

    return expense;
  }

  private async requireDocument(expenseId: string, documentId: string): Promise<OperatingExpenseDocument> {
    const document = (await this.documents.find()).find(
      (row) => row.id === documentId && row.expenseId === expenseId,
    );

    if (!document) {
      throw new NotFoundException('Not found.');
    }

    return document;
  }

  private async requireAdministrador(actor: AuthenticatedUser): Promise<User> {
    const user = await this.users.findOne({ where: { id: actor.id, status: 'active' } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    return user;
  }

  private async requireVetorTenant(): Promise<Tenant> {
    const slug = this.config.get<string>('BOOTSTRAP_ADMIN_TENANT_SLUG', 'vetor');
    const tenant = await this.tenants.findOne({ where: { slug } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    return tenant;
  }

  private async requireCategory(id: string, allowInactiveId?: string): Promise<ExpenseCategory> {
    const category = await this.categories.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Not found.');
    }

    if (!category.active && category.id !== allowInactiveId) {
      throw new BadRequestException('Invalid input.');
    }

    return category;
  }

  private async requireSubcategory(
    id: string | null,
    categoryId: string,
    allowInactiveId?: string | null,
  ): Promise<ExpenseSubcategory | null> {
    if (!id) {
      return null;
    }

    const subcategory = await this.subcategories.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException('Not found.');
    }

    if (subcategory.categoryId !== categoryId) {
      throw new BadRequestException('Invalid input.');
    }

    if (!subcategory.active && subcategory.id !== allowInactiveId) {
      throw new BadRequestException('Invalid input.');
    }

    return subcategory;
  }

  private async resolveAssociation(
    clientTenantId: string | null,
    projectId: string | null,
  ): Promise<Association> {
    if (projectId) {
      const project = await this.projects.findOne({ where: { id: projectId } });
      const workspace = project
        ? await this.workspaces.findOne({ where: { id: project.workspaceId } })
        : null;

      if (!project || !workspace) {
        throw new NotFoundException('Not found.');
      }

      if (clientTenantId && clientTenantId !== workspace.tenantId) {
        throw new BadRequestException('Invalid input.');
      }

      return { clientTenantId: workspace.tenantId, projectId };
    }

    if (clientTenantId) {
      const tenant = await this.tenants.findOne({ where: { id: clientTenantId } });

      if (!tenant) {
        throw new NotFoundException('Not found.');
      }

      return { clientTenantId, projectId: null };
    }

    return { clientTenantId: null, projectId: null };
  }

  private assertDates(...values: Array<string | null | undefined>): void {
    if (values.some((value) => value && !isIsoDate(value))) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private assertUniqueName(rows: Array<{ id: string; name: string }>, name: string, exceptId?: string): void {
    const normalized = name.toLocaleLowerCase();

    if (rows.some((row) => row.id !== exceptId && row.name.toLocaleLowerCase() === normalized)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private nextPosition(rows: Array<{ position: number }>): number {
    return rows.reduce((max, row) => Math.max(max, row.position), 0) + 1;
  }

  private markCancelled(expense: OperatingExpense, user: User): void {
    this.applyPayment(expense, 'cancelled', this.dateOnly(expense.paidOn), user);
  }

  private applyPayment(
    expense: OperatingExpense,
    status: ExpenseStatus,
    paidOn: string | null,
    user: User,
  ): void {
    const previous = expense.status;
    expense.status = status;
    expense.paidOn = paidOn;

    if (status === 'cancelled') {
      if (previous !== 'cancelled') {
        expense.cancelledAt = new Date();
        expense.cancelledByUserId = user.id;
      }

      return;
    }

    expense.cancelledAt = null;
    expense.cancelledByUserId = null;
  }

  private sharedPatch(dto: UpdateExpenseDto) {
    return {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.amountCents !== undefined ? { amountCents: dto.amountCents } : {}),
      ...(dto.expenseType !== undefined ? { expenseType: dto.expenseType } : {}),
      ...(dto.subcategoryId !== undefined ? { subcategoryId: dto.subcategoryId } : {}),
      ...(dto.supplierName !== undefined ? { supplierName: dto.supplierName } : {}),
      ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.clientTenantId !== undefined ? { clientTenantId: dto.clientTenantId } : {}),
      ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
    };
  }

  private seriesRecord(series: ExpenseSeries): SeriesRecord {
    return {
      active: series.active,
      id: series.id,
      interval: series.interval as ExpenseInterval,
      occurrenceCount: series.occurrenceCount,
      shared: {
        amountCents: Number(series.amountCents),
        categoryId: series.categoryId,
        clientTenantId: series.clientTenantId,
        description: series.description,
        expenseType: series.expenseType as ExpenseType,
        notes: series.notes,
        paymentMethod: series.paymentMethod,
        projectId: series.projectId,
        subcategoryId: series.subcategoryId,
        supplierName: series.supplierName,
      },
      startsOn: this.dateOnly(series.startsOn) ?? series.startsOn,
    };
  }

  private seriesExpenseRecord(expense: OperatingExpense): SeriesExpenseRecord {
    return {
      competenceMonth: monthKey(this.dateOnly(expense.competenceMonth)) ?? '',
      dueOn: this.dateOnly(expense.dueOn),
      id: expense.id,
      paidOn: this.dateOnly(expense.paidOn),
      seriesDetached: expense.seriesDetached,
      seriesId: expense.seriesId ?? '',
      seriesIndex: expense.seriesIndex ?? 0,
      shared: {
        amountCents: Number(expense.amountCents),
        categoryId: expense.categoryId,
        clientTenantId: expense.clientTenantId,
        description: expense.description,
        expenseType: expense.expenseType as ExpenseType,
        notes: expense.notes,
        paymentMethod: expense.paymentMethod,
        projectId: expense.projectId,
        subcategoryId: expense.subcategoryId,
        supplierName: expense.supplierName,
      },
      status: expense.status as ExpenseStatus,
    };
  }

  private copyRecord(expense: OperatingExpense, record: SeriesExpenseRecord, user: User): void {
    expense.description = record.shared.description;
    expense.categoryId = record.shared.categoryId;
    expense.subcategoryId = record.shared.subcategoryId;
    expense.amountCents = record.shared.amountCents;
    expense.expenseType = record.shared.expenseType;
    expense.supplierName = record.shared.supplierName;
    expense.paymentMethod = record.shared.paymentMethod;
    expense.notes = record.shared.notes;
    expense.clientTenantId = record.shared.clientTenantId;
    expense.projectId = record.shared.projectId;
    expense.seriesId = record.seriesId;
    expense.seriesIndex = record.seriesIndex;
    expense.seriesDetached = record.seriesDetached;
    expense.dueOn = record.dueOn;
    expense.competenceMonth = competenceDate(record.competenceMonth);
    this.applyPayment(expense, record.status, record.paidOn, user);
  }

  private copySeries(series: ExpenseSeries, record: SeriesRecord): void {
    series.interval = record.interval;
    series.occurrenceCount = record.occurrenceCount;
    series.startsOn = record.startsOn;
    series.description = record.shared.description;
    series.categoryId = record.shared.categoryId;
    series.subcategoryId = record.shared.subcategoryId;
    series.amountCents = record.shared.amountCents;
    series.expenseType = record.shared.expenseType;
    series.supplierName = record.shared.supplierName;
    series.paymentMethod = record.shared.paymentMethod;
    series.notes = record.shared.notes;
    series.clientTenantId = record.shared.clientTenantId;
    series.projectId = record.shared.projectId;
    series.active = record.active;
  }

  private seriesEntity(series: SeriesRecord, userId: string): Partial<ExpenseSeries> {
    return {
      active: series.active,
      amountCents: series.shared.amountCents,
      categoryId: series.shared.categoryId,
      clientTenantId: series.shared.clientTenantId,
      createdByUserId: userId,
      description: series.shared.description,
      expenseType: series.shared.expenseType,
      id: series.id,
      interval: series.interval,
      notes: series.shared.notes,
      occurrenceCount: series.occurrenceCount,
      paymentMethod: series.shared.paymentMethod,
      projectId: series.shared.projectId,
      startsOn: series.startsOn,
      subcategoryId: series.shared.subcategoryId,
      supplierName: series.shared.supplierName,
    };
  }

  private expenseEntity(record: SeriesExpenseRecord, userId: string): Partial<OperatingExpense> {
    return {
      amountCents: record.shared.amountCents,
      cancelledAt: null,
      cancelledByUserId: null,
      categoryId: record.shared.categoryId,
      clientTenantId: record.shared.clientTenantId,
      competenceMonth: competenceDate(record.competenceMonth),
      createdByUserId: userId,
      description: record.shared.description,
      dueOn: record.dueOn,
      expenseType: record.shared.expenseType,
      id: record.id,
      notes: record.shared.notes,
      paidOn: record.paidOn,
      paymentMethod: record.shared.paymentMethod,
      projectId: record.shared.projectId,
      seriesDetached: record.seriesDetached,
      seriesId: record.seriesId,
      seriesIndex: record.seriesIndex,
      status: record.status,
      subcategoryId: record.shared.subcategoryId,
      supplierName: record.shared.supplierName,
    };
  }

  private subcategoryNode(
    subcategory: ExpenseSubcategory,
    expenses: OperatingExpense[],
  ): ExpenseSubcategoryNodeDto {
    return {
      active: subcategory.active,
      expenseCount: expenses.filter((expense) => expense.subcategoryId === subcategory.id).length,
      id: subcategory.id,
      name: subcategory.name,
      position: subcategory.position,
      slug: subcategory.slug,
    };
  }

  private categoryNode(category: ExpenseCategory, expenseCount: number) {
    return {
      active: category.active,
      expenseCount,
      id: category.id,
      name: category.name,
      position: category.position,
      slug: category.slug,
    };
  }

  private documentDto(document: OperatingExpenseDocument): ExpenseDocumentDto {
    return {
      byteSize: document.byteSize,
      contentType: document.contentType,
      createdAt: this.iso(document.createdAt),
      id: document.id,
      originalName: document.originalName,
    };
  }

  private dateOnly(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
  }

  private iso(value: Date | string | undefined): string {
    if (!value) {
      return new Date(0).toISOString();
    }

    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
