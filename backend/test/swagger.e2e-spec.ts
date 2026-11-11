import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:net';
import request from 'supertest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import { setupSwagger } from '../src/common/swagger/setup-swagger.js';
import { healthExample } from '../src/common/swagger/examples.js';
import { ContactController } from '../src/modules/contact/contact.controller.js';
import { ContactService } from '../src/modules/contact/contact.service.js';
import { AuthController } from '../src/modules/portal/auth.controller.js';
import { AuthService } from '../src/modules/portal/auth.service.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { AdminTenantSettingsController } from '../src/modules/portal/admin-tenant-settings.controller.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { AdministradorGuard } from '../src/modules/portal/guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from '../src/modules/portal/guards/administrador-or-create-user.guard.js';
import { SelfOrAdministradorGuard } from '../src/modules/portal/guards/self-or-administrador.guard.js';
import { UsersListGuard } from '../src/modules/portal/guards/users-list.guard.js';
import { TenantsController } from '../src/modules/portal/tenants.controller.js';
import { TenantsService } from '../src/modules/portal/tenants.service.js';
import { UsersController } from '../src/modules/portal/users.controller.js';
import { UsersService } from '../src/modules/portal/users.service.js';
import { PowerBiController } from '../src/modules/powerbi/powerbi.controller.js';
import { PowerBiService } from '../src/modules/powerbi/powerbi.service.js';
import { CardsController } from '../src/modules/projects/cards.controller.js';
import { AdministradorTenantGuard } from '../src/modules/projects/guards/administrador-tenant.guard.js';
import { MoveCardsGuard } from '../src/modules/projects/guards/move-cards.guard.js';
import { ViewProjectsGuard } from '../src/modules/projects/guards/view-projects.guard.js';
import { ProjectUpdateGuard } from '../src/modules/projects/guards/project-update.guard.js';
import { WorkspaceManagerGuard } from '../src/modules/projects/guards/workspace-manager.guard.js';
import { ProjectWorkspacesController } from '../src/modules/projects/project-workspaces.controller.js';
import { ProjectsController } from '../src/modules/projects/projects.controller.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { TicketsController } from '../src/modules/tickets/tickets.controller.js';
import { TicketsService } from '../src/modules/tickets/tickets.service.js';
import {
  ExpenseCategoriesController,
  ExpenseSeriesController,
  ExpenseSubcategoriesController,
  ExpensesController,
} from '../src/modules/expenses/expenses.controller.js';
import { ExpensesService } from '../src/modules/expenses/expenses.service.js';
import { AiAgentController } from '../src/modules/ai-agent/ai-agent.controller.js';
import { AiAttachmentsService } from '../src/modules/ai-agent/ai-attachments.service.js';
import { AiConversationsService } from '../src/modules/ai-agent/ai-conversations.service.js';
import { AiStreamService } from '../src/modules/ai-agent/ai-stream.service.js';

const jwtSecret = 'swagger-test-secret';

describe('Swagger (e2e)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [
        AppController,
        AuthController,
        AdminTenantSettingsController,
        ContactController,
        PowerBiController,
        ProjectWorkspacesController,
        ProjectsController,
        CardsController,
        TenantsController,
        UsersController,
        TicketsController,
        ExpensesController,
        ExpenseCategoriesController,
        ExpenseSubcategoriesController,
        ExpenseSeriesController,
        AiAgentController,
      ],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: jwtSecret })],
        }),
        JwtModule.register({ secret: jwtSecret }),
      ],
      providers: [
        {
          provide: AppService,
          useValue: { getHealth: vi.fn().mockResolvedValue(healthExample) },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
            refresh: vi.fn(),
            requestPasswordRecovery: vi.fn(),
            resetPassword: vi.fn(),
            updateSessionTenant: vi.fn(),
            verifyPasswordRecovery: vi.fn(),
          },
        },
        {
          provide: ContactService,
          useValue: { send: vi.fn() },
        },
        {
          provide: TenantsService,
          useValue: {
            create: vi.fn(),
            listAll: vi.fn(),
            listForActor: vi.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { create: vi.fn() },
        },
        {
          provide: PowerBiService,
          useValue: {
            createEmbedToken: vi.fn(),
            listCatalog: vi.fn(),
            listMyReports: vi.fn(),
            listWorkspaces: vi.fn(),
          },
        },
        {
          provide: ProjectsService,
          useValue: { listWorkspaces: vi.fn() },
        },
        {
          provide: TicketsService,
          useValue: {
            create: vi.fn(),
            createComment: vi.fn(),
            get: vi.fn(),
            list: vi.fn(),
            markRead: vi.fn(),
            updateStatus: vi.fn(),
          },
        },
        { provide: ExpensesService, useValue: {} },
        { provide: AiConversationsService, useValue: {} },
        { provide: AiAttachmentsService, useValue: {} },
        { provide: AiStreamService, useValue: {} },
        AccessTokenGuard,
        { provide: getRepositoryToken(User), useValue: { findOne: vi.fn() } },
      ],
    })
      .overrideGuard(AdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdministradorOrCreateUserGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SelfOrAdministradorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UsersListGuard)
      .useValue({ canActivate: () => true })
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
    app.use(cookieParser());
    setupSwagger(app);
    jwt = app.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated Swagger UI and OpenAPI document requests', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(401);
    await request(app.getHttpServer()).get('/api/docs-json').expect(401);
  });

  it('serves Swagger UI and the OpenAPI document for an access cookie', async () => {
    const accessToken = await jwt.signAsync({
      profile: 'Administrador',
      sessionId: '33333333-3333-3333-3333-333333333333',
      sub: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      type: 'access',
    });

    const ui = await request(app.getHttpServer())
      .get('/api/docs')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);
    const document = await request(app.getHttpServer())
      .get('/api/docs-json')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    expect(ui.text).toContain('swagger');
    expect(document.body.paths['/api/v1']).toBeDefined();
    expect(document.body.paths['/api/v1/contact']).toBeDefined();
    expect(document.body.paths['/api/v1/auth/login']).toBeDefined();
    expect(
      document.body.paths['/api/v1/auth/login'].post.responses['200'].content[
        'application/json'
      ].schema.oneOf,
    ).toEqual(
      expect.arrayContaining([
        { $ref: '#/components/schemas/MfaChallengeResponseDto' },
        { $ref: '#/components/schemas/LoginSessionResponseDto' },
      ]),
    );
    expect(
      document.body.components.schemas.MfaChallengeResponseDto.properties
        .mfaRequired,
    ).toBeDefined();
    expect(
      document.body.paths['/api/v1/auth/login'].post.responses['503'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/admin/tenant-settings']).toBeDefined();
    expect(
      document.body.paths['/api/v1/admin/tenant-settings/{tenantId}'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/auth/mfa/verify']).toBeDefined();
    expect(document.body.paths['/api/v1/auth/mfa/resend']).toBeDefined();
    expect(document.body.paths['/api/v1/auth/mfa/cancel']).toBeDefined();
    expect(
      document.body.paths['/api/v1/auth/mfa/cancel'].post.responses['204'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/users/{id}/reactivate']).toBeDefined();
    expect(
      document.body.paths['/api/v1/users/{id}/password-reset-link'].post
        .responses['204'],
    ).toBeDefined();
    expect(
      document.body.paths['/api/v1/users/{id}/password-reset-link'].post
        .responses['503'],
    ).toBeDefined();
    expect(
      document.body.components.schemas.EditUserDto.properties.status,
    ).toBeDefined();
    expect(
      document.body.components.schemas.UpdateUserDto.properties.tenantId,
    ).toBeDefined();
    expect(
      document.body.paths['/api/v1/users/{id}'].get.responses['200'].content[
        'application/json'
      ].schema.$ref,
    ).toBe('#/components/schemas/EditUserDto');
    expect(
      document.body.components.schemas.SafeUserDto.properties.status,
    ).toBeUndefined();
    expect(document.body.paths['/api/v1/tenants']).toBeDefined();
    expect(document.body.paths['/api/v1/tenants'].post).toBeDefined();
    expect(document.body.paths['/api/v1/tenants/{id}/photo']).toBeDefined();
    expect(document.body.paths['/api/v1/tenants/{id}/photo'].put).toBeDefined();
    expect(document.body.paths['/api/v1/tenants/{id}/photo'].get).toBeDefined();
    expect(
      document.body.paths['/api/v1/tenants/{id}/photo'].delete,
    ).toBeDefined();
    expect(
      document.body.components.schemas.SafeUserDto.properties.tenantPhotoUrl,
    ).toBeDefined();
    expect(document.body.paths['/api/v1/users']).toBeDefined();
    expect(document.body.paths['/api/v1/users/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/users/{id}/photo']).toBeDefined();
    expect(document.body.paths['/api/v1/powerbi/workspaces']).toBeDefined();
    expect(
      document.body.paths['/api/v1/powerbi/meus-relatorios'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/project-workspaces']).toBeDefined();
    expect(document.body.paths['/api/v1/projects/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/cards/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/cards/{id}/move']).toBeDefined();
    expect(document.body.paths['/api/v1/cards/{id}/place']).toBeDefined();
    expect(
      document.body.paths['/api/v1/cards/{id}/attachments/{attachmentId}'],
    ).toBeDefined();
    expect(
      document.body.paths['/api/v1/projects/{id}/documents'],
    ).toBeDefined();
    expect(
      document.body.paths['/api/v1/projects/{id}/background'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/tickets']).toBeDefined();
    expect(document.body.paths['/api/v1/tickets/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/tickets/{id}/comments']).toBeDefined();
    expect(document.body.paths['/api/v1/tickets/{id}/read']).toBeDefined();
    expect(document.body.paths['/api/v1/tickets/{id}/attachments']).toBeDefined();
    expect(
      document.body.paths['/api/v1/tickets/{id}/attachments/{attachmentId}'],
    ).toBeDefined();
    expect(document.body.paths['/api/v1/expenses']).toBeDefined();
    expect(document.body.paths['/api/v1/expenses/associations']).toBeDefined();
    expect(document.body.paths['/api/v1/expenses/cancel']).toBeDefined();
    expect(document.body.paths['/api/v1/expenses/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/expenses/{id}/documents/{documentId}']).toBeDefined();
    expect(document.body.paths['/api/v1/expense-categories']).toBeDefined();
    expect(document.body.paths['/api/v1/expense-categories/{id}/subcategories']).toBeDefined();
    expect(document.body.paths['/api/v1/expense-subcategories/{id}']).toBeDefined();
    expect(document.body.paths['/api/v1/expense-series/{id}/cancel']).toBeDefined();
    expect(document.body.paths['/api/v1/ai/conversations']).toBeDefined();
    expect(document.body.paths['/api/v1/ai/runs/{runId}/events']).toBeDefined();
    expect(JSON.stringify(document.body)).toContain('ana@example.com');
    expect(JSON.stringify(document.body)).toContain('user@example.com');
    expect(JSON.stringify(document.body)).not.toContain('vetor.tech');
  });
});
