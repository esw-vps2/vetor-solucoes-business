import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import {
  attachmentPointerFor,
  matchesDeclaredAttachmentType,
} from '../projects/attachment-file.js';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_CARD,
  type AttachmentMime,
} from '../projects/project-constants.js';
import { MailService } from '../mail/mail.service.js';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import {
  TicketAttachmentDto,
  TicketCommentDto,
  TicketDetailDto,
  TicketListDto,
  TicketSummaryDto,
} from './dto/ticket-response.dto.js';
import {
  CreateTicketCommentDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto.js';
import { TicketAttachment } from './entities/ticket-attachment.entity.js';
import { TicketComment } from './entities/ticket-comment.entity.js';
import { TicketReadState } from './entities/ticket-read-state.entity.js';
import { Ticket } from './entities/ticket.entity.js';
import {
  DEFAULT_TICKET_LIMIT,
  DEFAULT_TICKET_PAGE,
  DEFAULT_TICKET_PRIORITY,
  INITIAL_TICKET_STATUS,
  TICKET_SUCCESS_MESSAGE,
} from './ticket.constants.js';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly tickets: Repository<Ticket>,
    @InjectRepository(TicketComment)
    private readonly comments: Repository<TicketComment>,
    @InjectRepository(TicketReadState)
    private readonly readStates: Repository<TicketReadState>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(TicketAttachment)
    private readonly attachments: Repository<TicketAttachment>,
    private readonly tenantStorage: TenantStorageService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateTicketDto,
  ): Promise<{ message: string; ticket: TicketDetailDto }> {
    const actorUser = await this.requireActor(actor);

    if (actorUser.profile === 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    const tenant = await this.requireTenant(actorUser.tenantId);
    const saved = await this.tickets.save(
      this.tickets.create({
        category: dto.category,
        description: dto.description,
        openedByUserId: actorUser.id,
        priority: dto.priority ?? DEFAULT_TICKET_PRIORITY,
        status: INITIAL_TICKET_STATUS,
        tenantId: tenant.id,
        title: dto.title,
      }),
    );

    this.dispatchNotice(this.notifyCompany('Novo chamado', saved));
    return {
      message: TICKET_SUCCESS_MESSAGE,
      ticket: await this.toDetail(saved, actorUser),
    };
  }

  async list(
    actor: AuthenticatedUser,
    query: ListTicketsQueryDto,
  ): Promise<TicketListDto> {
    const actorUser = await this.requireActor(actor);
    const page = query.page ?? DEFAULT_TICKET_PAGE;
    const limit = query.limit ?? DEFAULT_TICKET_LIMIT;
    const companyDesk = await this.isCompanyDesk(actorUser, actor.tenantId);
    const scopeTenantId = this.scopedTenantId(actorUser, actor.tenantId);

    if (query.tenantId && !companyDesk && query.tenantId !== scopeTenantId) {
      throw new ForbiddenException('Access denied.');
    }

    const where: FindOptionsWhere<Ticket> = {
      ...(companyDesk
        ? query.tenantId
          ? { tenantId: query.tenantId }
          : {}
        : { tenantId: scopeTenantId }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
    };
    const [rows, total] = await this.tickets.findAndCount({
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      where,
    });
    const [flags, names] = await Promise.all([
      this.newCommentFlags(actorUser.id, rows),
      this.tenantNames(rows.map((ticket) => ticket.tenantId)),
    ]);

    return {
      items: rows.map((ticket) =>
        this.toSummary(
          ticket,
          flags.get(ticket.id) ?? false,
          names.get(ticket.tenantId) ?? '',
        ),
      ),
      limit,
      page,
      total,
    };
  }

  async get(actor: AuthenticatedUser, id: string): Promise<TicketDetailDto> {
    const actorUser = await this.requireActor(actor);
    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );
    return this.toDetail(ticket, actorUser);
  }

  async updateStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateTicketStatusDto,
  ): Promise<{ message: string; ticket: TicketDetailDto }> {
    const actorUser = await this.requireActor(actor);

    if (actorUser.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );
    const previous = ticket.status;
    ticket.status = dto.status;
    const saved = await this.tickets.save(ticket);

    if (previous !== dto.status) {
      this.dispatchNotice(this.notifyTenant('Alteração de status', saved));
    }

    return {
      message: TICKET_SUCCESS_MESSAGE,
      ticket: await this.toDetail(saved, actorUser),
    };
  }

  async createComment(
    actor: AuthenticatedUser,
    id: string,
    dto: CreateTicketCommentDto,
  ): Promise<{ message: string; comment: TicketCommentDto }> {
    const actorUser = await this.requireActor(actor);
    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );
    const saved = await this.comments.save(
      this.comments.create({
        authorUserId: actorUser.id,
        body: dto.body,
        ticketId: ticket.id,
      }),
    );
    ticket.updatedAt = new Date();
    await this.tickets.save(ticket);

    if (actorUser.profile === 'Administrador') {
      this.dispatchNotice(
        this.notifyTenant('Novo comentário da empresa', ticket),
      );
    } else {
      this.dispatchNotice(
        this.notifyCompany('Novo comentário do cliente', ticket),
      );
    }

    const people = await this.usersByIds([actorUser.id]);
    return {
      comment: this.toComment(saved, people),
      message: TICKET_SUCCESS_MESSAGE,
    };
  }

  async markRead(actor: AuthenticatedUser, id: string): Promise<void> {
    const actorUser = await this.requireActor(actor);
    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );
    const existing = await this.readStates.findOne({
      where: { ticketId: ticket.id, userId: actorUser.id },
    });
    const lastSeenAt = new Date();

    if (existing) {
      existing.lastSeenAt = lastSeenAt;
      await this.readStates.save(existing);
      return;
    }

    await this.readStates.save(
      this.readStates.create({
        lastSeenAt,
        ticketId: ticket.id,
        userId: actorUser.id,
      }),
    );
  }

  async addAttachment(
    actor: AuthenticatedUser,
    id: string,
    file: Express.Multer.File | undefined,
  ): Promise<TicketAttachmentDto> {
    const actorUser = await this.requireActor(actor);
    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );

    if (!file?.buffer) {
      throw new BadRequestException('Invalid input.');
    }

    const byteSize = file.size ?? file.buffer.length;

    if (
      byteSize > MAX_ATTACHMENT_BYTES ||
      !matchesDeclaredAttachmentType(file.mimetype, file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const count = await this.attachments.count({
      where: { ticketId: ticket.id },
    });

    if (count >= MAX_ATTACHMENTS_PER_CARD) {
      throw new BadRequestException('Invalid input.');
    }

    const mime = file.mimetype as AttachmentMime;
    const saved = await this.attachments.save(
      this.attachments.create({
        byteSize,
        contentType: mime,
        createdByUserId: actorUser.id,
        filename: '',
        originalName: this.safeOriginalName(file.originalname),
        ticketId: ticket.id,
      }),
    );
    const pointer = attachmentPointerFor(saved.id, mime);

    try {
      await this.tenantStorage.writeTenantFile(
        ticket.tenantId,
        pointer,
        file.buffer,
      );
    } catch {
      await this.attachments.delete({ id: saved.id });
      throw new BadRequestException('Invalid input.');
    }

    saved.filename = pointer;
    await this.attachments.save(saved);
    ticket.updatedAt = new Date();
    await this.tickets.save(ticket);
    return this.toAttachment(saved, { [actorUser.id]: actorUser });
  }

  async readAttachment(
    actor: AuthenticatedUser,
    id: string,
    attachmentId: string,
  ): Promise<{
    bytes: Buffer;
    contentType: string;
    originalName: string;
  }> {
    const actorUser = await this.requireActor(actor);
    const ticket = await this.requireScopedTicket(
      actorUser,
      actor.tenantId,
      id,
    );
    const attachment = await this.attachments.findOne({
      where: { id: attachmentId, ticketId: ticket.id },
    });

    if (!attachment?.filename) {
      throw new NotFoundException('Not found.');
    }

    try {
      return {
        bytes: await this.tenantStorage.readTenantFile(
          ticket.tenantId,
          attachment.filename,
        ),
        contentType: attachment.contentType,
        originalName: attachment.originalName,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  private async requireActor(actor: AuthenticatedUser): Promise<User> {
    const user = await this.users.findOne({
      where: { id: actor.id, status: 'active' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  private scopedTenantId(user: User, sessionTenantId: string): string {
    if (user.profile === 'Administrador') {
      return sessionTenantId;
    }

    return user.tenantId;
  }

  private async isCompanyDesk(
    user: User,
    sessionTenantId: string,
  ): Promise<boolean> {
    if (user.profile !== 'Administrador') {
      return false;
    }

    const slug =
      this.config.get<string>('BOOTSTRAP_ADMIN_TENANT_SLUG', 'vetor')?.trim() ||
      'vetor';
    const company = await this.tenants.findOne({ where: { slug } });

    return company?.id === sessionTenantId;
  }

  private async tenantNames(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids)];

    if (unique.length === 0) {
      return new Map();
    }

    const rows = await this.tenants.find({ where: { id: In(unique) } });

    return new Map(rows.map((tenant) => [tenant.id, tenant.name]));
  }

  private async requireTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Not found.');
    }

    return tenant;
  }

  private async requireScopedTicket(
    user: User,
    sessionTenantId: string,
    ticketId: string,
  ): Promise<Ticket> {
    const ticket = await this.tickets.findOne({ where: { id: ticketId } });

    if (!ticket) {
      throw new NotFoundException('Not found.');
    }

    const companyDesk = await this.isCompanyDesk(user, sessionTenantId);

    if (
      !companyDesk &&
      ticket.tenantId !== this.scopedTenantId(user, sessionTenantId)
    ) {
      throw new ForbiddenException('Access denied.');
    }

    return ticket;
  }

  private async notifyCompany(event: string, ticket: Ticket): Promise<void> {
    const tenant = await this.requireTenant(ticket.tenantId);
    const recipient = tenant.email?.trim() ?? '';

    if (!recipient) {
      throw new Error('Ticket notification recipient is missing.');
    }

    await this.mail.sendTicketNotice(
      [recipient],
      event,
      ticket.id,
      this.ticketLink(ticket.id),
    );
  }

  private async notifyTenant(event: string, ticket: Ticket): Promise<void> {
    const users = await this.users.find({
      where: { status: 'active', tenantId: ticket.tenantId },
    });
    const recipients = [
      ...new Set(
        users
          .map((user) => user.email.trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    ];

    if (recipients.length === 0) {
      return;
    }

    await this.mail.sendTicketNotice(
      recipients,
      event,
      ticket.id,
      this.ticketLink(ticket.id),
    );
  }

  private dispatchNotice(work: Promise<void>): void {
    void work.catch(() => {
      this.logger.error('Ticket notification failed.');
    });
  }

  private ticketLink(ticketId: string): string {
    const cors = this.config.get<string>('CORS', 'http://localhost:3000');
    const origin = cors.split(',')[0]?.trim().replace(/\/$/, '') ?? '';
    return `${origin}/portal/chamados/${ticketId}`;
  }

  private async toDetail(
    ticket: Ticket,
    actor: User,
  ): Promise<TicketDetailDto> {
    const [comments, attachments, tenant, flags] = await Promise.all([
      this.comments.find({ where: { ticketId: ticket.id } }),
      this.attachments.find({ where: { ticketId: ticket.id } }),
      this.requireTenant(ticket.tenantId),
      this.newCommentFlags(actor.id, [ticket]),
    ]);
    const ordered = comments.toSorted((left, right) => {
      const byDate = right.createdAt.getTime() - left.createdAt.getTime();

      if (byDate !== 0) {
        return byDate;
      }

      return right.id.localeCompare(left.id);
    });
    const orderedAttachments = attachments.toSorted((left, right) => {
      const byDate = left.createdAt.getTime() - right.createdAt.getTime();

      if (byDate !== 0) {
        return byDate;
      }

      return left.id.localeCompare(right.id);
    });
    const people = await this.usersByIds([
      ticket.openedByUserId,
      ...ordered.map((comment) => comment.authorUserId),
      ...orderedAttachments.map((attachment) => attachment.createdByUserId),
    ]);

    return {
      ...this.toSummary(ticket, flags.get(ticket.id) ?? false, tenant.name),
      attachments: orderedAttachments.map((attachment) =>
        this.toAttachment(attachment, people),
      ),
      comments: ordered.map((comment) => this.toComment(comment, people)),
      description: ticket.description,
      openedBy: {
        displayName: this.displayName(people[ticket.openedByUserId]),
        id: ticket.openedByUserId,
      },
      openedById: ticket.openedByUserId,
      tenant: {
        displayName: tenant.name,
        id: tenant.id,
      },
    };
  }

  private toSummary(
    ticket: Ticket,
    hasNewComments: boolean,
    tenantName: string,
  ): TicketSummaryDto {
    return {
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString(),
      hasNewComments,
      id: ticket.id,
      priority: ticket.priority,
      status: ticket.status,
      tenantId: ticket.tenantId,
      tenantName,
      title: ticket.title,
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private toComment(
    comment: TicketComment,
    people: Record<string, User>,
  ): TicketCommentDto {
    return {
      author: {
        displayName: this.displayName(people[comment.authorUserId]),
        id: comment.authorUserId,
      },
      authorId: comment.authorUserId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      id: comment.id,
      ticketId: comment.ticketId,
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private async newCommentFlags(
    userId: string,
    tickets: Ticket[],
  ): Promise<Map<string, boolean>> {
    const ids = tickets.map((ticket) => ticket.id);
    const flags = new Map<string, boolean>();

    if (ids.length === 0) {
      return flags;
    }

    const [reads, comments] = await Promise.all([
      this.readStates.find({ where: { ticketId: In(ids), userId } }),
      this.comments.find({ where: { ticketId: In(ids) } }),
    ]);
    const seenAt = new Map(
      reads.map((read) => [read.ticketId, read.lastSeenAt.getTime()]),
    );

    for (const id of ids) {
      const marker = seenAt.get(id) ?? 0;
      flags.set(
        id,
        comments.some(
          (comment) =>
            comment.ticketId === id && comment.createdAt.getTime() > marker,
        ),
      );
    }

    return flags;
  }

  private async usersByIds(ids: string[]): Promise<Record<string, User>> {
    const unique = [...new Set(ids.filter(Boolean))];

    if (unique.length === 0) {
      return {};
    }

    const people = await this.users.find({ where: { id: In(unique) } });
    return Object.fromEntries(people.map((person) => [person.id, person]));
  }

  private toAttachment(
    attachment: TicketAttachment,
    people: Record<string, User>,
  ): TicketAttachmentDto {
    const creator = people[attachment.createdByUserId];

    return {
      byteSize: attachment.byteSize,
      contentType: attachment.contentType,
      createdByFirstName: creator?.firstName ?? '',
      createdByLastName: creator?.lastName ?? '',
      createdByUserId: attachment.createdByUserId,
      id: attachment.id,
      originalName: attachment.originalName,
      ticketId: attachment.ticketId,
      url: `/api/v1/tickets/${attachment.ticketId}/attachments/${attachment.id}`,
    };
  }

  private safeOriginalName(name: string | undefined): string {
    const base = (name ?? 'file').split(/[/\\]/).pop() ?? 'file';
    return base.replace(/[^\w.\- ()]/g, '_').slice(0, 255) || 'file';
  }

  private displayName(user: User | undefined): string {
    if (!user) {
      return '';
    }

    return `${user.firstName} ${user.lastName}`.trim();
  }
}
