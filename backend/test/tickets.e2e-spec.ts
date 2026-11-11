import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:net';
import request from 'supertest';
import { FindOperator } from 'typeorm';
import { MailService } from '../src/modules/mail/mail.service.js';
import { AccessTokenGuard } from '../src/modules/portal/access-token.guard.js';
import { Tenant } from '../src/modules/portal/entities/tenant.entity.js';
import { User } from '../src/modules/portal/entities/user.entity.js';
import { TenantStorageService } from '../src/modules/portal/tenant-storage.service.js';
import { TicketAttachment } from '../src/modules/tickets/entities/ticket-attachment.entity.js';
import { TicketComment } from '../src/modules/tickets/entities/ticket-comment.entity.js';
import { TicketReadState } from '../src/modules/tickets/entities/ticket-read-state.entity.js';
import { Ticket } from '../src/modules/tickets/entities/ticket.entity.js';
import { TicketsController } from '../src/modules/tickets/tickets.controller.js';
import { TicketsService } from '../src/modules/tickets/tickets.service.js';

const secret = 'tickets-e2e-secret';
const tenantA = '22222222-2222-4222-8222-222222222222';
const tenantB = '33333333-3333-4333-8333-333333333333';
const clientId = '11111111-1111-4111-8111-111111111111';
const otherId = '44444444-4444-4444-8444-444444444444';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const vetorId = '55555555-5555-4555-8555-555555555555';

class MemoryRepository<T extends { id: string }> {
  rows: T[] = [];

  create(value: Partial<T>): T {
    return { ...value } as T;
  }

  async save(entity: T): Promise<T> {
    const now = new Date();
    const record = entity as T & { createdAt?: Date; updatedAt?: Date };

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

  async findOne(options: {
    where: Record<string, unknown>;
  }): Promise<T | null> {
    return this.rows.find((row) => matches(row, options.where)) ?? null;
  }

  async find(options: { where: Record<string, unknown> }): Promise<T[]> {
    return this.rows.filter((row) => matches(row, options.where));
  }

  async count(options: { where: Record<string, unknown> }): Promise<number> {
    return (await this.find(options)).length;
  }

  async delete(criteria: { id: string }): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== criteria.id);
  }

  async findAndCount(options: {
    order?: Record<string, 'ASC' | 'DESC'>;
    skip?: number;
    take?: number;
    where: Record<string, unknown>;
  }): Promise<[T[], number]> {
    const rows = this.rows.filter((row) => matches(row, options.where));
    return [
      rows.slice(
        options.skip ?? 0,
        (options.skip ?? 0) + (options.take ?? rows.length),
      ),
      rows.length,
    ];
  }
}

function matches(row: object, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = (row as Record<string, unknown>)[key];

    if (expected instanceof FindOperator) {
      return (
        expected.type === 'in' && (expected.value as unknown[]).includes(actual)
      );
    }

    return actual === expected;
  });
}

function user(id: string, tenantId: string, profile: string): User {
  return Object.assign(new User(), {
    email: `${id}@example.com`,
    firstName: 'Ada',
    id,
    lastName: 'Lovelace',
    profile,
    status: 'active',
    tenantId,
  });
}

describe('Tickets API (e2e)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const tickets = new MemoryRepository<Ticket>();
  const comments = new MemoryRepository<TicketComment>();
  const reads = new MemoryRepository<TicketReadState>();
  const users = new MemoryRepository<User>();
  const tenants = new MemoryRepository<Tenant>();
  const attachments = new MemoryRepository<TicketAttachment>();
  const storedFiles = new Map<string, Buffer>();
  const mail = { sendTicketNotice: vi.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    tickets.rows = [];
    comments.rows = [];
    reads.rows = [];
    attachments.rows = [];
    storedFiles.clear();
    users.rows = [
      user(clientId, tenantA, 'Usuario'),
      user(otherId, tenantB, 'AdministradorTenant'),
      user(adminId, tenantA, 'Administrador'),
    ];
    tenants.rows = [
      Object.assign(new Tenant(), {
        email: 'acme@example.com',
        id: tenantA,
        name: 'Acme',
      }),
      Object.assign(new Tenant(), {
        email: 'north@example.com',
        id: tenantB,
        name: 'North',
        slug: 'north',
      }),
      Object.assign(new Tenant(), {
        email: 'ops@example.com',
        id: vetorId,
        name: 'VETOR',
        slug: 'vetor',
      }),
    ];
    mail.sendTicketNotice.mockReset().mockResolvedValue(undefined);
    const moduleFixture = await Test.createTestingModule({
      controllers: [TicketsController],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              CORS: 'http://localhost:3000',
              JWT_SECRET: secret,
            }),
          ],
        }),
        JwtModule.register({ secret }),
      ],
      providers: [
        AccessTokenGuard,
        TicketsService,
        { provide: MailService, useValue: mail },
        { provide: getRepositoryToken(Ticket), useValue: tickets },
        { provide: getRepositoryToken(TicketComment), useValue: comments },
        { provide: getRepositoryToken(TicketReadState), useValue: reads },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Tenant), useValue: tenants },
        {
          provide: getRepositoryToken(TicketAttachment),
          useValue: attachments,
        },
        {
          provide: TenantStorageService,
          useValue: {
            readTenantFile: vi.fn(async (_tenantId: string, pointer: string) => {
              const bytes = storedFiles.get(pointer);

              if (!bytes) {
                throw new Error('missing');
              }

              return bytes;
            }),
            writeTenantFile: vi.fn(
              async (_tenantId: string, pointer: string, bytes: Buffer) => {
                storedFiles.set(pointer, Buffer.from(bytes));
              },
            ),
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
    profile: string,
    tenantId: string,
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

  it('rejects unauthenticated and invalid ticket requests', async () => {
    await request(app.getHttpServer()).get('/api/v1/tickets').expect(401);
    const client = await cookie(clientId, 'Usuario', tenantA);

    await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Cookie', client)
      .send({
        category: 'duvida',
        description: 'curta',
        tenantId: tenantB,
        title: 'ab',
      })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/tickets/not-a-uuid')
      .set('Cookie', client)
      .expect(400);
    await request(app.getHttpServer())
      .delete(`/api/v1/tickets/${randomUUID()}`)
      .set('Cookie', client)
      .expect(404);
  });

  it('keeps ticket data inside the caller tenant and blocks client status writes', async () => {
    const client = await cookie(clientId, 'Usuario', tenantA);
    const other = await cookie(otherId, 'AdministradorTenant', tenantB);
    const admin = await cookie(adminId, 'Administrador', tenantB);
    const created = await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Cookie', client)
      .send({
        category: 'suporte_tecnico',
        description: 'O relatório não abre no portal.',
        openedById: otherId,
        status: 'resolvido',
        title: 'Relatório indisponível',
      })
      .expect(400);

    const ticket = await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Cookie', client)
      .send({
        category: 'suporte_tecnico',
        description: 'O relatório não abre no portal.',
        title: 'Relatório indisponível',
      })
      .expect(201);

    expect(created.body.message).toEqual(
      expect.arrayContaining([
        'property openedById should not exist',
        'property status should not exist',
      ]),
    );
    expect(ticket.body.message).toBe('Operação realizada com sucesso.');
    expect(ticket.body.ticket.status).toBe('aberto');
    expect(ticket.body.ticket.tenantId).toBe(tenantA);
    expect(ticket.body.ticket.openedById).toBe(clientId);
    expect(ticket.body.ticket.passwordHash).toBeUndefined();
    await request(app.getHttpServer())
      .get(`/api/v1/tickets/${ticket.body.ticket.id}`)
      .set('Cookie', admin)
      .expect(403);
    const desk = await cookie(adminId, 'Administrador', vetorId);
    const listed = await request(app.getHttpServer())
      .get('/api/v1/tickets')
      .set('Cookie', desk)
      .expect(200);
    expect(listed.body.items.map((item: { id: string }) => item.id)).toContain(
      ticket.body.ticket.id,
    );
    expect(listed.body.items[0].tenantName).toBe('Acme');
    await request(app.getHttpServer())
      .get('/api/v1/tickets')
      .query({ tenantId: 'acme' })
      .set('Cookie', desk)
      .expect(400);
    const filtered = await request(app.getHttpServer())
      .get('/api/v1/tickets')
      .query({ tenantId: tenantA })
      .set('Cookie', desk)
      .expect(200);
    expect(filtered.body.items.map((item: { id: string }) => item.id)).toEqual([
      ticket.body.ticket.id,
    ]);
    await request(app.getHttpServer())
      .get('/api/v1/tickets')
      .query({ tenantId: tenantB })
      .set('Cookie', client)
      .expect(403);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(mail.sendTicketNotice).toHaveBeenCalledWith(
      ['acme@example.com'],
      'Novo chamado',
      ticket.body.ticket.id,
      `http://localhost:3000/portal/chamados/${ticket.body.ticket.id}`,
    );

    await request(app.getHttpServer())
      .get(`/api/v1/tickets/${ticket.body.ticket.id}`)
      .set('Cookie', other)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/v1/tickets/${randomUUID()}`)
      .set('Cookie', client)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/tickets/${ticket.body.ticket.id}`)
      .set('Cookie', client)
      .send({ status: 'resolvido' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Cookie', admin)
      .send({
        category: 'outros',
        description: 'A empresa não abre chamado.',
        title: 'Abertura interna',
      })
      .expect(403);

    const comment = await request(app.getHttpServer())
      .post(`/api/v1/tickets/${ticket.body.ticket.id}/comments`)
      .set('Cookie', client)
      .send({ body: 'Mais detalhes do relatório.' })
      .expect(201);
    expect(comment.body.comment.authorId).toBe(clientId);

    await request(app.getHttpServer())
      .patch(
        `/api/v1/tickets/${ticket.body.ticket.id}/comments/${comment.body.comment.id}`,
      )
      .set('Cookie', client)
      .send({ body: 'editado' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/tickets/${ticket.body.ticket.id}/read`)
      .set('Cookie', client)
      .send({ lastSeenAt: '2026-10-26T00:00:00.000Z' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/tickets/${ticket.body.ticket.id}/read`)
      .set('Cookie', client)
      .send({})
      .expect(204);

    const seen = await request(app.getHttpServer())
      .get(`/api/v1/tickets/${ticket.body.ticket.id}`)
      .set('Cookie', client)
      .expect(200);
    expect(seen.body.hasNewComments).toBe(false);
    expect(seen.body.comments[0].body).toBe('Mais detalhes do relatório.');
    expect(seen.body.priority).toBe('low');
    expect(seen.body.attachments).toEqual([]);
  });

  it('accepts a pasted image and hides it from another tenant', async () => {
    const client = await cookie(clientId, 'Usuario', tenantA);
    const other = await cookie(otherId, 'AdministradorTenant', tenantB);
    const created = await request(app.getHttpServer())
      .post('/api/v1/tickets')
      .set('Cookie', client)
      .send({
        category: 'duvida',
        description: 'Preciso de ajuda com o acesso.',
        priority: 'medium',
        title: 'Acesso ao portal',
      })
      .expect(201);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

    expect(created.body.ticket.priority).toBe('medium');

    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/tickets/${created.body.ticket.id}/attachments`)
      .set('Cookie', client)
      .attach('file', jpeg, {
        contentType: 'image/jpeg',
        filename: 'captura.jpg',
      })
      .expect(201);

    expect(uploaded.body.originalName).toBe('captura.jpg');
    expect(uploaded.body.filename).toBeUndefined();
    expect(uploaded.body.url).toBe(
      `/api/v1/tickets/${created.body.ticket.id}/attachments/${uploaded.body.id}`,
    );

    const downloaded = await request(app.getHttpServer())
      .get(uploaded.body.url)
      .set('Cookie', client)
      .expect(200);
    expect(downloaded.headers['content-type']).toMatch(/image\/jpeg/);
    expect(downloaded.body.equals(jpeg)).toBe(true);

    await request(app.getHttpServer())
      .get(uploaded.body.url)
      .set('Cookie', other)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/tickets/${created.body.ticket.id}/attachments`)
      .set('Cookie', client)
      .attach('file', Buffer.from('not-an-image'), {
        contentType: 'image/png',
        filename: 'nota.png',
      })
      .expect(400);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/tickets/${created.body.ticket.id}`)
      .set('Cookie', client)
      .expect(200);
    expect(detail.body.attachments).toEqual([
      expect.objectContaining({ id: uploaded.body.id, originalName: 'captura.jpg' }),
    ]);
    expect(JSON.stringify(detail.body)).not.toContain('captura.jpg.jpg');
  });
});
