import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:net';
import { Readable } from 'node:stream';
import request from 'supertest';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { CardsController } from '../src/modules/projects/cards.controller.js';
import { AdministradorTenantGuard } from '../src/modules/projects/guards/administrador-tenant.guard.js';
import { MoveCardsGuard } from '../src/modules/projects/guards/move-cards.guard.js';
import { ViewProjectsGuard } from '../src/modules/projects/guards/view-projects.guard.js';
import { ProjectUpdateGuard } from '../src/modules/projects/guards/project-update.guard.js';
import { WorkspaceManagerGuard } from '../src/modules/projects/guards/workspace-manager.guard.js';
import { ProjectWorkspacesController } from '../src/modules/projects/project-workspaces.controller.js';
import { ProjectsController } from '../src/modules/projects/projects.controller.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';

const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const cardId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const commentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const folderId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

describe('Project Kanban API (e2e)', () => {
  let app: INestApplication<Server>;
  const projectsService = {
    addAttachment: vi.fn().mockResolvedValue({
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      url: `/api/v1/cards/${cardId}/attachments/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`,
    }),
    archiveDocument: vi.fn().mockResolvedValue({
      filename: 'Docs.zip',
      stream: Readable.from([Buffer.from('PK')]),
    }),
    createCard: vi.fn().mockResolvedValue({ id: cardId, number: 1 }),
    createChecklistItem: vi
      .fn()
      .mockResolvedValue({ id: 'check-id', body: 'Write spec' }),
    createComment: vi.fn().mockResolvedValue({ id: 'comment-id', body: 'Hi' }),
    createFolder: vi.fn().mockResolvedValue({
      children: [],
      id: folderId,
      kind: 'folder',
      originalName: 'Docs',
    }),
    createProject: vi.fn().mockResolvedValue({
      id: projectId,
      name: 'Portal Kanban',
      workspaceId,
    }),
    createWorkspace: vi.fn().mockResolvedValue({
      id: workspaceId,
      name: 'Delivery',
      tenantId: '22222222-2222-4222-8222-222222222222',
    }),
    deleteAttachment: vi.fn().mockResolvedValue(undefined),
    deleteBackground: vi.fn().mockResolvedValue(undefined),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    deleteChecklistItem: vi.fn().mockResolvedValue(undefined),
    deleteComment: vi.fn().mockResolvedValue(undefined),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    deleteWorkspace: vi.fn().mockResolvedValue(undefined),
    getBoard: vi.fn().mockResolvedValue({
      backgroundUrl: null,
      documents: [],
      id: projectId,
      lanes: [
        { cards: [], key: 'backlog' },
        { cards: [], key: 'ready' },
        { cards: [], key: 'working' },
        { cards: [], key: 'review' },
        { cards: [], key: 'deploy' },
        { cards: [], key: 'done' },
      ],
      name: 'Portal Kanban',
      workspaceId,
    }),
    listProjects: vi
      .fn()
      .mockResolvedValue([
        { id: projectId, name: 'Portal Kanban', workspaceId },
      ]),
    listWorkspaces: vi.fn().mockResolvedValue([
      {
        id: workspaceId,
        name: 'Delivery',
        tenantId: '22222222-2222-4222-8222-222222222222',
      },
    ]),
    moveCard: vi.fn().mockResolvedValue({ id: cardId, lane: 'ready' }),
    placeCard: vi
      .fn()
      .mockResolvedValue({ id: cardId, lane: 'ready', position: 0 }),
    putBackground: vi.fn().mockResolvedValue({
      backgroundUrl: `/api/v1/projects/${projectId}/background`,
    }),
    readAttachment: vi.fn().mockResolvedValue({
      bytes: jpeg,
      contentType: 'image/jpeg',
      originalName: 'brief.jpg',
    }),
    readDocument: vi.fn().mockResolvedValue({
      bytes: Buffer.from('hello'),
      contentType: 'text/plain',
      originalName: 'notes.txt',
    }),
    reorderCard: vi.fn().mockResolvedValue({ id: cardId, position: 1 }),
    updateCard: vi.fn().mockResolvedValue({ id: cardId, title: 'Updated' }),
    updateChecklistItem: vi
      .fn()
      .mockResolvedValue({ id: 'check-id', done: true }),
    updateComment: vi
      .fn()
      .mockResolvedValue({ id: 'comment-id', body: 'Edited' }),
    updateDocument: vi
      .fn()
      .mockResolvedValue({ id: folderId, originalName: 'Renamed' }),
    updateProject: vi.fn().mockResolvedValue({
      id: projectId,
      name: 'Renamed',
      workspaceId,
    }),
    updateWorkspace: vi.fn().mockResolvedValue({
      id: workspaceId,
      name: 'Renamed',
      tenantId: '22222222-2222-4222-8222-222222222222',
    }),
    uploadDocuments: vi
      .fn()
      .mockResolvedValue([
        { id: 'file-id', kind: 'file', originalName: 'notes.txt' },
      ]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ProjectWorkspacesController,
        ProjectsController,
        CardsController,
      ],
      providers: [{ provide: ProjectsService, useValue: projectsService }],
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
      .overrideGuard(ViewProjectsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceManagerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectUpdateGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MoveCardsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorTenantGuard)
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

  it('lists workspaces and creates a named workspace', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/project-workspaces')
      .expect(200)
      .expect([
        {
          id: workspaceId,
          name: 'Delivery',
          tenantId: '22222222-2222-4222-8222-222222222222',
        },
      ]);

    await request(app.getHttpServer())
      .post('/api/v1/project-workspaces')
      .send({ name: 'Ops' })
      .expect(201);

    expect(projectsService.createWorkspace).toHaveBeenCalled();
  });

  it('rejects an empty workspace name', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/project-workspaces')
      .send({ name: '   ' })
      .expect(400);
    expect(projectsService.createWorkspace).not.toHaveBeenCalled();
  });

  it('creates a project, loads the board, and creates a card', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/project-workspaces/${workspaceId}/projects`)
      .send({ name: 'Portal Kanban' })
      .expect(201);

    const board = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);

    expect(board.body.lanes.map((lane: { key: string }) => lane.key)).toEqual([
      'backlog',
      'ready',
      'working',
      'review',
      'deploy',
      'done',
    ]);

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}`)
      .send({})
      .expect(400);
    expect(projectsService.updateProject).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}`)
      .send({
        kanbanFilters: {
          date: null,
          status: ['ARCHIVE'],
          taskCompletion: 'all',
        },
      })
      .expect(400);
    expect(projectsService.updateProject).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}`)
      .send({
        kanbanFilters: {
          date: {
            endDate: null,
            mode: 'start',
            startDate: '2026-09-01',
          },
          status: ['backlog'],
          taskCompletion: 'incomplete',
        },
      })
      .expect(200);
    expect(projectsService.updateProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'admin-id' }),
      projectId,
      expect.objectContaining({
        kanbanFilters: expect.objectContaining({
          taskCompletion: 'incomplete',
        }),
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/cards`)
      .send({
        assigneeUserId: '11111111-1111-4111-8111-111111111111',
        description: 'Implement the board',
        title: 'Build the board',
      })
      .expect(201);
  });

  it('moves, reorders, comments, and deletes a card', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/move`)
      .send({ lane: 'ready' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/reorder`)
      .send({ direction: 'up' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/comments`)
      .send({ body: 'Ready for review.' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/cards/${cardId}/comments/${commentId}`)
      .send({ body: 'Edited' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/cards/${cardId}/comments/${commentId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/v1/cards/${cardId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/v1/project-workspaces/${workspaceId}`)
      .expect(204);
  });

  it('rejects a disallowed attachment through multer', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/attachments`)
      .attach('file', Buffer.from('<svg></svg>'), {
        filename: 'icon.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
    expect(projectsService.addAttachment).not.toHaveBeenCalled();
  });

  it('downloads an attachment as bytes', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/cards/${cardId}/attachments/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`,
      )
      .expect(200);

    expect(response.headers['content-type']).toContain('image/jpeg');
    expect(response.body).toEqual(jpeg);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('rejects extra workspace fields and more than 20 tags', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/project-workspaces')
      .send({ description: 'nope', name: 'Ops' })
      .expect(400);
    expect(projectsService.createWorkspace).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/cards`)
      .send({
        assigneeUserId: '11111111-1111-4111-8111-111111111111',
        description: 'Implement the board',
        tags: Array.from({ length: 21 }, (_, index) => ({
          color: 'lime',
          name: `tag${index}`,
        })),
        title: 'Build the board',
      })
      .expect(400);
    expect(projectsService.createCard).not.toHaveBeenCalled();
  });

  it('creates a card without an assignee', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/cards`)
      .send({
        description: 'Implement the board',
        title: 'Build the board',
      })
      .expect(201);
    expect(projectsService.createCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'admin-id' }),
      projectId,
      expect.objectContaining({
        description: 'Implement the board',
        title: 'Build the board',
      }),
    );
    const payload = projectsService.createCard.mock.calls.at(-1)?.[2] as {
      assigneeUserId?: string;
    };
    expect(payload.assigneeUserId).toBeUndefined();
  });

  it('places a card, manages checklist items, and deletes an attachment', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/place`)
      .send({ lane: 'ready', position: 0 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/checklist-items`)
      .send({ body: 'Write spec' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/cards/${cardId}/checklist-items/${commentId}`)
      .send({ done: true })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/cards/${cardId}/checklist-items/${commentId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(
        `/api/v1/cards/${cardId}/attachments/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`,
      )
      .expect(204);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/background`)
      .attach('file', jpeg, { filename: 'bg.jpg', contentType: 'image/jpeg' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}/background`)
      .expect(204);
  });

  it('creates a project folder and downloads a zip archive', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents`)
      .send({ kind: 'folder', name: 'Docs' })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/documents/${folderId}/archive`)
      .expect(200)
      .expect('Content-Type', /zip/);
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/documents/${folderId}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/documents/${folderId}`)
      .send({ name: 'Renamed' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}/documents/${folderId}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents`)
      .field('relativePaths', JSON.stringify(['notes.txt']))
      .attach('files', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(201);
  });
});

describe('Project Kanban API without a session', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ProjectWorkspacesController,
        ProjectsController,
        CardsController,
      ],
      providers: [
        { provide: ProjectsService, useValue: { listWorkspaces: vi.fn() } },
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'secret' },
        },
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    })
      .overrideGuard(ViewProjectsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceManagerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectUpdateGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MoveCardsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorTenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 for an unauthenticated caller', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/project-workspaces')
      .expect(401);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/place`)
      .send({ lane: 'ready', position: 0 })
      .expect(401);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/background`)
      .expect(401);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents`)
      .send({ kind: 'folder', name: 'Docs' })
      .expect(401);
  });
});

describe('Project Kanban API without project access', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ProjectWorkspacesController,
        ProjectsController,
        CardsController,
      ],
      providers: [
        { provide: ProjectsService, useValue: { listWorkspaces: vi.fn() } },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: { id: string } } };
        }) => {
          context.switchToHttp().getRequest().user = { id: 'user-id' };
          return true;
        },
      })
      .overrideGuard(ViewProjectsGuard)
      .useValue({
        canActivate: () => {
          throw new ForbiddenException('Access denied.');
        },
      })
      .overrideGuard(MoveCardsGuard)
      .useValue({
        canActivate: () => {
          throw new ForbiddenException('Access denied.');
        },
      })
      .overrideGuard(AdministradorTenantGuard)
      .useValue({
        canActivate: () => {
          throw new ForbiddenException('Access denied.');
        },
      })
      .overrideGuard(WorkspaceManagerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectUpdateGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 403 without viewProjects or moveCards', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/project-workspaces')
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/move`)
      .send({ lane: 'ready' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/cards/${cardId}/place`)
      .send({ lane: 'ready', position: 0 })
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/background`)
      .expect(403);
  });
});
