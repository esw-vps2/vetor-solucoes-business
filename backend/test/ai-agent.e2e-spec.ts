import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:net';
import request from 'supertest';
import { RateLimitGuard } from '../src/common/security/rate-limit.guard.js';
import { AiAgentController } from '../src/modules/ai-agent/ai-agent.controller.js';
import { AI_STORE } from '../src/modules/ai-agent/ai-agent.constants.js';
import { AiConversationsService } from '../src/modules/ai-agent/ai-conversations.service.js';
import { AiEventBus } from '../src/modules/ai-agent/ai-event-bus.js';
import { AiStreamService } from '../src/modules/ai-agent/ai-stream.service.js';
import { AiAttachmentsService } from '../src/modules/ai-agent/ai-attachments.service.js';
import { MemoryAiStore } from '../src/modules/ai-agent/memory-ai-store.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { Tenant } from '../src/modules/portal/entities/tenant.entity.js';
import { User } from '../src/modules/portal/entities/user.entity.js';

process.env.NODE_ENV = 'test';

const secret = 'ai-agent-e2e-secret';
const tenantA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tenantB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const blocked = '44444444-4444-4444-8444-444444444444';

class MemoryUsers {
  rows: User[] = [];

  async findOne(options: {
    where: { id: string; status: string };
  }): Promise<User | null> {
    return (
      this.rows.find(
        (row) =>
          row.id === options.where.id && row.status === options.where.status,
      ) ?? null
    );
  }
}

describe('AI agent API (e2e)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const users = new MemoryUsers();
  const store = new MemoryAiStore();

  beforeEach(async () => {
    users.rows = [
      Object.assign(new User(), {
        id: userA,
        status: 'active',
        tenantId: tenantA,
      }),
      Object.assign(new User(), {
        id: userB,
        status: 'active',
        tenantId: tenantB,
      }),
      Object.assign(new User(), {
        id: blocked,
        status: 'active',
        tenantId: tenantA,
      }),
    ];
    store.actors = [
      {
        enabledActions: ['vetorAgent'],
        id: userA,
        profile: 'Usuario',
        status: 'active',
        tenantId: tenantA,
      },
      {
        enabledActions: ['vetorAgent'],
        id: userB,
        profile: 'Usuario',
        status: 'active',
        tenantId: tenantB,
      },
      {
        enabledActions: [],
        id: blocked,
        profile: 'Usuario',
        status: 'active',
        tenantId: tenantA,
      },
    ];
    store.tenants = [{ id: tenantA }, { id: tenantB }];
    store.conversations = [];
    store.messages = [];
    store.runs = [];
    store.outbox = [];

    const moduleFixture = await Test.createTestingModule({
      controllers: [AiAgentController],
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              AI_CONVERSATION_RATE_LIMIT_MAX: '4',
              AI_CONVERSATION_RATE_LIMIT_WINDOW: '15m',
              AI_MESSAGE_RATE_LIMIT_MAX: '3',
              AI_MESSAGE_RATE_LIMIT_WINDOW: '15m',
              JWT_SECRET: secret,
            }),
          ],
        }),
        JwtModule.register({ secret }),
      ],
      providers: [
        AccessTokenGuard,
        AiConversationsService,
        AiStreamService,
        AiEventBus,
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: AI_STORE, useValue: store },
        { provide: getRepositoryToken(User), useValue: users },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            find: async () => [{ aiTokenCostPerMillion: '1', id: tenantA }],
            findOne: async () => ({ aiTokenCostPerMillion: '1', id: tenantA }),
          },
        },
        {
          provide: AiAttachmentsService,
          useValue: {
            bindToMessage: async () => undefined,
            deleteForConversation: async () => undefined,
            listBoundByMessage: async () => [],
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    jwt = app.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  async function cookie(
    id: string,
    tenantId: string,
    profile = 'Usuario',
  ): Promise<string> {
    const token = await jwt.signAsync({
      profile,
      sessionId: '55555555-5555-4555-8555-555555555555',
      sub: id,
      tenantId,
      type: 'access',
    });

    return `access_token=${token}`;
  }

  it('requires the owner permission and returns 202 without tenant data', async () => {
    const server = app.getHttpServer();
    await request(server).post('/api/v1/ai/conversations').send({}).expect(401);
    const owner = await cookie(userA, tenantA);
    const other = await cookie(userB, tenantB);
    const denied = await cookie(blocked, tenantA);

    await request(server)
      .post('/api/v1/ai/conversations')
      .set('Cookie', denied)
      .send({})
      .expect(403);
    await request(server)
      .post('/api/v1/ai/conversations')
      .set('Cookie', owner)
      .send({ tenantId: tenantB })
      .expect(400);

    const created = await request(server)
      .post('/api/v1/ai/conversations')
      .set('Cookie', owner)
      .send({})
      .expect(201);
    expect(created.body.id).toEqual(expect.any(String));
    expect(JSON.stringify(created.body)).not.toContain(tenantA);

    const queued = await request(server)
      .post(`/api/v1/ai/conversations/${created.body.id}/messages`)
      .set('Cookie', owner)
      .set('Idempotency-Key', 'run-key')
      .send({ content: '  Olá agente  ' })
      .expect(202);
    expect(queued.body).toMatchObject({
      conversationId: created.body.id,
      status: 'QUEUED',
    });
    expect(JSON.stringify(queued.body)).not.toContain(tenantA);
    expect(store.messages[0].content).toBe('Olá agente');

    const replay = await request(server)
      .post(`/api/v1/ai/conversations/${created.body.id}/messages`)
      .set('Cookie', owner)
      .set('Idempotency-Key', 'run-key')
      .send({ content: 'Olá agente' })
      .expect(202);
    expect(replay.body.runId).toBe(queued.body.runId);

    await request(server)
      .post(`/api/v1/ai/conversations/${created.body.id}/messages`)
      .set('Cookie', owner)
      .send({ content: 'outra' })
      .expect(409);
    await request(server)
      .post(`/api/v1/ai/conversations/${created.body.id}/messages`)
      .set('Cookie', owner)
      .send({ content: 'limite' })
      .expect(429);
    await request(server)
      .get(`/api/v1/ai/conversations/${created.body.id}/messages`)
      .set('Cookie', other)
      .expect(404);
    await request(server)
      .get(`/api/v1/ai/runs/${queued.body.runId}`)
      .set('Cookie', other)
      .expect(404);
    await request(server)
      .get(`/api/v1/ai/runs/${queued.body.runId}/events`)
      .set('Cookie', other)
      .expect(404);
    await request(server)
      .get(`/api/v1/ai/runs/${queued.body.runId}/events`)
      .expect(401);

    store.runs[0].status = 'SUCCEEDED';
    store.runs[0].assistantMessageId = '99999999-9999-4999-8999-999999999999';
    store.messages.push({
      authorUserId: null,
      content: 'resposta final',
      conversationId: created.body.id,
      createdAt: new Date(),
      id: '99999999-9999-4999-8999-999999999999',
      role: 'assistant',
      runId: queued.body.runId,
      sequence: 2,
      tenantId: tenantA,
      updatedAt: new Date(),
    });

    const events = await request(server)
      .get(`/api/v1/ai/runs/${queued.body.runId}/events`)
      .set('Cookie', owner)
      .expect(200);
    expect(events.headers['content-type']).toContain('text/event-stream');
    expect(events.text).toContain('resposta final');
    expect(events.text).not.toContain(tenantA);
  });

  it('rate-limits conversation creation separately from messages', async () => {
    const server = app.getHttpServer();
    const owner = await cookie(userA, tenantA);

    for (let index = 0; index < 4; index += 1) {
      await request(server)
        .post('/api/v1/ai/conversations')
        .set('Cookie', owner)
        .send({})
        .expect(201);
    }

    await request(server)
      .post('/api/v1/ai/conversations')
      .set('Cookie', owner)
      .send({})
      .expect(429);
  });
});
