import { ProjectsService } from './projects.service.js';
import { CardAttachment } from './entities/card-attachment.entity.js';
import { CardComment } from './entities/card-comment.entity.js';
import { Card } from './entities/card.entity.js';
import { ProjectWorkspace } from './entities/project-workspace.entity.js';
import { Project } from './entities/project.entity.js';
import { User } from '../portal/entities/user.entity.js';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_PROJECT_TREE_BYTES,
} from './project-constants.js';
import { DEFAULT_KANBAN_LANES } from './kanban-lanes.js';
import { CardChecklistItem } from './entities/card-checklist-item.entity.js';
import { ProjectDocument } from './entities/project-document.entity.js';

const tenantId = '22222222-2222-4222-8222-222222222222';
const otherTenantId = '33333333-3333-4333-8333-333333333333';
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const cardId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const commentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const attachmentId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdf = Buffer.from('%PDF-1.4');

function actorUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    enabledActions: [],
    firstName: 'Ana',
    id: 'admin-id',
    lastName: 'Silva',
    profile: 'Administrador',
    status: 'active',
    tenantId,
    ...overrides,
  });
}

function session(user: User) {
  return {
    id: user.id,
    profile: user.profile,
    sessionId: 'session-id',
    tenantId: user.tenantId,
  };
}

describe('ProjectsService', () => {
  function createService(user: User = actorUser()) {
    const workspace = Object.assign(new ProjectWorkspace(), {
      id: workspaceId,
      name: 'Delivery',
      tenantId,
    });
    const project = Object.assign(new Project(), {
      id: projectId,
      name: 'Portal Kanban',
      nextCardNumber: 1,
      workspaceId,
    });
    const workspaces = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([workspace]),
      findOne: vi.fn().mockResolvedValue(workspace),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? workspaceId }),
      ),
    };
    const projects = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([project]),
      findOne: vi.fn().mockResolvedValue(project),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? projectId }),
      ),
    };
    const cards = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (value) =>
        Array.isArray(value)
          ? value
          : Object.assign(value, { id: value.id ?? cardId }),
      ),
    };
    const comments = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      findOne: vi.fn(),
      save: vi.fn(async (value) =>
        Object.assign(value, {
          createdAt: new Date('2026-09-21T12:00:00.000Z'),
          id: value.id ?? commentId,
          updatedAt: new Date('2026-09-21T12:00:00.000Z'),
        }),
      ),
    };
    const attachments = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? attachmentId }),
      ),
    };
    const checklistItems = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? 'check-id' }),
      ),
    };
    const documents = {
      create: vi.fn((value) => value),
      delete: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(async (value) =>
        Object.assign(value, { id: value.id ?? 'doc-id' }),
      ),
    };
    const users = {
      find: vi.fn().mockResolvedValue([user]),
      findOne: vi
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === user.id) {
            return Promise.resolve(user);
          }

          return Promise.resolve(null);
        }),
    };
    const tenantStorage = {
      deleteTenantFile: vi.fn().mockResolvedValue(undefined),
      readTenantFile: vi.fn().mockResolvedValue(jpeg),
      writeTenantFile: vi.fn().mockResolvedValue(undefined),
    };
    const manager = {
      create: vi.fn((_cls: unknown, value: object) => value),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(project),
      save: vi.fn(async (value: { id?: string }) =>
        Object.assign(value, { id: value.id ?? cardId }),
      ),
    };
    const finance = {
      unlinkContractFiles: vi.fn().mockResolvedValue(undefined),
    };
    const financeDocuments = {
      unlinkFilesForProjects: vi.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: vi.fn(
        async (callback: (entityManager: typeof manager) => Promise<unknown>) =>
          callback(manager),
      ),
    };
    const service = new ProjectsService(
      workspaces as never,
      projects as never,
      cards as never,
      comments as never,
      attachments as never,
      checklistItems as never,
      documents as never,
      users as never,
      dataSource as never,
      tenantStorage as never,
      finance as never,
      financeDocuments as never,
    );

    return {
      attachments,
      cards,
      checklistItems,
      comments,
      documents,
      finance,
      financeDocuments,
      manager,
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

  it('lists and creates workspaces for the session tenant', async () => {
    const context = createService();

    await expect(
      context.service.listWorkspaces(session(context.user)),
    ).resolves.toEqual([{ id: workspaceId, name: 'Delivery', tenantId }]);
    await expect(
      context.service.createWorkspace(session(context.user), 'Ops'),
    ).resolves.toEqual({
      id: workspaceId,
      name: 'Ops',
      tenantId,
    });
  });

  it('rejects Usuario workspace writes even with manageProjects', async () => {
    const user = actorUser({
      enabledActions: ['viewProjects', 'manageProjects', 'moveCards'],
      id: 'user-id',
      profile: 'Usuario',
    });
    const { service } = createService(user);

    await expect(service.createWorkspace(session(user), 'Ops')).rejects.toThrow(
      'Access denied.',
    );
  });

  it('keeps AdministradorTenant on their home tenant even if the session differs', async () => {
    const user = actorUser({
      id: 'tenant-admin',
      profile: 'AdministradorTenant',
    });
    const context = createService(user);

    await context.service.createWorkspace(
      { ...session(user), tenantId: otherTenantId },
      'Ops',
    );
    expect(context.workspaces.save).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId }),
    );
  });

  it('lists more than one workspace for a tenant', async () => {
    const context = createService();
    context.workspaces.find.mockResolvedValue([
      Object.assign(new ProjectWorkspace(), {
        id: workspaceId,
        name: 'Delivery',
        tenantId,
      }),
      Object.assign(new ProjectWorkspace(), {
        id: 'ws-2',
        name: 'Ops',
        tenantId,
      }),
    ]);

    await expect(
      context.service.listWorkspaces(session(context.user)),
    ).resolves.toEqual([
      { id: workspaceId, name: 'Delivery', tenantId },
      { id: 'ws-2', name: 'Ops', tenantId },
    ]);
  });

  it('returns six lanes in recorded order', async () => {
    const context = createService();
    context.cards.find.mockResolvedValue([]);

    const board = await context.service.getBoard(
      session(context.user),
      projectId,
    );

    expect(board.lanes.map((lane) => lane.key)).toEqual([
      'backlog',
      'ready',
      'working',
      'review',
      'deploy',
      'done',
    ]);
    expect(board.lanes[0]).toMatchObject({
      color: '#64748B',
      label: 'Backlog',
    });
    expect(board.tenantId).toBe(tenantId);
    expect(board.kanbanFilters).toBeNull();
  });

  it('stores kanban filters in project metadata and returns them on the board', async () => {
    const context = createService();
    context.project.metadata = { note: 'keep' };
    const kanbanFilters = {
      date: {
        endDate: null,
        mode: 'start' as const,
        startDate: '2026-09-01',
      },
      status: ['backlog' as const],
      taskCompletion: 'incomplete' as const,
    };

    await context.service.updateProject(session(context.user), projectId, {
      kanbanFilters,
    });

    expect(context.projects.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { kanbanFilters, note: 'keep' },
        name: 'Portal Kanban',
      }),
    );

    const board = await context.service.getBoard(
      session(context.user),
      projectId,
    );
    expect(board.kanbanFilters).toEqual(kanbanFilters);
    expect(board.name).toBe('Portal Kanban');
  });

  it('rejects kanban filter writes from a viewer and an empty project patch', async () => {
    const user = actorUser({
      enabledActions: ['viewProjects'],
      id: 'viewer-id',
      profile: 'Usuario',
    });
    const context = createService(user);

    await expect(
      context.service.updateProject(session(user), projectId, {
        kanbanFilters: {
          date: null,
          status: [],
          taskCompletion: 'all',
        },
      }),
    ).rejects.toThrow('Access denied.');
    expect(context.projects.save).not.toHaveBeenCalled();

    const manager = createService();
    await expect(
      manager.service.updateProject(session(manager.user), projectId, {}),
    ).rejects.toThrow('Invalid input.');
  });

  it('rejects a dashboard read from another tenant and without viewProjects', async () => {
    const otherAdmin = actorUser({
      id: 'other-admin',
      profile: 'Administrador',
      tenantId: otherTenantId,
    });
    const otherContext = createService(otherAdmin);

    await expect(
      otherContext.service.getBoard(session(otherAdmin), projectId),
    ).rejects.toThrow('Access denied.');

    const viewer = actorUser({
      enabledActions: [],
      id: 'viewer-id',
      profile: 'Usuario',
    });
    const viewerContext = createService(viewer);

    await expect(
      viewerContext.service.getBoard(session(viewer), projectId),
    ).rejects.toThrow('Access denied.');
  });

  it('ignores invalid stored kanban filters', async () => {
    const context = createService();
    context.project.metadata = { kanbanFilters: { status: ['Backlog'] } };

    const board = await context.service.getBoard(
      session(context.user),
      projectId,
    );

    expect(board.kanbanFilters).toBeNull();
  });

  it('renames and deletes only empty lanes and appends a lane', async () => {
    const context = createService();
    context.cards.find.mockResolvedValue([]);
    const renamed = DEFAULT_KANBAN_LANES.map((lane) => ({
      key: lane.key,
      label: lane.key === 'ready' ? 'Preparação' : lane.label,
    }));

    await context.service.updateProject(session(context.user), projectId, {
      kanbanLanes: renamed,
    });

    expect(context.project.metadata).toMatchObject({
      kanbanLanes: expect.arrayContaining([
        { color: '#3D9CF0', key: 'ready', label: 'Preparação' },
      ]),
    });

    context.cards.find.mockResolvedValue([{ lane: 'ready' } as Card]);
    await expect(
      context.service.updateProject(session(context.user), projectId, {
        kanbanLanes: renamed.map((lane) =>
          lane.key === 'ready' ? { ...lane, label: 'Pronto' } : lane,
        ),
      }),
    ).rejects.toThrow('Invalid input.');
    await expect(
      context.service.updateProject(session(context.user), projectId, {
        kanbanLanes: renamed.filter((lane) => lane.key !== 'ready'),
      }),
    ).rejects.toThrow('Invalid input.');

    context.cards.find.mockResolvedValue([]);
    await context.service.updateProject(session(context.user), projectId, {
      kanbanLanes: [
        ...DEFAULT_KANBAN_LANES.map((lane) => ({
          key: lane.key,
          label: lane.label,
        })),
        { label: 'QA' },
      ],
    });

    const stored = (
      context.project.metadata as {
        kanbanLanes: { key: string; label: string }[];
      }
    ).kanbanLanes;
    expect(stored).toHaveLength(7);
    expect(stored[6].label).toBe('QA');
    expect(stored[6]).toMatchObject({ color: '#E85D8C' });
    expect(stored[6].key).toMatch(/^c[0-9a-f]{8}$/);
  });

  it('rejects lane changes without the granted board actions', async () => {
    const tenantAdmin = actorUser({
      id: 'tenant-admin',
      profile: 'AdministradorTenant',
    });
    const context = createService(tenantAdmin);
    context.cards.find.mockResolvedValue([]);
    const renamed = DEFAULT_KANBAN_LANES.map((lane) => ({
      key: lane.key,
      label: lane.key === 'ready' ? 'Preparação' : lane.label,
    }));

    await expect(
      context.service.updateProject(session(tenantAdmin), projectId, {
        kanbanLanes: renamed,
      }),
    ).rejects.toThrow('Access denied.');
    await expect(
      context.service.updateProject(session(tenantAdmin), projectId, {
        kanbanLanes: [...renamed, { label: 'QA' }],
      }),
    ).rejects.toThrow('Access denied.');

    const viewer = actorUser({
      enabledActions: ['viewProjects', 'createLane'],
      id: 'viewer-id',
      profile: 'Usuario',
    });
    const granted = createService(viewer);
    granted.cards.find.mockResolvedValue([]);
    await granted.service.updateProject(session(viewer), projectId, {
      kanbanLanes: [
        ...DEFAULT_KANBAN_LANES.map((lane) => ({
          key: lane.key,
          label: lane.label,
        })),
        { label: 'QA' },
      ],
    });
    expect(granted.project.metadata).toMatchObject({
      kanbanLanes: expect.arrayContaining([
        expect.objectContaining({ label: 'QA' }),
      ]),
    });
  });

  it('assigns sequential card numbers and does not reuse a deleted number', async () => {
    const context = createService();
    const assignee = actorUser({
      id: 'assignee-id',
      profile: 'AdministradorTenant',
    });
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === context.user.id) {
          return Promise.resolve(context.user);
        }

        if (where.id === assignee.id) {
          return Promise.resolve(assignee);
        }

        return Promise.resolve(null);
      },
    );
    context.users.find.mockResolvedValue([context.user, assignee]);
    context.project.nextCardNumber = 1;
    context.manager.findOne.mockResolvedValue(context.project);
    let createdNumber = 0;
    context.manager.save.mockImplementation(
      async (value: {
        id?: string;
        nextCardNumber?: number;
        number?: number;
      }) => {
        if (value.nextCardNumber !== undefined) {
          return Object.assign(value, { id: value.id ?? projectId });
        }

        createdNumber = value.number ?? 0;
        return Object.assign(value, { id: cardId, number: createdNumber });
      },
    );
    context.cards.findOne.mockImplementation(async () =>
      Object.assign(new Card(), {
        assigneeUserId: assignee.id,
        attachments: [],
        comments: [],
        createdAt: new Date('2026-09-21T12:00:00.000Z'),
        createdByUserId: context.user.id,
        description: 'Build the board',
        dueAt: new Date('2026-09-22T03:00:00.000Z'),
        id: cardId,
        lane: 'backlog',
        number: createdNumber,
        position: 0,
        priority: 'high',
        projectId,
        tags: [{ color: 'lime', name: 'kanban' }],
        title: 'Card',
      }),
    );

    const first = await context.service.createCard(
      session(context.user),
      projectId,
      {
        assigneeUserId: assignee.id,
        description: 'Build the board',
        dueAt: '2026-09-22T03:00:00.000Z',
        priority: 'high',
        tags: [{ color: 'lime', name: 'kanban' }],
        title: 'Card',
      },
    );
    expect(first.number).toBe(1);
    expect(first.priority).toBe('high');
    expect(first.tags).toEqual([{ color: 'lime', name: 'kanban' }]);
    expect(first.dueAt).toBe('2026-09-22T03:00:00.000Z');
    expect(first.startsAt).toBeNull();

    await expect(
      context.service.createCard(session(context.user), projectId, {
        assigneeUserId: assignee.id,
        description: 'Build the board',
        dueAt: '2026-09-21T03:00:00.000Z',
        startsAt: '2026-09-30T03:00:00.000Z',
        title: 'Card',
      }),
    ).rejects.toThrow('Invalid input.');
    expect(context.project.nextCardNumber).toBe(2);

    await context.service.deleteCard(session(context.user), cardId);
    expect(context.cards.delete).toHaveBeenCalledWith({ id: cardId });

    const second = await context.service.createCard(
      session(context.user),
      projectId,
      {
        assigneeUserId: assignee.id,
        description: 'Build the board',
        title: 'Card',
      },
    );
    expect(second.number).toBe(2);
    expect(context.project.nextCardNumber).toBe(3);
  });

  it('moves a card to another lane and rejects the current lane', async () => {
    const context = createService();
    const card = Object.assign(new Card(), {
      assigneeUserId: context.user.id,
      attachments: [],
      comments: [],
      createdAt: new Date('2026-09-21T12:00:00.000Z'),
      createdByUserId: context.user.id,
      description: 'Build',
      dueAt: null,
      id: cardId,
      lane: 'backlog',
      number: 1,
      position: 0,
      priority: 'medium',
      projectId,
      tags: [],
      title: 'Card',
    });
    context.cards.findOne.mockResolvedValue(card);
    context.users.find.mockResolvedValue([context.user]);
    context.cards.find.mockResolvedValue([]);

    await expect(
      context.service.moveCard(session(context.user), cardId, 'backlog'),
    ).rejects.toThrow('Invalid input.');

    const moved = await context.service.moveCard(
      session(context.user),
      cardId,
      'ready',
    );
    expect(moved.lane).toBe('ready');
  });

  it('reorders cards within a lane', async () => {
    const context = createService();
    const first = Object.assign(new Card(), {
      assigneeUserId: context.user.id,
      attachments: [],
      comments: [],
      createdAt: new Date('2026-09-21T12:00:00.000Z'),
      createdByUserId: context.user.id,
      description: 'A',
      dueAt: null,
      id: cardId,
      lane: 'backlog',
      number: 1,
      position: 0,
      priority: 'medium',
      projectId,
      tags: [],
      title: 'A',
    });
    const second = Object.assign(new Card(), {
      ...first,
      id: 'other-card',
      number: 2,
      position: 1,
      title: 'B',
    });
    context.cards.findOne.mockResolvedValue(first);
    context.cards.find.mockResolvedValue([first, second]);
    context.users.find.mockResolvedValue([context.user]);

    await context.service.reorderCard(session(context.user), cardId, 'down');
    expect(context.cards.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: cardId, position: 1 }),
      expect.objectContaining({ id: 'other-card', position: 0 }),
    ]);
  });

  it('rejects move without moveCards', async () => {
    const user = actorUser({
      enabledActions: ['viewProjects'],
      id: 'user-id',
      profile: 'Usuario',
    });
    const { service } = createService(user);

    await expect(
      service.moveCard(session(user), cardId, 'ready'),
    ).rejects.toThrow('Access denied.');
  });

  it('creates, edits, and deletes comments for card access', async () => {
    const context = createService();
    const card = Object.assign(new Card(), {
      id: cardId,
      projectId,
    });
    context.cards.findOne.mockResolvedValue(card);
    const comment = Object.assign(new CardComment(), {
      authorUserId: context.user.id,
      body: 'Ready for review.',
      cardId,
      createdAt: new Date('2026-09-21T12:00:00.000Z'),
      id: commentId,
      updatedAt: new Date('2026-09-21T12:00:00.000Z'),
    });
    context.comments.findOne.mockResolvedValue(comment);

    const created = await context.service.createComment(
      session(context.user),
      cardId,
      'Ready for review.',
    );
    expect(created.authorUserId).toBe(context.user.id);
    await expect(
      context.service.updateComment(
        session(context.user),
        cardId,
        commentId,
        'Updated',
      ),
    ).resolves.toEqual(expect.objectContaining({ body: 'Updated' }));
    await context.service.deleteComment(
      session(context.user),
      cardId,
      commentId,
    );
    expect(context.comments.delete).toHaveBeenCalledWith({ id: commentId });
  });

  it('accepts JPEG attachments and rejects the eleventh file', async () => {
    const context = createService();
    const card = Object.assign(new Card(), { id: cardId, projectId });
    context.cards.findOne.mockResolvedValue(card);

    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'brief.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).resolves.toEqual(
      expect.objectContaining({
        createdByUserId: context.user.id,
        originalName: 'brief.jpg',
        url: `/api/v1/cards/${cardId}/attachments/${attachmentId}`,
      }),
    );
    expect(context.tenantStorage.writeTenantFile).toHaveBeenCalled();

    context.attachments.count.mockResolvedValue(10);
    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: png,
        mimetype: 'image/png',
        originalname: 'shot.png',
        size: png.length,
      } as Express.Multer.File),
    ).rejects.toThrow('Invalid input.');
  });

  it('rejects a non-allowlisted attachment type', async () => {
    const context = createService();
    context.cards.findOne.mockResolvedValue(
      Object.assign(new Card(), { id: cardId, projectId }),
    );

    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: Buffer.from('<svg></svg>'),
        mimetype: 'image/svg+xml',
        originalname: 'icon.svg',
        size: 11,
      } as Express.Multer.File),
    ).rejects.toThrow('Invalid input.');
  });

  it('accepts a plain-text card attachment', async () => {
    const context = createService();
    context.cards.findOne.mockResolvedValue(
      Object.assign(new Card(), { id: cardId, projectId }),
    );

    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        originalname: 'notes.txt',
        size: 5,
      } as Express.Multer.File),
    ).resolves.toEqual(
      expect.objectContaining({
        createdByUserId: context.user.id,
        originalName: 'notes.txt',
      }),
    );
  });

  it('rejects a cross-tenant assignee', async () => {
    const context = createService();
    const outsider = actorUser({
      id: 'outsider',
      profile: 'AdministradorTenant',
      tenantId: otherTenantId,
    });
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === context.user.id) {
          return Promise.resolve(context.user);
        }

        if (where.id === outsider.id) {
          return Promise.resolve(outsider);
        }

        return Promise.resolve(null);
      },
    );

    await expect(
      context.service.createCard(session(context.user), projectId, {
        assigneeUserId: outsider.id,
        description: 'Build',
        title: 'Card',
      }),
    ).rejects.toThrow('Invalid input.');
  });

  it('deletes attachment files when a workspace is removed', async () => {
    const context = createService();
    const card = Object.assign(new Card(), { id: cardId, projectId });
    const file = Object.assign(new CardAttachment(), {
      cardId,
      filename: `${attachmentId}.pdf`,
    });
    context.projects.find.mockResolvedValue([context.project]);
    context.cards.find.mockResolvedValue([card]);
    context.attachments.find.mockResolvedValue([file]);

    await context.service.deleteWorkspace(session(context.user), workspaceId);

    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      tenantId,
      `${attachmentId}.pdf`,
    );
    expect(context.finance.unlinkContractFiles).toHaveBeenCalledWith([
      projectId,
    ]);
    expect(
      context.financeDocuments.unlinkFilesForProjects,
    ).toHaveBeenCalledWith([projectId]);
    expect(context.workspaces.delete).toHaveBeenCalledWith({ id: workspaceId });
  });

  it('deletes attachment files when a project is removed', async () => {
    const context = createService();
    const card = Object.assign(new Card(), { id: cardId, projectId });
    const file = Object.assign(new CardAttachment(), {
      cardId,
      filename: `${attachmentId}.jpg`,
    });
    context.cards.find.mockResolvedValue([card]);
    context.attachments.find.mockResolvedValue([file]);

    await context.service.deleteProject(session(context.user), projectId);

    expect(context.tenantStorage.deleteTenantFile).toHaveBeenCalledWith(
      tenantId,
      `${attachmentId}.jpg`,
    );
    expect(context.finance.unlinkContractFiles).toHaveBeenCalledWith([
      projectId,
    ]);
    expect(
      context.financeDocuments.unlinkFilesForProjects,
    ).toHaveBeenCalledWith([projectId]);
    expect(context.projects.delete).toHaveBeenCalledWith({ id: projectId });
  });

  it('lets an administrador delete a project in another tenant', async () => {
    const context = createService();
    context.projects.findOne.mockResolvedValue(context.project);

    await context.service.deleteProjectAnywhere(
      session(context.user),
      projectId,
    );

    expect(context.finance.unlinkContractFiles).toHaveBeenCalledWith([
      projectId,
    ]);
    expect(
      context.financeDocuments.unlinkFilesForProjects,
    ).toHaveBeenCalledWith([projectId]);
    expect(context.projects.delete).toHaveBeenCalledWith({ id: projectId });
  });

  it('rejects a non-administrator deleting a project from finance', async () => {
    const user = actorUser({ profile: 'AdministradorTenant' });
    const context = createService(user);

    await expect(
      context.service.deleteProjectAnywhere(session(user), projectId),
    ).rejects.toThrow('Access denied.');
    expect(context.projects.delete).not.toHaveBeenCalled();
  });

  it('lets Usuario with viewProjects mutate cards but not move them', async () => {
    const user = actorUser({
      enabledActions: ['viewProjects'],
      id: 'user-id',
      profile: 'Usuario',
    });
    const context = createService(user);
    const card = Object.assign(new Card(), {
      assigneeUserId: user.id,
      attachments: [],
      comments: [],
      createdAt: new Date('2026-09-21T12:00:00.000Z'),
      createdByUserId: user.id,
      description: 'Build',
      dueAt: null,
      id: cardId,
      lane: 'backlog',
      number: 1,
      position: 0,
      priority: 'medium',
      projectId,
      tags: [],
      title: 'Card',
    });
    context.cards.findOne.mockResolvedValue(card);
    context.users.find.mockResolvedValue([user]);
    context.comments.findOne.mockResolvedValue(
      Object.assign(new CardComment(), {
        authorUserId: 'other-author',
        body: 'Ready for review.',
        cardId,
        createdAt: new Date('2026-09-21T12:00:00.000Z'),
        id: commentId,
        updatedAt: new Date('2026-09-21T12:00:00.000Z'),
      }),
    );

    await expect(
      context.service.updateCard(session(user), cardId, { title: 'Updated' }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Updated' }));
    await expect(
      context.service.createComment(session(user), cardId, 'Ready for review.'),
    ).resolves.toEqual(expect.objectContaining({ authorUserId: user.id }));
    await expect(
      context.service.updateComment(session(user), cardId, commentId, 'Edited'),
    ).resolves.toEqual(expect.objectContaining({ body: 'Edited' }));
    await context.service.deleteComment(session(user), cardId, commentId);
    expect(context.comments.delete).toHaveBeenCalledWith({ id: commentId });
    await expect(
      context.service.addAttachment(session(user), cardId, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'brief.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).resolves.toEqual(expect.objectContaining({ originalName: 'brief.jpg' }));
    await context.service.deleteCard(session(user), cardId);
    expect(context.cards.delete).toHaveBeenCalledWith({ id: cardId });
    await expect(
      context.service.moveCard(session(user), cardId, 'ready'),
    ).rejects.toThrow('Access denied.');
    await expect(
      context.service.reorderCard(session(user), cardId, 'up'),
    ).rejects.toThrow('Access denied.');
    await expect(
      context.service.placeCard(session(user), cardId, 'ready', 0),
    ).rejects.toThrow('Access denied.');
  });

  it('accepts PDF attachments and rejects an oversized file', async () => {
    const context = createService();
    context.cards.findOne.mockResolvedValue(
      Object.assign(new Card(), { id: cardId, projectId }),
    );

    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: pdf,
        mimetype: 'application/pdf',
        originalname: 'brief.pdf',
        size: pdf.length,
      } as Express.Multer.File),
    ).resolves.toEqual(expect.objectContaining({ originalName: 'brief.pdf' }));

    await expect(
      context.service.addAttachment(session(context.user), cardId, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'huge.jpg',
        size: MAX_ATTACHMENT_BYTES + 1,
      } as Express.Multer.File),
    ).rejects.toThrow('Invalid input.');
  });

  it('rejects an assignee without Projetos access', async () => {
    const context = createService();
    const outsider = actorUser({
      enabledActions: [],
      id: 'plain-user',
      profile: 'Usuario',
    });
    context.users.findOne.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === context.user.id) {
          return Promise.resolve(context.user);
        }

        if (where.id === outsider.id) {
          return Promise.resolve(outsider);
        }

        return Promise.resolve(null);
      },
    );

    await expect(
      context.service.createCard(session(context.user), projectId, {
        assigneeUserId: outsider.id,
        description: 'Build',
        title: 'Card',
      }),
    ).rejects.toThrow('Invalid input.');
  });

  it('rejects the 501st comment on a card', async () => {
    const context = createService();
    context.cards.findOne.mockResolvedValue(
      Object.assign(new Card(), { id: cardId, projectId }),
    );
    context.comments.count.mockResolvedValue(500);

    await expect(
      context.service.createComment(session(context.user), cardId, 'Overflow'),
    ).rejects.toThrow('Invalid input.');
  });

  it('places a card at an index in another lane', async () => {
    const context = createService();
    const card = Object.assign(new Card(), {
      assigneeUserId: context.user.id,
      attachments: [],
      comments: [],
      createdAt: new Date('2026-09-21T12:00:00.000Z'),
      createdByUserId: context.user.id,
      description: 'Build',
      dueAt: null,
      id: cardId,
      lane: 'backlog',
      number: 1,
      position: 0,
      priority: 'medium',
      projectId,
      tags: [],
      title: 'Card',
    });
    const ready = Object.assign(new Card(), {
      ...card,
      id: 'ready-card',
      lane: 'ready',
      number: 2,
    });
    context.cards.findOne.mockResolvedValue(card);
    context.cards.find.mockResolvedValue([ready]);
    context.users.find.mockResolvedValue([context.user]);

    const placed = await context.service.placeCard(
      session(context.user),
      cardId,
      'ready',
      0,
    );
    expect(placed.lane).toBe('ready');
    expect(context.cards.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: cardId, lane: 'ready', position: 0 }),
      expect.objectContaining({ id: 'ready-card', position: 1 }),
    ]);
  });

  it('creates checklist items and rejects the 51st', async () => {
    const context = createService();
    context.cards.findOne.mockResolvedValue(
      Object.assign(new Card(), { id: cardId, projectId }),
    );
    context.checklistItems.find.mockResolvedValue([]);

    await expect(
      context.service.createChecklistItem(
        session(context.user),
        cardId,
        'Write spec',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        body: 'Write spec',
        createdByUserId: context.user.id,
      }),
    );

    context.checklistItems.find.mockResolvedValue(
      Array.from({ length: 50 }, (_, index) =>
        Object.assign(new CardChecklistItem(), {
          id: `item-${index}`,
          position: index,
        }),
      ),
    );
    await expect(
      context.service.createChecklistItem(
        session(context.user),
        cardId,
        'Overflow',
      ),
    ).rejects.toThrow('Invalid input.');
  });

  it('lets AdministradorTenant set a background and rejects Global', async () => {
    const tenantAdmin = actorUser({
      id: 'tenant-admin',
      profile: 'AdministradorTenant',
    });
    const context = createService(tenantAdmin);
    await expect(
      context.service.putBackground(session(tenantAdmin), projectId, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'bg.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).resolves.toEqual({
      backgroundUrl: `/api/v1/projects/${projectId}/background`,
    });

    const globalAdmin = actorUser();
    const denied = createService(globalAdmin);
    await expect(
      denied.service.putBackground(session(globalAdmin), projectId, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'bg.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).rejects.toThrow('Access denied.');
  });

  it('creates a project folder, rejects traversal, and rejects a 500 MB overflow', async () => {
    const context = createService();
    await expect(
      context.service.createFolder(session(context.user), projectId, {
        kind: 'folder',
        name: 'Docs',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        createdByUserId: context.user.id,
        kind: 'folder',
        originalName: 'Docs',
      }),
    );

    await expect(
      context.service.uploadDocuments(
        session(context.user),
        projectId,
        [
          {
            buffer: Buffer.from('hello'),
            mimetype: 'text/plain',
            originalname: 'secret.txt',
            size: 5,
          } as Express.Multer.File,
        ],
        null,
        ['../secret.txt'],
      ),
    ).rejects.toThrow('Invalid input.');

    context.documents.find.mockResolvedValue([
      Object.assign(new ProjectDocument(), {
        byteSize: MAX_PROJECT_TREE_BYTES,
        kind: 'file',
      }),
    ]);
    await expect(
      context.service.uploadDocuments(
        session(context.user),
        projectId,
        [
          {
            buffer: Buffer.from('hello'),
            mimetype: 'text/plain',
            originalname: 'notes.txt',
            size: 5,
          } as Express.Multer.File,
        ],
        null,
        ['notes.txt'],
      ),
    ).rejects.toThrow('Folder too large.');
  });
});
