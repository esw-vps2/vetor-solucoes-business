import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { readFile, unlink } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import {
  hasMappedAction,
  hasProjectsAccess,
  isWorkspaceManager,
} from '../portal/enabled-actions.js';
import { User } from '../portal/entities/user.entity.js';
import { toPublicPhotoUrl } from '../portal/photo-url.js';
import { TenantStorageService } from '../portal/tenant-storage.service.js';
import { ProjectFinanceService } from './project-finance.service.js';
import { FinanceDocumentsService } from './finance-documents.service.js';
import {
  attachmentPointerFor,
  backgroundPointerFor,
  matchesDeclaredAttachmentType,
  matchesDeclaredBackgroundType,
} from './attachment-file.js';
import { assertRelativePath, folderDepthFromParent } from './document-path.js';
import {
  CreateCardDto,
  CreateProjectFolderDto,
  UpdateCardDto,
  UpdateChecklistItemDto,
  UpdateProjectDocumentDto,
} from './dto/card.dto.js';
import {
  CardAttachmentDto,
  CardChecklistItemDto,
  CardCommentDto,
  CardDto,
  ProjectBackgroundDto,
  ProjectBoardDto,
  ProjectDocumentDto,
  ProjectSummaryDto,
  ProjectWorkspaceDto,
} from './dto/project-response.dto.js';
import { CardAttachment } from './entities/card-attachment.entity.js';
import { CardChecklistItem } from './entities/card-checklist-item.entity.js';
import { CardComment } from './entities/card-comment.entity.js';
import { Card } from './entities/card.entity.js';
import { ProjectDocument } from './entities/project-document.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import type { KanbanFiltersDto } from './dto/kanban-filters.dto.js';
import { readProjectKanbanFilters } from './kanban-filters.js';
import {
  applyKanbanLanes,
  laneConfigurationChanges,
  readProjectLanes,
} from './kanban-lanes.js';
import {
  DEFAULT_CARD_PRIORITY,
  isImageAttachmentMime,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_CARD,
  MAX_BACKGROUND_BYTES,
  MAX_CHECKLIST_ITEMS_PER_CARD,
  MAX_COMMENTS_PER_CARD,
  MAX_FOLDER_DEPTH,
  MAX_PROJECT_DOCUMENT_NODES,
  MAX_PROJECT_TREE_BYTES,
  type AttachmentMime,
  type BackgroundMime,
} from './project-constants.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectWorkspace)
    private readonly workspaces: Repository<ProjectWorkspace>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Card)
    private readonly cards: Repository<Card>,
    @InjectRepository(CardComment)
    private readonly comments: Repository<CardComment>,
    @InjectRepository(CardAttachment)
    private readonly attachments: Repository<CardAttachment>,
    @InjectRepository(CardChecklistItem)
    private readonly checklistItems: Repository<CardChecklistItem>,
    @InjectRepository(ProjectDocument)
    private readonly documents: Repository<ProjectDocument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tenantStorage: TenantStorageService,
    private readonly finance: ProjectFinanceService,
    private readonly financeDocuments: FinanceDocumentsService,
  ) {}

  async listWorkspaces(
    actor: AuthenticatedUser,
  ): Promise<ProjectWorkspaceDto[]> {
    const { scopedTenantId } = await this.requireCardAccess(actor);
    const rows = await this.workspaces.find({
      order: { name: 'ASC' },
      where: { tenantId: scopedTenantId },
    });

    return rows.map((row) => this.toWorkspaceDto(row));
  }

  async createWorkspace(
    actor: AuthenticatedUser,
    name: string,
  ): Promise<ProjectWorkspaceDto> {
    const { scopedTenantId } = await this.requireWorkspaceManager(actor);
    const saved = await this.workspaces.save(
      this.workspaces.create({
        metadata: null,
        name,
        tenantId: scopedTenantId,
      }),
    );

    return this.toWorkspaceDto(saved);
  }

  async updateWorkspace(
    actor: AuthenticatedUser,
    id: string,
    name: string,
  ): Promise<ProjectWorkspaceDto> {
    const workspace = await this.requireManagedWorkspace(actor, id);
    workspace.name = name;
    return this.toWorkspaceDto(await this.workspaces.save(workspace));
  }

  async deleteWorkspace(actor: AuthenticatedUser, id: string): Promise<void> {
    const workspace = await this.requireManagedWorkspace(actor, id);
    const workspaceProjects = await this.projects.find({
      where: { workspaceId: workspace.id },
    });
    await this.finance.unlinkContractFiles(
      workspaceProjects.map((project) => project.id),
    );
    await this.financeDocuments.unlinkFilesForProjects(
      workspaceProjects.map((project) => project.id),
    );
    await this.deleteDocumentFilesForWorkspaces([workspace.id]);
    await this.deleteBackgroundFilesForWorkspaces([workspace.id]);
    await this.deleteAttachmentFilesForWorkspaces([workspace.id]);
    await this.workspaces.delete({ id: workspace.id });
  }

  async listProjects(
    actor: AuthenticatedUser,
    workspaceId: string,
  ): Promise<ProjectSummaryDto[]> {
    const workspace = await this.requireVisibleWorkspace(actor, workspaceId);
    const rows = await this.projects.find({
      order: { name: 'ASC' },
      where: { workspaceId: workspace.id },
    });

    return rows.map((row) => this.toProjectSummary(row));
  }

  async createProject(
    actor: AuthenticatedUser,
    workspaceId: string,
    name: string,
  ): Promise<ProjectSummaryDto> {
    const workspace = await this.requireManagedWorkspace(actor, workspaceId);
    const saved = await this.projects.save(
      this.projects.create({
        metadata: null,
        name,
        nextCardNumber: 1,
        workspaceId: workspace.id,
      }),
    );

    return this.toProjectSummary(saved);
  }

  async getBoard(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<ProjectBoardDto> {
    const project = await this.requireVisibleProject(actor, projectId);
    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    const cards = await this.cards.find({
      order: { position: 'ASC' },
      relations: { attachments: true, checklistItems: true, comments: true },
      where: { projectId: project.id },
    });
    const people = await this.loadPeople(cards);
    const documents = await this.documents.find({
      order: { originalName: 'ASC' },
      where: { projectId: project.id },
    });
    const documentPeople = await this.loadDocumentPeople(documents);

    return {
      backgroundUrl: project.backgroundFilename
        ? `/api/v1/projects/${project.id}/background`
        : null,
      documents: this.toDocumentTree(documents, documentPeople),
      id: project.id,
      kanbanFilters: readProjectKanbanFilters(project.metadata),
      lanes: readProjectLanes(project.metadata).map((lane) => ({
        cards: cards
          .filter((card) => card.lane === lane.key)
          .map((card) => this.toCardDto(card, people)),
        color: lane.color,
        key: lane.key,
        label: lane.label,
      })),
      name: project.name,
      tenantId: workspace.tenantId,
      workspaceId: project.workspaceId,
    };
  }

  async updateProject(
    actor: AuthenticatedUser,
    projectId: string,
    dto: {
      kanbanFilters?: KanbanFiltersDto;
      kanbanLanes?: { key?: string; label: string }[];
      name?: string;
    },
  ): Promise<ProjectSummaryDto> {
    if (
      dto.name === undefined &&
      dto.kanbanFilters === undefined &&
      dto.kanbanLanes === undefined
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const actorUser = await this.requireActor(actor);
    const manager = isWorkspaceManager(actorUser.profile);
    const laneOnly = dto.name === undefined && dto.kanbanFilters === undefined;

    if (!manager && !laneOnly) {
      throw new ForbiddenException('Access denied.');
    }

    const project = manager
      ? await this.requireManagedProject(actor, projectId)
      : await this.requireVisibleProject(actor, projectId);

    if (dto.name !== undefined) {
      project.name = dto.name;
    }

    if (dto.kanbanFilters !== undefined) {
      const currentMetadata = project.metadata ?? {};
      project.metadata = {
        ...currentMetadata,
        kanbanFilters: {
          date: dto.kanbanFilters.date
            ? {
                endDate: dto.kanbanFilters.date.endDate,
                mode: dto.kanbanFilters.date.mode,
                startDate: dto.kanbanFilters.date.startDate,
              }
            : null,
          status: dto.kanbanFilters.status,
          taskCompletion: dto.kanbanFilters.taskCompletion,
        },
      };
    }

    if (dto.kanbanLanes !== undefined) {
      const projectCards = await this.cards.find({
        where: { projectId: project.id },
      });
      const cardCountByLane = new Map<string, number>();

      for (const card of projectCards) {
        cardCountByLane.set(
          card.lane,
          (cardCountByLane.get(card.lane) ?? 0) + 1,
        );
      }

      const nextLanes = applyKanbanLanes(
        readProjectLanes(project.metadata),
        dto.kanbanLanes,
        cardCountByLane,
      );

      if (!nextLanes) {
        throw new BadRequestException('Invalid input.');
      }

      const changes = laneConfigurationChanges(
        readProjectLanes(project.metadata),
        nextLanes,
      );

      if (
        (changes.created && !hasMappedAction(actorUser, 'createLane')) ||
        (changes.renamed && !hasMappedAction(actorUser, 'renameLane')) ||
        (changes.deleted && !hasMappedAction(actorUser, 'deleteLane')) ||
        (changes.reordered && !manager)
      ) {
        throw new ForbiddenException('Access denied.');
      }

      const currentMetadata = project.metadata ?? {};
      const filters = readProjectKanbanFilters(currentMetadata);
      project.metadata = {
        ...currentMetadata,
        kanbanLanes: nextLanes,
        ...(filters
          ? {
              kanbanFilters: {
                ...filters,
                status: filters.status.filter((key) =>
                  nextLanes.some((lane) => lane.key === key),
                ),
              },
            }
          : {}),
      };
    }

    return this.toProjectSummary(await this.projects.save(project));
  }

  async deleteProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<void> {
    const project = await this.requireManagedProject(actor, projectId);
    await this.removeProject(project);
  }

  async deleteProjectAnywhere(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<void> {
    if (actor.profile !== 'Administrador') {
      throw new ForbiddenException('Access denied.');
    }

    const project = await this.projects.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Not found.');
    }

    await this.removeProject(project);
  }

  async listScopedProjectNames(
    actor: AuthenticatedUser,
  ): Promise<Array<{ id: string; name: string }>> {
    const { scopedTenantId } = await this.requireCardAccess(actor);
    const workspaces = await this.workspaces.find({
      select: { id: true },
      where: { tenantId: scopedTenantId },
    });

    if (workspaces.length === 0) {
      return [];
    }

    const rows = await this.projects.find({
      select: { id: true, name: true },
      where: { workspaceId: In(workspaces.map((workspace) => workspace.id)) },
    });

    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  async listCardAssigneeChoices(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<Array<{ firstName: string; id: string; lastName: string }>> {
    const { project } = await this.requireCardProject(actor, projectId);
    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    const users = await this.users.find({
      where: { status: 'active', tenantId: workspace.tenantId },
    });

    return users
      .filter((user) => hasProjectsAccess(user))
      .map((user) => ({
        firstName: user.firstName,
        id: user.id,
        lastName: user.lastName,
      }));
  }

  async createCard(
    actor: AuthenticatedUser,
    projectId: string,
    dto: CreateCardDto,
  ): Promise<CardDto> {
    const { actorUser, project } = await this.requireCardProject(
      actor,
      projectId,
    );
    const assigneeUserId = dto.assigneeUserId ?? null;

    if (assigneeUserId) {
      await this.assertAssignee(assigneeUserId, project);
    }
    const startsAt = this.parseDueAt(dto.startsAt);
    const dueAt = this.parseDueAt(dto.dueAt);
    this.assertCardDateRange(startsAt, dueAt);

    const saved = await this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Project, {
        lock: { mode: 'pessimistic_write' },
        where: { id: project.id },
      });

      if (!locked) {
        throw new NotFoundException('Not found.');
      }

      const laneKey = readProjectLanes(locked.metadata)[0].key;
      const siblings = await manager.find(Card, {
        where: { lane: laneKey, projectId: locked.id },
      });
      const position =
        siblings.reduce((max, card) => Math.max(max, card.position), -1) + 1;
      const number = locked.nextCardNumber;
      locked.nextCardNumber = number + 1;
      await manager.save(locked);

      const card = manager.create(Card, {
        assigneeUserId,
        createdByUserId: actorUser.id,
        description: dto.description,
        dueAt,
        startsAt,
        lane: laneKey,
        metadata: null,
        number,
        position,
        priority: dto.priority ?? DEFAULT_CARD_PRIORITY,
        projectId: locked.id,
        tags: dto.tags ?? [],
        title: dto.title,
      });

      return manager.save(card);
    });

    return this.toCardDto(
      await this.loadCardGraph(saved.id),
      await this.loadPeople([saved]),
    );
  }

  async updateCard(
    actor: AuthenticatedUser,
    cardId: string,
    dto: UpdateCardDto,
  ): Promise<CardDto> {
    const { card, project } = await this.requireVisibleCard(actor, cardId);

    if (
      dto.title === undefined &&
      dto.description === undefined &&
      dto.assigneeUserId === undefined &&
      dto.startsAt === undefined &&
      dto.dueAt === undefined &&
      dto.priority === undefined &&
      dto.tags === undefined &&
      dto.coverAttachmentId === undefined
    ) {
      throw new BadRequestException('Invalid input.');
    }

    if (dto.assigneeUserId) {
      await this.assertAssignee(dto.assigneeUserId, project);
      card.assigneeUserId = dto.assigneeUserId;
    }

    if (dto.title !== undefined) {
      card.title = dto.title;
    }

    if (dto.description !== undefined) {
      card.description = dto.description;
    }

    if (dto.startsAt !== undefined) {
      card.startsAt = this.parseDueAt(dto.startsAt);
    }

    if (dto.dueAt !== undefined) {
      card.dueAt = this.parseDueAt(dto.dueAt);
    }

    this.assertCardDateRange(card.startsAt, card.dueAt);

    if (dto.priority !== undefined) {
      card.priority = dto.priority;
    }

    if (dto.tags !== undefined) {
      card.tags = dto.tags;
    }

    if (dto.coverAttachmentId !== undefined) {
      card.coverAttachmentId = await this.resolveCover(
        card,
        dto.coverAttachmentId,
      );
    }

    await this.cards.save(card);
    const loaded = await this.loadCardGraph(card.id);
    return this.toCardDto(loaded, await this.loadPeople([loaded]));
  }

  async deleteCard(actor: AuthenticatedUser, cardId: string): Promise<void> {
    const { card } = await this.requireVisibleCard(actor, cardId);
    await this.deleteAttachmentFilesForCards([card.id]);
    await this.cards.delete({ id: card.id });
  }

  async moveCard(
    actor: AuthenticatedUser,
    cardId: string,
    lane: string,
  ): Promise<CardDto> {
    await this.requireMoveAccess(actor);
    const { card, project } = await this.requireVisibleCard(actor, cardId);
    this.assertProjectLane(project.metadata, lane);

    if (card.lane === lane) {
      throw new BadRequestException('Invalid input.');
    }

    const siblings = await this.cards.find({
      where: { lane, projectId: card.projectId },
    });
    card.lane = lane;
    card.position =
      siblings.reduce((max, item) => Math.max(max, item.position), -1) + 1;
    await this.cards.save(card);
    const loaded = await this.loadCardGraph(card.id);
    return this.toCardDto(loaded, await this.loadPeople([loaded]));
  }

  async reorderCard(
    actor: AuthenticatedUser,
    cardId: string,
    direction: 'up' | 'down',
  ): Promise<CardDto> {
    await this.requireMoveAccess(actor);
    const { card } = await this.requireVisibleCard(actor, cardId);
    const siblings = (
      await this.cards.find({
        order: { position: 'ASC' },
        where: { lane: card.lane, projectId: card.projectId },
      })
    ).toSorted((left, right) => left.position - right.position);
    const index = siblings.findIndex((item) => item.id === card.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || swapWith < 0 || swapWith >= siblings.length) {
      throw new BadRequestException('Invalid input.');
    }

    const neighbor = siblings[swapWith];
    const currentPosition = card.position;
    card.position = neighbor.position;
    neighbor.position = currentPosition;
    await this.cards.save([card, neighbor]);
    const loaded = await this.loadCardGraph(card.id);
    return this.toCardDto(loaded, await this.loadPeople([loaded]));
  }

  async placeCard(
    actor: AuthenticatedUser,
    cardId: string,
    lane: string,
    position: number,
  ): Promise<CardDto> {
    await this.requireMoveAccess(actor);
    const { card, project } = await this.requireVisibleCard(actor, cardId);
    this.assertProjectLane(project.metadata, lane);
    const siblings = (
      await this.cards.find({
        order: { position: 'ASC' },
        where: { lane, projectId: card.projectId },
      })
    )
      .filter((item) => item.id !== card.id)
      .toSorted((left, right) => left.position - right.position);
    const index = Math.max(0, Math.min(position, siblings.length));
    card.lane = lane;
    const next = [...siblings.slice(0, index), card, ...siblings.slice(index)];

    for (const [order, item] of next.entries()) {
      item.position = order;
    }

    await this.cards.save(next);
    const loaded = await this.loadCardGraph(card.id);
    return this.toCardDto(loaded, await this.loadPeople([loaded]));
  }

  async createComment(
    actor: AuthenticatedUser,
    cardId: string,
    body: string,
  ): Promise<CardCommentDto> {
    const { actorUser, card } = await this.requireVisibleCard(actor, cardId);
    const count = await this.comments.count({ where: { cardId: card.id } });

    if (count >= MAX_COMMENTS_PER_CARD) {
      throw new BadRequestException('Invalid input.');
    }

    const saved = await this.comments.save(
      this.comments.create({
        authorUserId: actorUser.id,
        body,
        cardId: card.id,
        metadata: null,
      }),
    );

    return this.toCommentDto(saved, {
      [actorUser.id]: actorUser,
    });
  }

  async updateComment(
    actor: AuthenticatedUser,
    cardId: string,
    commentId: string,
    body: string,
  ): Promise<CardCommentDto> {
    const { card } = await this.requireVisibleCard(actor, cardId);
    const comment = await this.comments.findOne({
      where: { cardId: card.id, id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Not found.');
    }

    comment.body = body;
    const saved = await this.comments.save(comment);
    const author = await this.users.findOne({
      where: { id: saved.authorUserId },
    });

    return this.toCommentDto(saved, author ? { [author.id]: author } : {});
  }

  async deleteComment(
    actor: AuthenticatedUser,
    cardId: string,
    commentId: string,
  ): Promise<void> {
    const { card } = await this.requireVisibleCard(actor, cardId);
    const comment = await this.comments.findOne({
      where: { cardId: card.id, id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Not found.');
    }

    await this.comments.delete({ id: comment.id });
  }

  async addAttachment(
    actor: AuthenticatedUser,
    cardId: string,
    file: Express.Multer.File | undefined,
  ): Promise<CardAttachmentDto> {
    const { actorUser, card, project } = await this.requireVisibleCard(
      actor,
      cardId,
    );

    if (!file?.buffer) {
      throw new BadRequestException('Invalid input.');
    }

    if (
      file.size > MAX_ATTACHMENT_BYTES ||
      !matchesDeclaredAttachmentType(file.mimetype, file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const count = await this.attachments.count({ where: { cardId: card.id } });

    if (count >= MAX_ATTACHMENTS_PER_CARD) {
      throw new BadRequestException('Invalid input.');
    }

    const mime = file.mimetype as AttachmentMime;
    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    const saved = await this.attachments.save(
      this.attachments.create({
        byteSize: file.size,
        cardId: card.id,
        contentType: mime,
        createdByUserId: actorUser.id,
        filename: '',
        originalName: this.safeOriginalName(file.originalname),
      }),
    );
    const pointer = attachmentPointerFor(saved.id, mime);
    await this.tenantStorage.writeTenantFile(
      workspace.tenantId,
      pointer,
      file.buffer,
    );
    saved.filename = pointer;
    await this.attachments.save(saved);
    return this.toAttachmentDto(saved, { [actorUser.id]: actorUser });
  }

  async readAttachment(
    actor: AuthenticatedUser,
    cardId: string,
    attachmentId: string,
  ): Promise<{
    bytes: Buffer;
    contentType: string;
    originalName: string;
  }> {
    const { card, project } = await this.requireVisibleCard(actor, cardId);
    const attachment = await this.attachments.findOne({
      where: { cardId: card.id, id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Not found.');
    }

    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    try {
      return {
        bytes: await this.tenantStorage.readTenantFile(
          workspace.tenantId,
          attachment.filename,
        ),
        contentType: attachment.contentType,
        originalName: attachment.originalName,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  async deleteAttachment(
    actor: AuthenticatedUser,
    cardId: string,
    attachmentId: string,
  ): Promise<void> {
    const { card, project } = await this.requireVisibleCard(actor, cardId);
    const attachment = await this.attachments.findOne({
      where: { cardId: card.id, id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Not found.');
    }

    const workspace = await this.requireWorkspaceByProject(project);

    if (attachment.filename) {
      await this.tenantStorage.deleteTenantFile(
        workspace.tenantId,
        attachment.filename,
      );
    }

    if (card.coverAttachmentId === attachment.id) {
      card.coverAttachmentId = null;
      await this.cards.save(card);
    }

    await this.attachments.delete({ id: attachment.id });
  }

  async createChecklistItem(
    actor: AuthenticatedUser,
    cardId: string,
    body: string,
  ): Promise<CardChecklistItemDto> {
    const { actorUser, card } = await this.requireVisibleCard(actor, cardId);
    const items = await this.checklistItems.find({
      order: { position: 'ASC' },
      where: { cardId: card.id },
    });

    if (items.length >= MAX_CHECKLIST_ITEMS_PER_CARD) {
      throw new BadRequestException('Invalid input.');
    }

    const saved = await this.checklistItems.save(
      this.checklistItems.create({
        body,
        cardId: card.id,
        createdByUserId: actorUser.id,
        done: false,
        position:
          items.reduce((max, item) => Math.max(max, item.position), -1) + 1,
      }),
    );

    return this.toChecklistItemDto(saved);
  }

  async updateChecklistItem(
    actor: AuthenticatedUser,
    cardId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<CardChecklistItemDto> {
    const { card } = await this.requireVisibleCard(actor, cardId);
    const item = await this.checklistItems.findOne({
      where: { cardId: card.id, id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Not found.');
    }

    if (dto.body === undefined && dto.done === undefined) {
      throw new BadRequestException('Invalid input.');
    }

    if (dto.body !== undefined) {
      item.body = dto.body;
    }

    if (dto.done !== undefined) {
      item.done = dto.done;
    }

    return this.toChecklistItemDto(await this.checklistItems.save(item));
  }

  async deleteChecklistItem(
    actor: AuthenticatedUser,
    cardId: string,
    itemId: string,
  ): Promise<void> {
    const { card } = await this.requireVisibleCard(actor, cardId);
    const item = await this.checklistItems.findOne({
      where: { cardId: card.id, id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Not found.');
    }

    await this.checklistItems.delete({ id: item.id });
  }

  async putBackground(
    actor: AuthenticatedUser,
    projectId: string,
    file: Express.Multer.File | undefined,
  ): Promise<ProjectBackgroundDto> {
    const { project } = await this.requireTenantAdminProject(actor, projectId);

    if (!file?.buffer) {
      throw new BadRequestException('Invalid input.');
    }

    if (
      file.size > MAX_BACKGROUND_BYTES ||
      !matchesDeclaredBackgroundType(file.mimetype, file.buffer)
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const mime = file.mimetype as BackgroundMime;
    const workspace = await this.requireWorkspaceByProject(project);
    const pointer = backgroundPointerFor(project.id, mime);

    if (project.backgroundFilename && project.backgroundFilename !== pointer) {
      await this.tenantStorage.deleteTenantFile(
        workspace.tenantId,
        project.backgroundFilename,
      );
    }

    await this.tenantStorage.writeTenantFile(
      workspace.tenantId,
      pointer,
      file.buffer,
    );
    project.backgroundFilename = pointer;
    await this.projects.save(project);

    return { backgroundUrl: `/api/v1/projects/${project.id}/background` };
  }

  async deleteBackground(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<void> {
    const { project } = await this.requireTenantAdminProject(actor, projectId);
    await this.deleteBackgroundFile(project);
    project.backgroundFilename = null;
    await this.projects.save(project);
  }

  async readBackground(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ bytes: Buffer; contentType: string }> {
    const project = await this.requireVisibleProject(actor, projectId);

    if (!project.backgroundFilename) {
      throw new NotFoundException('Not found.');
    }

    const workspace = await this.requireWorkspaceByProject(project);

    try {
      const bytes = await this.tenantStorage.readTenantFile(
        workspace.tenantId,
        project.backgroundFilename,
      );
      const extension = project.backgroundFilename
        .split('.')
        .pop()
        ?.toLowerCase();
      const contentType =
        extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      return { bytes, contentType };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  async createFolder(
    actor: AuthenticatedUser,
    projectId: string,
    dto: CreateProjectFolderDto,
  ): Promise<ProjectDocumentDto> {
    const { actorUser, project } = await this.requireCardProject(
      actor,
      projectId,
    );
    await this.assertDocumentCapacity(project.id, 1, 0);
    const parent = await this.requireParentFolder(
      project.id,
      dto.parentId ?? null,
    );
    await this.assertFolderDepth(parent, 1);
    const saved = await this.saveDocumentNode({
      byteSize: 0,
      contentType: null,
      createdByUserId: actorUser.id,
      filename: null,
      kind: 'folder',
      originalName: dto.name,
      parentId: parent?.id ?? null,
      projectId: project.id,
    });
    return this.toDocumentDto(saved, { [actorUser.id]: actorUser });
  }

  async uploadDocuments(
    actor: AuthenticatedUser,
    projectId: string,
    files: Express.Multer.File[] | undefined,
    parentId: string | null | undefined,
    relativePaths: string[] | undefined,
  ): Promise<ProjectDocumentDto[]> {
    const { actorUser, project } = await this.requireCardProject(
      actor,
      projectId,
    );
    const uploads = files ?? [];

    if (uploads.length === 0) {
      throw new BadRequestException('Invalid input.');
    }

    const paths = relativePaths ?? uploads.map((file) => file.originalname);
    const parent = await this.requireParentFolder(project.id, parentId ?? null);
    const created: ProjectDocument[] = [];

    try {
      for (const [index, file] of uploads.entries()) {
        const relative = paths[index] ?? file.originalname;
        const segments = assertRelativePath(relative);
        const folders = segments.slice(0, -1);
        const fileName = segments[segments.length - 1];
        await this.assertFolderDepth(parent, folders.length);
        const bytes =
          file.buffer ?? (file.path ? await readFile(file.path) : null);

        if (!bytes) {
          throw new BadRequestException('Invalid input.');
        }

        if (
          file.size > MAX_ATTACHMENT_BYTES ||
          !matchesDeclaredAttachmentType(file.mimetype, bytes)
        ) {
          throw new BadRequestException('Invalid input.');
        }

        let currentParent = parent;

        for (const folderName of folders) {
          currentParent = await this.ensureFolder(
            project.id,
            currentParent,
            folderName,
            actorUser.id,
            created,
          );
        }

        const mime = file.mimetype as AttachmentMime;
        await this.assertDocumentCapacity(project.id, 1, file.size);
        const node = await this.saveDocumentNode({
          byteSize: file.size,
          contentType: mime,
          createdByUserId: actorUser.id,
          filename: '',
          kind: 'file',
          originalName: this.safeOriginalName(fileName).slice(0, 120),
          parentId: currentParent?.id ?? null,
          projectId: project.id,
        });
        const pointer = attachmentPointerFor(node.id, mime);
        const workspace = await this.requireWorkspaceByProject(project);
        await this.tenantStorage.writeTenantFile(
          workspace.tenantId,
          pointer,
          bytes,
        );
        node.filename = pointer;
        created.push(await this.documents.save(node));
      }
    } finally {
      await Promise.all(
        uploads.map(async (file) => {
          if (file.path) {
            await unlink(file.path).catch(() => undefined);
          }
        }),
      );
    }

    const people = { [actorUser.id]: actorUser };
    return created
      .filter((node) => node.kind === 'file')
      .map((node) => this.toDocumentDto(node, people));
  }

  async readDocument(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
  ): Promise<{ bytes: Buffer; contentType: string; originalName: string }> {
    const { project, document } = await this.requireVisibleDocument(
      actor,
      projectId,
      documentId,
    );

    if (
      document.kind !== 'file' ||
      !document.filename ||
      !document.contentType
    ) {
      throw new BadRequestException('Invalid input.');
    }

    const workspace = await this.requireWorkspaceByProject(project);

    try {
      return {
        bytes: await this.tenantStorage.readTenantFile(
          workspace.tenantId,
          document.filename,
        ),
        contentType: document.contentType,
        originalName: document.originalName,
      };
    } catch {
      throw new NotFoundException('Not found.');
    }
  }

  async archiveDocument(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
  ): Promise<{ filename: string; stream: Readable }> {
    const { project, document } = await this.requireVisibleDocument(
      actor,
      projectId,
      documentId,
    );

    if (document.kind !== 'folder') {
      throw new BadRequestException('Invalid input.');
    }

    const workspace = await this.requireWorkspaceByProject(project);
    const all = await this.documents.find({ where: { projectId: project.id } });
    const descendants = this.collectDescendants(all, document.id);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    queueMicrotask(() => {
      void (async () => {
        try {
          for (const node of descendants) {
            if (node.kind !== 'file' || !node.filename) {
              continue;
            }

            const relative = this.documentZipPath(all, node, document.id);
            const bytes = await this.tenantStorage.readTenantFile(
              workspace.tenantId,
              node.filename,
            );
            archive.append(bytes, { name: relative });
          }

          await archive.finalize();
        } catch (error) {
          archive.destroy(error as Error);
        }
      })();
    });

    return {
      filename: `${document.originalName}.zip`,
      stream: archive,
    };
  }

  async updateDocument(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
    dto: UpdateProjectDocumentDto,
  ): Promise<ProjectDocumentDto> {
    const { actorUser, project, document } = await this.requireVisibleDocument(
      actor,
      projectId,
      documentId,
    );

    if (dto.name === undefined && dto.parentId === undefined) {
      throw new BadRequestException('Invalid input.');
    }

    if (dto.name !== undefined) {
      document.originalName = dto.name;
    }

    if (dto.parentId !== undefined) {
      const parent = await this.requireParentFolder(project.id, dto.parentId);
      await this.assertNoCycle(document.id, parent?.id ?? null, project.id);
      const extra = document.kind === 'folder' ? 1 : 0;
      await this.assertFolderDepth(parent, extra);
      document.parentId = parent?.id ?? null;
    }

    const saved = await this.documents.save(document);
    return this.toDocumentDto(saved, { [actorUser.id]: actorUser });
  }

  async deleteDocument(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
  ): Promise<void> {
    const { project, document } = await this.requireVisibleDocument(
      actor,
      projectId,
      documentId,
    );
    const all = await this.documents.find({ where: { projectId: project.id } });
    const toDelete = [document, ...this.collectDescendants(all, document.id)];
    const workspace = await this.requireWorkspaceByProject(project);

    for (const node of toDelete) {
      if (node.filename) {
        await this.tenantStorage.deleteTenantFile(
          workspace.tenantId,
          node.filename,
        );
      }
    }

    await this.documents.delete({ id: document.id });
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

  private async requireCardAccess(actor: AuthenticatedUser): Promise<{
    actorUser: User;
    scopedTenantId: string;
  }> {
    const actorUser = await this.requireActor(actor);

    if (!hasMappedAction(actorUser, 'viewProjects')) {
      throw new ForbiddenException('Access denied.');
    }

    return {
      actorUser,
      scopedTenantId: this.scopedTenantId(actorUser, actor.tenantId),
    };
  }

  private async requireWorkspaceManager(actor: AuthenticatedUser): Promise<{
    actorUser: User;
    scopedTenantId: string;
  }> {
    const actorUser = await this.requireActor(actor);

    if (!isWorkspaceManager(actorUser.profile)) {
      throw new ForbiddenException('Access denied.');
    }

    return {
      actorUser,
      scopedTenantId: this.scopedTenantId(actorUser, actor.tenantId),
    };
  }

  private async requireMoveAccess(actor: AuthenticatedUser): Promise<User> {
    const actorUser = await this.requireActor(actor);

    if (!hasMappedAction(actorUser, 'moveCards')) {
      throw new ForbiddenException('Access denied.');
    }

    return actorUser;
  }

  private assertScope(resourceTenantId: string, scopedTenantId: string): void {
    if (resourceTenantId !== scopedTenantId) {
      throw new ForbiddenException('Access denied.');
    }
  }

  private async requireVisibleWorkspace(
    actor: AuthenticatedUser,
    workspaceId: string,
  ): Promise<ProjectWorkspace> {
    const { scopedTenantId } = await this.requireCardAccess(actor);
    const workspace = await this.workspaces.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    this.assertScope(workspace.tenantId, scopedTenantId);
    return workspace;
  }

  private async requireManagedWorkspace(
    actor: AuthenticatedUser,
    workspaceId: string,
  ): Promise<ProjectWorkspace> {
    const { scopedTenantId } = await this.requireWorkspaceManager(actor);
    const workspace = await this.workspaces.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    this.assertScope(workspace.tenantId, scopedTenantId);
    return workspace;
  }

  private async requireVisibleProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<Project> {
    const { scopedTenantId } = await this.requireCardAccess(actor);
    return this.loadScopedProject(projectId, scopedTenantId);
  }

  private async requireManagedProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<Project> {
    const { scopedTenantId } = await this.requireWorkspaceManager(actor);
    return this.loadScopedProject(projectId, scopedTenantId);
  }

  private async requireCardProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ actorUser: User; project: Project }> {
    const { actorUser, scopedTenantId } = await this.requireCardAccess(actor);
    return {
      actorUser,
      project: await this.loadScopedProject(projectId, scopedTenantId),
    };
  }

  private async requireVisibleCard(
    actor: AuthenticatedUser,
    cardId: string,
  ): Promise<{ actorUser: User; card: Card; project: Project }> {
    const { actorUser, scopedTenantId } = await this.requireCardAccess(actor);
    const card = await this.cards.findOne({ where: { id: cardId } });

    if (!card) {
      throw new NotFoundException('Not found.');
    }

    const project = await this.loadScopedProject(
      card.projectId,
      scopedTenantId,
    );
    return { actorUser, card, project };
  }

  private async loadScopedProject(
    projectId: string,
    scopedTenantId: string,
  ): Promise<Project> {
    const project = await this.projects.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Not found.');
    }

    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    this.assertScope(workspace.tenantId, scopedTenantId);
    return project;
  }

  private async assertAssignee(
    assigneeUserId: string,
    project: Project,
  ): Promise<void> {
    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });
    const assignee = await this.users.findOne({
      where: { id: assigneeUserId, status: 'active' },
    });

    if (!workspace || !assignee) {
      throw new BadRequestException('Invalid input.');
    }

    if (assignee.tenantId !== workspace.tenantId) {
      throw new BadRequestException('Invalid input.');
    }

    if (!hasProjectsAccess(assignee)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private assertProjectLane(
    metadata: Record<string, unknown> | null,
    lane: string,
  ): void {
    if (!readProjectLanes(metadata).some((item) => item.key === lane)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private assertCardDateRange(startsAt: Date | null, dueAt: Date | null): void {
    if (startsAt && dueAt && startsAt.getTime() > dueAt.getTime()) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private parseDueAt(value: string | null | undefined): Date | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid input.');
    }

    return parsed;
  }

  private async loadCardGraph(cardId: string): Promise<Card> {
    const card = await this.cards.findOne({
      relations: { attachments: true, checklistItems: true, comments: true },
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Not found.');
    }

    return card;
  }

  private async loadPeople(cards: Card[]): Promise<Record<string, User>> {
    const ids = new Set<string>();

    for (const card of cards) {
      ids.add(card.createdByUserId);

      if (card.assigneeUserId) {
        ids.add(card.assigneeUserId);
      }

      for (const comment of card.comments ?? []) {
        ids.add(comment.authorUserId);
      }

      for (const attachment of card.attachments ?? []) {
        ids.add(attachment.createdByUserId);
      }
    }

    return this.usersByIds([...ids]);
  }

  private async loadDocumentPeople(
    documents: ProjectDocument[],
  ): Promise<Record<string, User>> {
    return this.usersByIds(documents.map((row) => row.createdByUserId));
  }

  private async usersByIds(ids: string[]): Promise<Record<string, User>> {
    const unique = [...new Set(ids.filter(Boolean))];

    if (unique.length === 0) {
      return {};
    }

    const people = await this.users.find({
      where: { id: In(unique) },
    });

    return Object.fromEntries(people.map((person) => [person.id, person]));
  }

  private async deleteAttachmentFilesForWorkspaces(
    workspaceIds: string[],
  ): Promise<void> {
    if (workspaceIds.length === 0) {
      return;
    }

    const projects = await this.projects.find({
      where: { workspaceId: In(workspaceIds) },
    });
    await this.deleteAttachmentFilesForProjects(projects.map((row) => row.id));
  }

  private async removeProject(project: Project): Promise<void> {
    await this.finance.unlinkContractFiles([project.id]);
    await this.financeDocuments.unlinkFilesForProjects([project.id]);
    await this.deleteDocumentFilesForProjects([project.id]);
    await this.deleteBackgroundFile(project);
    await this.deleteAttachmentFilesForProjects([project.id]);
    await this.projects.delete({ id: project.id });
  }

  private async deleteAttachmentFilesForProjects(
    projectIds: string[],
  ): Promise<void> {
    if (projectIds.length === 0) {
      return;
    }

    const cards = await this.cards.find({
      where: { projectId: In(projectIds) },
    });
    await this.deleteAttachmentFilesForCards(cards.map((row) => row.id));
  }

  private async deleteAttachmentFilesForCards(
    cardIds: string[],
  ): Promise<void> {
    if (cardIds.length === 0) {
      return;
    }

    const files = await this.attachments.find({
      where: { cardId: In(cardIds) },
    });

    if (files.length === 0) {
      return;
    }

    const cards = await this.cards.find({
      where: { id: In(cardIds) },
    });
    const projects = await this.projects.find({
      where: { id: In(cards.map((card) => card.projectId)) },
    });
    const workspaces = await this.workspaces.find({
      where: { id: In(projects.map((project) => project.workspaceId)) },
    });
    const workspaceById = new Map(
      workspaces.map((workspace) => [workspace.id, workspace]),
    );
    const projectById = new Map(
      projects.map((project) => [project.id, project]),
    );
    const cardById = new Map(cards.map((card) => [card.id, card]));

    for (const file of files) {
      const card = cardById.get(file.cardId);
      const project = card ? projectById.get(card.projectId) : undefined;
      const workspace = project
        ? workspaceById.get(project.workspaceId)
        : undefined;

      if (!workspace || !file.filename) {
        continue;
      }

      await this.tenantStorage.deleteTenantFile(
        workspace.tenantId,
        file.filename,
      );
    }
  }

  private toWorkspaceDto(row: ProjectWorkspace): ProjectWorkspaceDto {
    return {
      id: row.id,
      name: row.name,
      tenantId: row.tenantId,
    };
  }

  private toProjectSummary(row: Project): ProjectSummaryDto {
    return {
      id: row.id,
      name: row.name,
      workspaceId: row.workspaceId,
    };
  }

  private toCardDto(card: Card, people: Record<string, User>): CardDto {
    const creator = people[card.createdByUserId];
    const assignee = card.assigneeUserId
      ? people[card.assigneeUserId]
      : undefined;
    const comments = [...(card.comments ?? [])].toSorted(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
    const checklistItems = [...(card.checklistItems ?? [])].toSorted(
      (left, right) => left.position - right.position,
    );
    const photoUrl = assignee
      ? toPublicPhotoUrl(assignee.id, assignee.photoUrl)
      : '';

    return {
      assigneeFirstName: assignee?.firstName ?? '',
      assigneeLastName: assignee?.lastName ?? '',
      assigneePhotoUrl: photoUrl || null,
      assigneeUserId: card.assigneeUserId,
      attachments: (card.attachments ?? []).map((item) =>
        this.toAttachmentDto(item, people),
      ),
      checklistItems: checklistItems.map((item) =>
        this.toChecklistItemDto(item),
      ),
      comments: comments.map((comment) => this.toCommentDto(comment, people)),
      coverAttachmentId: card.coverAttachmentId,
      createdAt: card.createdAt.toISOString(),
      createdByFirstName: creator?.firstName ?? '',
      createdByLastName: creator?.lastName ?? '',
      createdByUserId: card.createdByUserId,
      description: card.description,
      dueAt: card.dueAt ? card.dueAt.toISOString() : null,
      startsAt: card.startsAt ? card.startsAt.toISOString() : null,
      id: card.id,
      lane: card.lane,
      number: card.number,
      position: card.position,
      priority: card.priority,
      projectId: card.projectId,
      tags: card.tags ?? [],
      title: card.title,
    };
  }

  private toCommentDto(
    comment: CardComment,
    people: Record<string, User>,
  ): CardCommentDto {
    const author = people[comment.authorUserId];

    return {
      authorFirstName: author?.firstName ?? '',
      authorLastName: author?.lastName ?? '',
      authorUserId: comment.authorUserId,
      body: comment.body,
      cardId: comment.cardId,
      createdAt: comment.createdAt.toISOString(),
      id: comment.id,
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private toAttachmentDto(
    attachment: CardAttachment,
    people: Record<string, User> = {},
  ): CardAttachmentDto {
    const creator = people[attachment.createdByUserId];

    return {
      byteSize: attachment.byteSize,
      cardId: attachment.cardId,
      contentType: attachment.contentType,
      createdByFirstName: creator?.firstName ?? '',
      createdByLastName: creator?.lastName ?? '',
      createdByUserId: attachment.createdByUserId,
      id: attachment.id,
      originalName: attachment.originalName,
      url: `/api/v1/cards/${attachment.cardId}/attachments/${attachment.id}`,
    };
  }

  private toChecklistItemDto(item: CardChecklistItem): CardChecklistItemDto {
    return {
      body: item.body,
      cardId: item.cardId,
      createdByUserId: item.createdByUserId,
      done: item.done,
      id: item.id,
      position: item.position,
    };
  }

  private toDocumentDto(
    document: ProjectDocument,
    people: Record<string, User>,
    children: ProjectDocumentDto[] = [],
  ): ProjectDocumentDto {
    const creator = people[document.createdByUserId];

    return {
      byteSize: document.byteSize,
      children,
      contentType: document.contentType,
      createdByFirstName: creator?.firstName ?? '',
      createdByLastName: creator?.lastName ?? '',
      createdByUserId: document.createdByUserId,
      id: document.id,
      kind: document.kind,
      originalName: document.originalName,
      parentId: document.parentId,
      projectId: document.projectId,
      url:
        document.kind === 'file'
          ? `/api/v1/projects/${document.projectId}/documents/${document.id}`
          : null,
    };
  }

  private toDocumentTree(
    documents: ProjectDocument[],
    people: Record<string, User>,
  ): ProjectDocumentDto[] {
    const byParent = new Map<string | null, ProjectDocument[]>();

    for (const document of documents) {
      const key = document.parentId;
      const list = byParent.get(key) ?? [];
      list.push(document);
      byParent.set(key, list);
    }

    const build = (parentId: string | null): ProjectDocumentDto[] =>
      (byParent.get(parentId) ?? [])
        .toSorted((left, right) =>
          left.originalName.localeCompare(right.originalName),
        )
        .map((node) => this.toDocumentDto(node, people, build(node.id)));

    return build(null);
  }

  private async requireWorkspaceByProject(
    project: Project,
  ): Promise<ProjectWorkspace> {
    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Not found.');
    }

    return workspace;
  }

  private async requireTenantAdminProject(
    actor: AuthenticatedUser,
    projectId: string,
  ): Promise<{ actorUser: User; project: Project }> {
    const actorUser = await this.requireActor(actor);

    if (actorUser.profile !== 'AdministradorTenant') {
      throw new ForbiddenException('Access denied.');
    }

    const project = await this.loadScopedProject(
      projectId,
      this.scopedTenantId(actorUser, actor.tenantId),
    );
    return { actorUser, project };
  }

  private async requireVisibleDocument(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
  ): Promise<{
    actorUser: User;
    document: ProjectDocument;
    project: Project;
  }> {
    const { actorUser, project } = await this.requireCardProject(
      actor,
      projectId,
    );
    const document = await this.documents.findOne({
      where: { id: documentId, projectId: project.id },
    });

    if (!document) {
      throw new NotFoundException('Not found.');
    }

    return { actorUser, document, project };
  }

  private async requireParentFolder(
    projectId: string,
    parentId: string | null,
  ): Promise<ProjectDocument | null> {
    if (!parentId) {
      return null;
    }

    const parent = await this.documents.findOne({
      where: { id: parentId, projectId },
    });

    if (!parent || parent.kind !== 'folder') {
      throw new BadRequestException('Invalid input.');
    }

    return parent;
  }

  private async assertFolderDepth(
    parent: ProjectDocument | null,
    extraFolders: number,
  ): Promise<void> {
    const parentDepth = parent ? await this.documentDepth(parent) : 0;
    folderDepthFromParent(parentDepth, extraFolders);
  }

  private async documentDepth(node: ProjectDocument): Promise<number> {
    let current: ProjectDocument | null = node;
    let depth = 0;

    while (current?.parentId) {
      depth += 1;

      if (depth > MAX_FOLDER_DEPTH) {
        throw new BadRequestException('Invalid input.');
      }

      current = await this.documents.findOne({
        where: { id: current.parentId },
      });
    }

    return depth + (node.kind === 'folder' ? 1 : 0);
  }

  private async assertDocumentCapacity(
    projectId: string,
    extraNodes: number,
    extraBytes: number,
  ): Promise<void> {
    const rows = await this.documents.find({ where: { projectId } });
    const bytes = rows.reduce((sum, row) => sum + row.byteSize, 0);

    if (bytes + extraBytes > MAX_PROJECT_TREE_BYTES) {
      throw new BadRequestException('Folder too large.');
    }

    if (rows.length + extraNodes > MAX_PROJECT_DOCUMENT_NODES) {
      throw new BadRequestException('Invalid input.');
    }
  }

  private async saveDocumentNode(
    value: Partial<ProjectDocument>,
  ): Promise<ProjectDocument> {
    try {
      return await this.documents.save(this.documents.create(value));
    } catch {
      throw new BadRequestException('Invalid input.');
    }
  }

  private async ensureFolder(
    projectId: string,
    parent: ProjectDocument | null,
    name: string,
    createdByUserId: string,
    created: ProjectDocument[],
  ): Promise<ProjectDocument> {
    const existing = await this.documents.findOne({
      where: {
        originalName: name,
        parentId: parent?.id ?? IsNull(),
        projectId,
      },
    });

    if (existing && existing.kind === 'folder') {
      return existing;
    }

    if (existing) {
      throw new BadRequestException('Invalid input.');
    }

    await this.assertDocumentCapacity(projectId, 1, 0);
    const folder = await this.saveDocumentNode({
      byteSize: 0,
      contentType: null,
      createdByUserId,
      filename: null,
      kind: 'folder',
      originalName: name,
      parentId: parent?.id ?? null,
      projectId,
    });
    created.push(folder);
    return folder;
  }

  private async resolveCover(
    card: Card,
    coverAttachmentId: string | null,
  ): Promise<string | null> {
    if (!coverAttachmentId) {
      return null;
    }

    const attachment = await this.attachments.findOne({
      where: { cardId: card.id, id: coverAttachmentId },
    });

    if (!attachment || !isImageAttachmentMime(attachment.contentType)) {
      throw new BadRequestException('Invalid input.');
    }

    return attachment.id;
  }

  private async assertNoCycle(
    documentId: string,
    nextParentId: string | null,
    projectId: string,
  ): Promise<void> {
    if (!nextParentId) {
      return;
    }

    if (nextParentId === documentId) {
      throw new BadRequestException('Invalid input.');
    }

    const all = await this.documents.find({ where: { projectId } });
    let current = all.find((row) => row.id === nextParentId) ?? null;

    while (current) {
      if (current.id === documentId) {
        throw new BadRequestException('Invalid input.');
      }

      current = current.parentId
        ? (all.find((row) => row.id === current?.parentId) ?? null)
        : null;
    }
  }

  private collectDescendants(
    all: ProjectDocument[],
    parentId: string,
  ): ProjectDocument[] {
    const children = all.filter((row) => row.parentId === parentId);
    return children.flatMap((child) => [
      child,
      ...this.collectDescendants(all, child.id),
    ]);
  }

  private documentZipPath(
    all: ProjectDocument[],
    node: ProjectDocument,
    rootId: string,
  ): string {
    const parts = [node.originalName];
    let current = node;

    while (current.parentId && current.parentId !== rootId) {
      const parent = all.find((row) => row.id === current.parentId);

      if (!parent) {
        break;
      }

      parts.unshift(parent.originalName);
      current = parent;
    }

    return parts.join('/');
  }

  private async deleteBackgroundFile(project: Project): Promise<void> {
    if (!project.backgroundFilename) {
      return;
    }

    const workspace = await this.workspaces.findOne({
      where: { id: project.workspaceId },
    });

    if (!workspace) {
      return;
    }

    await this.tenantStorage.deleteTenantFile(
      workspace.tenantId,
      project.backgroundFilename,
    );
  }

  private async deleteBackgroundFilesForWorkspaces(
    workspaceIds: string[],
  ): Promise<void> {
    const projects = await this.projects.find({
      where: { workspaceId: In(workspaceIds) },
    });

    for (const project of projects) {
      await this.deleteBackgroundFile(project);
    }
  }

  private async deleteDocumentFilesForWorkspaces(
    workspaceIds: string[],
  ): Promise<void> {
    const projects = await this.projects.find({
      where: { workspaceId: In(workspaceIds) },
    });
    await this.deleteDocumentFilesForProjects(projects.map((row) => row.id));
  }

  private async deleteDocumentFilesForProjects(
    projectIds: string[],
  ): Promise<void> {
    if (projectIds.length === 0) {
      return;
    }

    const rows = await this.documents.find({
      where: { projectId: In(projectIds) },
    });
    const projects = await this.projects.find({
      where: { id: In(projectIds) },
    });
    const workspaces = await this.workspaces.find({
      where: { id: In(projects.map((project) => project.workspaceId)) },
    });
    const workspaceByProject = new Map(
      projects.map((project) => {
        const workspace = workspaces.find(
          (item) => item.id === project.workspaceId,
        );
        return [project.id, workspace] as const;
      }),
    );

    for (const row of rows) {
      const workspace = workspaceByProject.get(row.projectId);

      if (!workspace || !row.filename) {
        continue;
      }

      await this.tenantStorage.deleteTenantFile(
        workspace.tenantId,
        row.filename,
      );
    }
  }

  private safeOriginalName(name: string | undefined): string {
    const base = (name ?? 'file').split(/[/\\]/).pop() ?? 'file';
    return base.replace(/[^\w.\- ()]/g, '_').slice(0, 255) || 'file';
  }
}
