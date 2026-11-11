import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { User } from '../portal/entities/user.entity.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import { contractPointerFor, isPdfBuffer } from './attachment-file.js';
import { safeFinanceDocumentName } from './finance-document-file.js';
import { FinanceDocumentsService } from './finance-documents.service.js';
import {
  CostEntryDto,
  PaymentEntryDto,
  ReplaceCostLinesDto,
  UpsertContractDto,
} from './dto/finance.dto.js';
import {
  ContractDto,
  ContractFileDto,
  CostDto,
  FinanceListDto,
  FinanceProjectDto,
  InstallmentAmountDto,
  PaymentDto,
  ProjectFinanceDto,
  SavedContractDto,
} from './dto/finance-response.dto.js';
import { ProjectContractInstallment } from './entities/project-contract-installment.entity.js';
import { ProjectContract } from './entities/project-contract.entity.js';
import { ProjectCost } from './entities/project-cost.entity.js';
import { ProjectPayment } from './entities/project-payment.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import {
  calendarDate,
  COST_CATEGORY_LABELS,
  financeAmounts,
  MAX_CONTRACT_PDF_BYTES,
  MAX_FINANCE_ENTRIES,
  saoPauloCalendarDate,
  sumFinanceAmounts,
  type CostCategory,
  type FinanceAmountTotals,
} from './finance-amounts.js';

interface FinanceListRow {
  tenantId: string;
  tenantName: string;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  contractId: string | null;
  title: string | null;
  signedOn: string | null;
  startsOn: string | null;
  endsOn: string | null;
  totalAmountCents: string | number | null;
  installmentCount: string | number | null;
  status: ContractDto['status'] | null;
  contractFilename: string | null;
  originalName: string | null;
  paidAmountCents: string | number | null;
  costAmountCents: string | number | null;
}

@Injectable()
export class ProjectFinanceService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectWorkspace)
    private readonly workspaces: Repository<ProjectWorkspace>,
    @InjectRepository(ProjectContract)
    private readonly contracts: Repository<ProjectContract>,
    @InjectRepository(ProjectContractInstallment)
    private readonly installments: Repository<ProjectContractInstallment>,
    @InjectRepository(ProjectPayment)
    private readonly payments: Repository<ProjectPayment>,
    @InjectRepository(ProjectCost)
    private readonly costs: Repository<ProjectCost>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly tenantStorage: TenantStorageService,
    private readonly financeDocuments: FinanceDocumentsService,
  ) {}

  async list(actor: AuthenticatedUser): Promise<FinanceListDto> {
    await this.requireAdministrador(actor);

    const rows = await this.projects.manager.query<FinanceListRow[]>(
      `
      SELECT
        tenant.id AS "tenantId",
        tenant.name AS "tenantName",
        project.id AS "projectId",
        project.name AS "projectName",
        workspace.id AS "workspaceId",
        workspace.name AS "workspaceName",
        contract.id AS "contractId",
        contract.title AS "title",
        contract.signed_on::text AS "signedOn",
        contract.starts_on::text AS "startsOn",
        contract.ends_on::text AS "endsOn",
        contract.total_amount_cents AS "totalAmountCents",
        contract.installment_count AS "installmentCount",
        contract.status AS "status",
        contract.contract_filename AS "contractFilename",
        contract.original_name AS "originalName",
        COALESCE(paid.amount, 0) AS "paidAmountCents",
        COALESCE(cost.amount, 0) AS "costAmountCents"
      FROM projects project
      INNER JOIN project_workspaces workspace ON workspace.id = project.workspace_id
      INNER JOIN tenants tenant ON tenant.id = workspace.tenant_id
      LEFT JOIN project_contracts contract ON contract.project_id = project.id
      LEFT JOIN (
        SELECT project_id, SUM(amount_cents) AS amount
        FROM project_contract_installments
        WHERE due_on IS NOT NULL AND due_on <= $1::date
        GROUP BY project_id
      ) paid ON paid.project_id = project.id
      LEFT JOIN (
        SELECT project_id, SUM(amount_cents) AS amount
        FROM project_costs
        GROUP BY project_id
      ) cost ON cost.project_id = project.id
      `,
      [saoPauloCalendarDate()],
    );

    const projects = rows
      .map((row) => this.toListProject(row))
      .sort((left, right) => {
        const tenantOrder = left.tenantName.localeCompare(
          right.tenantName,
          'pt-BR',
          {
            sensitivity: 'base',
          },
        );

        if (tenantOrder !== 0) {
          return tenantOrder;
        }

        const workspaceOrder = left.workspaceName.localeCompare(
          right.workspaceName,
          'pt-BR',
          { sensitivity: 'base' },
        );

        if (workspaceOrder !== 0) {
          return workspaceOrder;
        }

        return left.projectName.localeCompare(right.projectName, 'pt-BR', {
          sensitivity: 'base',
        });
      });

    return {
      projects,
      totals: sumFinanceAmounts(projects),
    };
  }

  async getProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<ProjectFinanceDto> {
    const { project } = await this.requireProject(actor, projectId);
    const summary = (await this.list(actor)).projects.find(
      (item) => item.projectId === project.id,
    );

    if (!summary) {
      throw new NotFoundException('Not found.');
    }

    const [payments, costs, installments] = await Promise.all([
      this.payments.find({
        order: { paidOn: 'DESC', createdAt: 'DESC' },
        where: { projectId: project.id },
      }),
      this.costs.find({
        order: { position: 'ASC', createdAt: 'ASC' },
        where: { projectId: project.id },
      }),
      this.installments.find({
        order: { position: 'ASC' },
        where: { projectId: project.id },
      }),
    ]);

    return {
      ...summary,
      costs: costs.map((cost) => this.toCost(cost)),
      installments: installments.map((installment) =>
        this.toInstallment(installment),
      ),
      payments: payments.map((payment) => this.toPayment(payment)),
    };
  }

  async upsertContract(
    actor: AuthenticatedUser,
    projectId: string,
    dto: UpsertContractDto,
  ): Promise<SavedContractDto> {
    const { project, user } = await this.requireProject(actor, projectId);
    this.assertDateOrder(dto.startsOn, dto.endsOn);

    if (dto.installments.length !== dto.installmentCount) {
      throw new BadRequestException('Invalid input.');
    }

    return this.contracts.manager.transaction(async (manager) => {
      const contracts = manager.getRepository(ProjectContract);
      const installments = manager.getRepository(ProjectContractInstallment);
      let contract = await contracts.findOne({
        where: { projectId: project.id },
      });

      if (!contract) {
        contract = contracts.create({
          byteSize: null,
          contractFilename: null,
          createdByUserId: user.id,
          originalName: null,
          projectId: project.id,
        });
      }

      contract.title = dto.title.trim();
      contract.signedOn = this.optionalDate(dto.signedOn);
      contract.startsOn = this.optionalDate(dto.startsOn);
      contract.endsOn = this.optionalDate(dto.endsOn);
      contract.totalAmountCents = dto.totalAmountCents;
      contract.installmentCount = dto.installmentCount;
      contract.status = dto.status;

      const saved = await contracts.save(contract);
      await installments.delete({ projectId: project.id });
      const rows = dto.installments.map((installment, index) =>
        installments.create({
          amountCents: installment.amountCents,
          createdByUserId: user.id,
          dueOn: this.optionalInstallmentDate(installment.dueOn),
          position: index + 1,
          projectId: project.id,
        }),
      );
      const stored = rows.length > 0 ? await installments.save(rows) : [];

      return this.toSavedContract(saved, stored);
    });
  }

  async saveContractFile(
    actor: AuthenticatedUser,
    projectId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ): Promise<ContractFileDto> {
    const { project } = await this.requireProject(actor, projectId);
    const contract = await this.contracts.findOne({
      where: { projectId: project.id },
    });

    if (!contract) {
      throw new NotFoundException('Not found.');
    }

    if (
      file.mimetype !== 'application/pdf' ||
      file.size < 1 ||
      file.size > MAX_CONTRACT_PDF_BYTES ||
      !isPdfBuffer(file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const pointer = contractPointerFor(project.id);
    const workspace = await this.requireWorkspace(project.workspaceId);
    await this.tenantStorage.writeTenantFile(
      workspace.tenantId,
      pointer,
      file.buffer,
      'contract',
    );
    contract.contractFilename = pointer;
    contract.originalName = this.safeOriginalName(file.originalname);
    contract.byteSize = file.size;
    await this.contracts.save(contract);
    await this.financeDocuments.upload(actor, project.id, {
      buffer: file.buffer,
      mimetype: 'application/pdf',
      originalname: this.financeDocumentName(contract.originalName),
      size: file.size,
    });

    return { hasFile: true, originalName: contract.originalName };
  }

  async readContractFile(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ bytes: Buffer; originalName: string }> {
    const { project } = await this.requireProject(actor, projectId);
    const contract = await this.contracts.findOne({
      where: { projectId: project.id },
    });

    if (!contract?.contractFilename || !contract.originalName) {
      throw new NotFoundException('Not found.');
    }

    const workspace = await this.requireWorkspace(project.workspaceId);
    const bytes = await this.tenantStorage.readTenantFile(
      workspace.tenantId,
      contract.contractFilename,
      'contract',
    );

    return { bytes, originalName: contract.originalName };
  }

  async deleteContractFile(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<void> {
    const { project } = await this.requireProject(actor, projectId);
    const contract = await this.contracts.findOne({
      where: { projectId: project.id },
    });

    if (!contract) {
      throw new NotFoundException('Not found.');
    }

    if (contract.contractFilename) {
      const workspace = await this.requireWorkspace(project.workspaceId);
      await this.tenantStorage.deleteTenantFile(
        workspace.tenantId,
        contract.contractFilename,
        'contract',
      );
    }

    contract.contractFilename = null;
    contract.originalName = null;
    contract.byteSize = null;
    await this.contracts.save(contract);
  }

  async createPayment(
    actor: AuthenticatedUser,
    projectId: string,
    dto: PaymentEntryDto,
  ): Promise<PaymentDto> {
    const { project, user } = await this.requireProject(actor, projectId);
    await this.assertEntryRoom(this.payments, project.id);
    const saved = await this.payments.save(
      this.payments.create({
        amountCents: dto.amountCents,
        createdByUserId: user.id,
        note: this.optionalNote(dto.note),
        paidOn: this.requiredDate(dto.paidOn),
        projectId: project.id,
      }),
    );

    return this.toPayment(saved);
  }

  async updatePayment(
    actor: AuthenticatedUser,
    projectId: string,
    paymentId: string,
    dto: PaymentEntryDto,
  ): Promise<PaymentDto> {
    const { project } = await this.requireProject(actor, projectId);
    const payment = await this.payments.findOne({
      where: { id: paymentId, projectId: project.id },
    });

    if (!payment) {
      throw new NotFoundException('Not found.');
    }

    payment.paidOn = this.requiredDate(dto.paidOn);
    payment.amountCents = dto.amountCents;
    payment.note = this.optionalNote(dto.note);

    return this.toPayment(await this.payments.save(payment));
  }

  async deletePayment(
    actor: AuthenticatedUser,
    projectId: string,
    paymentId: string,
  ): Promise<void> {
    const { project } = await this.requireProject(actor, projectId);
    const payment = await this.payments.findOne({
      where: { id: paymentId, projectId: project.id },
    });

    if (!payment) {
      throw new NotFoundException('Not found.');
    }

    await this.payments.delete({ id: payment.id });
  }

  async createCost(
    actor: AuthenticatedUser,
    projectId: string,
    dto: CostEntryDto,
  ): Promise<CostDto> {
    const { project, user } = await this.requireProject(actor, projectId);
    await this.assertEntryRoom(this.costs, project.id);
    const position = await this.nextCostPosition(project.id);
    const saved = await this.costs.save(
      this.costs.create({
        amountCents: dto.amountCents,
        category: dto.category,
        createdByUserId: user.id,
        incurredOn: this.requiredDate(dto.incurredOn),
        label: this.costLabel(dto),
        note: this.optionalNote(dto.note),
        position,
        projectId: project.id,
      }),
    );

    return this.toCost(saved);
  }

  async updateCost(
    actor: AuthenticatedUser,
    projectId: string,
    costId: string,
    dto: CostEntryDto,
  ): Promise<CostDto> {
    const { project } = await this.requireProject(actor, projectId);
    const cost = await this.costs.findOne({
      where: { id: costId, projectId: project.id },
    });

    if (!cost) {
      throw new NotFoundException('Not found.');
    }

    cost.incurredOn = this.requiredDate(dto.incurredOn);
    cost.amountCents = dto.amountCents;
    cost.category = dto.category;
    cost.note = this.optionalNote(dto.note);

    if (dto.label !== undefined) {
      cost.label = dto.label;
    }

    return this.toCost(await this.costs.save(cost));
  }

  async deleteCost(
    actor: AuthenticatedUser,
    projectId: string,
    costId: string,
  ): Promise<void> {
    const { project } = await this.requireProject(actor, projectId);
    const cost = await this.costs.findOne({
      where: { id: costId, projectId: project.id },
    });

    if (!cost) {
      throw new NotFoundException('Not found.');
    }

    await this.costs.delete({ id: cost.id });
  }

  async replaceCostLines(
    actor: AuthenticatedUser,
    projectId: string,
    dto: ReplaceCostLinesDto,
  ): Promise<CostDto[]> {
    const { project, user } = await this.requireProject(actor, projectId);

    if (dto.lines.length > MAX_FINANCE_ENTRIES) {
      throw new BadRequestException('Invalid input.');
    }

    const incurredOn = calendarDate();

    return this.contracts.manager.transaction(async (manager) => {
      const costs = manager.getRepository(ProjectCost);
      await costs.delete({ projectId: project.id });

      if (dto.lines.length === 0) {
        return [];
      }

      const rows = dto.lines.map((line, index) =>
        costs.create({
          amountCents: line.amountCents,
          category: 'other' as const,
          createdByUserId: user.id,
          incurredOn,
          label: line.label.trim(),
          note: null,
          position: index + 1,
          projectId: project.id,
        }),
      );
      const saved = await costs.save(rows);

      return saved
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((cost) => this.toCost(cost));
    });
  }

  async unlinkContractFiles(projectIds: string[]): Promise<void> {
    if (projectIds.length === 0) {
      return;
    }

    const contracts = await this.contracts.find({
      where: { projectId: In(projectIds) },
    });
    const projects = await this.projects.find({
      where: { id: In(projectIds) },
    });
    const workspaces = await this.workspaces.find({
      where: { id: In(projects.map((project) => project.workspaceId)) },
    });
    const tenantByProject = new Map(
      projects.map((project) => {
        const workspace = workspaces.find(
          (item) => item.id === project.workspaceId,
        );
        return [project.id, workspace?.tenantId] as const;
      }),
    );

    for (const contract of contracts) {
      const tenantId = tenantByProject.get(contract.projectId);

      if (!tenantId || !contract.contractFilename) {
        continue;
      }

      await this.tenantStorage.deleteTenantFile(
        tenantId,
        contract.contractFilename,
        'contract',
      );
    }
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

  private async requireProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ project: Project; user: User }> {
    const user = await this.requireAdministrador(actor);
    const project = await this.projects.findOne({ where: { id: projectId } });
    const workspace = project
      ? await this.workspaces.findOne({ where: { id: project.workspaceId } })
      : null;

    if (!project || !workspace) {
      throw new NotFoundException('Not found.');
    }

    return { project, user };
  }

  private async requireWorkspace(
    workspaceId: string,
  ): Promise<ProjectWorkspace> {
    const workspace = await this.workspaces.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    return workspace;
  }

  private async assertEntryRoom(
    repository: Repository<ProjectPayment | ProjectCost>,
    projectId: string,
  ): Promise<void> {
    const count = await repository.count({ where: { projectId } });

    if (count >= MAX_FINANCE_ENTRIES) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private toListProject(row: FinanceListRow): FinanceProjectDto {
    const contractCents = row.contractId
      ? this.asCents(row.totalAmountCents)
      : 0;
    const installmentCount = row.contractId
      ? (this.asCount(row.installmentCount) ?? 1)
      : null;
    const amounts = financeAmounts(
      contractCents,
      this.asCents(row.paidAmountCents),
      this.asCents(row.costAmountCents),
    );

    return {
      ...amounts,
      contract: row.contractId
        ? {
            endsOn: this.asDate(row.endsOn),
            hasFile: Boolean(row.contractFilename),
            originalName: row.originalName,
            signedOn: this.asDate(row.signedOn),
            startsOn: this.asDate(row.startsOn),
            installmentCount: installmentCount ?? 1,
            status: row.status ?? 'draft',
            title: row.title ?? '',
            totalAmountCents: contractCents,
          }
        : null,
      installmentCount,
      projectId: row.projectId,
      projectName: row.projectName,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      workspaceId: row.workspaceId,
      workspaceName: row.workspaceName,
    };
  }

  private toContract(contract: ProjectContract): ContractDto {
    return {
      endsOn: this.asDate(contract.endsOn),
      hasFile: Boolean(contract.contractFilename),
      originalName: contract.originalName,
      signedOn: this.asDate(contract.signedOn),
      startsOn: this.asDate(contract.startsOn),
      installmentCount: contract.installmentCount,
      status: contract.status,
      title: contract.title,
      totalAmountCents: this.asCents(contract.totalAmountCents),
    };
  }

  private toSavedContract(
    contract: ProjectContract,
    installments: ProjectContractInstallment[],
  ): SavedContractDto {
    return {
      ...this.toContract(contract),
      installments: installments
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((installment) => this.toInstallment(installment)),
    };
  }

  private toInstallment(
    installment: ProjectContractInstallment,
  ): InstallmentAmountDto {
    return {
      amountCents: this.asCents(installment.amountCents),
      dueOn: this.asDate(installment.dueOn),
      position: installment.position,
    };
  }

  private toPayment(payment: ProjectPayment): PaymentDto {
    return {
      amountCents: this.asCents(payment.amountCents),
      id: payment.id,
      note: payment.note,
      paidOn: this.asDate(payment.paidOn) ?? payment.paidOn,
    };
  }

  private toCost(cost: ProjectCost): CostDto {
    return {
      amountCents: this.asCents(cost.amountCents),
      category: cost.category as CostCategory,
      id: cost.id,
      incurredOn: this.asDate(cost.incurredOn) ?? cost.incurredOn,
      label: cost.label,
      note: cost.note,
    };
  }

  private asCount(value: string | number | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }

    const count = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(count) ? count : null;
  }

  private asCents(value: string | number | null | undefined): number {
    if (value == null) {
      return 0;
    }

    return typeof value === 'number' ? value : Number(value);
  }

  private asDate(value: string | Date | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private optionalInstallmentDate(
    value: string | null | undefined,
  ): string | null {
    if (value == null || value === '') {
      return null;
    }

    return this.requiredDate(value);
  }

  private optionalDate(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    return this.requiredDate(value);
  }

  private requiredDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('Invalid input.');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException('Invalid input.');
    }

    return value;
  }

  private assertDateOrder(startsOn?: string, endsOn?: string): void {
    if (startsOn && endsOn && endsOn < startsOn) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private optionalNote(note: string | null | undefined): string | null {
    if (note == null) {
      return null;
    }

    const trimmed = note.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private costLabel(dto: CostEntryDto): string {
    const label = dto.label?.trim();
    return label ? label : COST_CATEGORY_LABELS[dto.category];
  }

  private async nextCostPosition(projectId: string): Promise<number> {
    const rows = await this.costs.find({ where: { projectId } });
    const used = new Set(rows.map((row) => row.position));

    for (let position = 1; position <= MAX_FINANCE_ENTRIES; position += 1) {
      if (!used.has(position)) {
        return position;
      }
    }

    throw new BadRequestException('Invalid input.');
  }

  private safeOriginalName(name: string | undefined): string {
    const base =
      (name ?? 'contract.pdf').split(/[/\\]/).pop() ?? 'contract.pdf';
    const cleaned = base.replace(/[^\w.\- ()]/g, '_').slice(0, 255);
    return cleaned.length > 0 ? cleaned : 'contract.pdf';
  }

  private financeDocumentName(name: string): string {
    const withExtension = name.toLowerCase().endsWith('.pdf')
      ? name
      : `${name.slice(0, 251)}.pdf`;
    return safeFinanceDocumentName(withExtension) ?? 'contract.pdf';
  }
}

export type { FinanceAmountTotals };
