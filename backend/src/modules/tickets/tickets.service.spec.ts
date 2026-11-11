import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { FindOperator } from 'typeorm';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { User } from '../portal/entities/user.entity.js';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import { TicketAttachment } from './entities/ticket-attachment.entity.js';
import { TicketComment } from './entities/ticket-comment.entity.js';
import { TicketReadState } from './entities/ticket-read-state.entity.js';
import { Ticket } from './entities/ticket.entity.js';
import { TicketsService } from './tickets.service.js';

const tenantA = '22222222-2222-4222-8222-222222222222';
const tenantB = '33333333-3333-4333-8333-333333333333';
const clientId = '11111111-1111-4111-8111-111111111111';
const otherClientId = '44444444-4444-4444-8444-444444444444';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const vetorId = '55555555-5555-4555-8555-555555555555';

class MemoryRepository<T extends { id: string }> {
  rows: T[] = [];

  create(value: Partial<T>): T {
    return { ...value } as T;
  }

  async save(entity: T): Promise<T> {
    const now = new Date();

    if (!entity.id) {
      entity.id = randomUUID();
    }

    const record = entity as T & { createdAt?: Date; updatedAt?: Date };

    if (!record.createdAt) {
      record.createdAt = now;
    }

    record.updatedAt = now;
    const index = this.rows.findIndex((row) => row.id === entity.id);

    if (index >= 0) {
      this.rows[index] = entity;
    } else {
      this.rows.push(entity);
    }

    return entity;
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
    const rows = this.rows
      .filter((row) => matches(row, options.where))
      .toSorted((left, right) => compare(left, right, options.order));
    const skip = options.skip ?? 0;
    const take = options.take ?? rows.length;

    return [rows.slice(skip, skip + take), rows.length];
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

function compare(
  left: object,
  right: object,
  order: Record<string, 'ASC' | 'DESC'> | undefined,
): number {
  for (const [key, direction] of Object.entries(order ?? {})) {
    const leftValue = (left as Record<string, Date | string>)[key];
    const rightValue = (right as Record<string, Date | string>)[key];
    const leftTime =
      leftValue instanceof Date ? leftValue.getTime() : String(leftValue);
    const rightTime =
      rightValue instanceof Date ? rightValue.getTime() : String(rightValue);

    if (leftTime === rightTime) {
      continue;
    }

    const result = leftTime > rightTime ? 1 : -1;
    return direction === 'DESC' ? -result : result;
  }

  return 0;
}

function finishNotices(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

function actor(
  id: string,
  profile: string,
  tenantId: string,
): AuthenticatedUser {
  return { id, profile, sessionId: randomUUID(), tenantId };
}

function person(
  id: string,
  tenantId: string,
  profile: string,
  email: string,
): User {
  return Object.assign(new User(), {
    email,
    firstName: profile,
    id,
    lastName: 'User',
    profile,
    status: 'active',
    tenantId,
  });
}

describe('TicketsService', () => {
  const tickets = new MemoryRepository<Ticket>();
  const comments = new MemoryRepository<TicketComment>();
  const reads = new MemoryRepository<TicketReadState>();
  const attachments = new MemoryRepository<TicketAttachment>();
  const users = new MemoryRepository<User>();
  const tenants = new MemoryRepository<Tenant>();
  const storedFiles = new Map<string, Buffer>();
  const storage = {
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
  };
  const mail = { sendTicketNotice: vi.fn().mockResolvedValue(undefined) };
  const config = {
    get: vi.fn((key: string, fallback?: string) => {
      if (key === 'CORS') {
        return 'http://localhost:3000,http://other.example';
      }

      return fallback;
    }),
  };
  const service = new TicketsService(
    tickets as never,
    comments as never,
    reads as never,
    users as never,
    tenants as never,
    attachments as never,
    storage as never,
    mail as never,
    config as never,
  );

  const loggerError = vi
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);

  afterAll(() => {
    loggerError.mockRestore();
  });

  beforeEach(() => {
    loggerError.mockClear();
    tickets.rows = [];
    comments.rows = [];
    reads.rows = [];
    attachments.rows = [];
    storedFiles.clear();
    users.rows = [
      person(clientId, tenantA, 'Usuario', 'ana@example.com'),
      person(otherClientId, tenantB, 'AdministradorTenant', 'bia@example.com'),
      person(adminId, tenantA, 'Administrador', 'admin@example.com'),
      person(randomUUID(), tenantA, 'Usuario', 'ana@example.com'),
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
      }),
    ];
    mail.sendTicketNotice.mockReset().mockResolvedValue(undefined);
  });

  it('creates a client ticket in the user tenant and notifies the company', async () => {
    const created = await service.create(actor(clientId, 'Usuario', tenantB), {
      category: 'duvida',
      description: 'Preciso de ajuda com o acesso.',
      title: 'Acesso ao portal',
    });

    expect(created.message).toBe('Operação realizada com sucesso.');
    expect(created.ticket.status).toBe('aberto');
    expect(created.ticket.tenantId).toBe(tenantA);
    expect(created.ticket.openedById).toBe(clientId);
    expect(created.ticket.description).toBe('Preciso de ajuda com o acesso.');
    await finishNotices();
    expect(mail.sendTicketNotice).toHaveBeenCalledWith(
      ['acme@example.com'],
      'Novo chamado',
      created.ticket.id,
      `http://localhost:3000/portal/chamados/${created.ticket.id}`,
    );
  });

  it('rejects ticket creation from the company profile', async () => {
    await expect(
      service.create(actor(adminId, 'Administrador', tenantA), {
        category: 'outros',
        description: 'A empresa não abre chamado.',
        title: 'Abertura interna',
      }),
    ).rejects.toThrow('Access denied.');
    expect(tickets.rows).toHaveLength(0);
  });

  it('keeps the ticket when the tenant contact email is missing', async () => {
    tenants.rows[0].email = '   ';

    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'duvida',
      description: 'A tenant ainda não tem e-mail de contato.',
      title: 'Sem contato',
    });

    expect(created.message).toBe('Operação realizada com sucesso.');
    await finishNotices();
    expect(tickets.rows).toHaveLength(1);
    expect(mail.sendTicketNotice).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith('Ticket notification failed.');
  });

  it('returns the saved ticket before notification delivery finishes', async () => {
    let settle: (error?: Error) => void = () => undefined;
    mail.sendTicketNotice.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          settle = (error?: Error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          };
        }),
    );

    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'erro_falha',
      description: 'A tela de login falhou hoje.',
      title: 'Falha no login',
    });

    expect(created.message).toBe('Operação realizada com sucesso.');
    expect(tickets.rows).toHaveLength(1);
    expect(mail.sendTicketNotice).toHaveBeenCalled();
    settle(new Error('smtp down'));
    await finishNotices();
    expect(loggerError).toHaveBeenCalledWith('Ticket notification failed.');
  });

  it('isolates list, detail, comments, and read state by tenant', async () => {
    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'melhoria',
      description: 'Quero um filtro adicional na lista.',
      title: 'Filtro da lista',
    });
    tickets.rows[0].updatedAt = new Date('2026-10-26T12:00:00.000Z');
    const older = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'outros',
      description: 'Registro anterior para ordenação.',
      title: 'Registro anterior',
    });
    tickets.rows[1].updatedAt = new Date('2026-10-25T12:00:00.000Z');

    const listed = await service.list(actor(clientId, 'Usuario', tenantB), {
      category: 'melhoria',
    });
    const ordered = await service.list(actor(clientId, 'Usuario', tenantA), {});
    expect(listed.total).toBe(1);
    expect(listed.items[0].id).toBe(created.ticket.id);
    expect(listed.items[0].hasNewComments).toBe(false);
    expect(ordered.items.map((item) => item.id)).toEqual([
      created.ticket.id,
      older.ticket.id,
    ]);

    await expect(
      service.get(
        actor(otherClientId, 'AdministradorTenant', tenantB),
        created.ticket.id,
      ),
    ).rejects.toThrow('Access denied.');
    await expect(
      service.get(actor(clientId, 'Usuario', tenantA), randomUUID()),
    ).rejects.toThrow('Not found.');

    const comment = await service.createComment(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
      { body: 'Segue o detalhe do pedido.' },
    );
    expect(comment.comment.authorId).toBe(clientId);
    await finishNotices();
    expect(mail.sendTicketNotice).toHaveBeenCalledWith(
      ['acme@example.com'],
      'Novo comentário do cliente',
      created.ticket.id,
      expect.stringContaining(created.ticket.id),
    );

    const detail = await service.get(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
    );
    expect(detail.comments[0].body).toBe('Segue o detalhe do pedido.');
    expect(detail.hasNewComments).toBe(true);
    expect(detail.tenant.displayName).toBe('Acme');

    const updatedAt = tickets.rows.find(
      (row) => row.id === created.ticket.id,
    )?.updatedAt;
    await service.markRead(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
    );
    const seen = await service.get(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
    );
    expect(seen.hasNewComments).toBe(false);
    expect(
      tickets.rows.find((row) => row.id === created.ticket.id)?.updatedAt,
    ).toEqual(updatedAt);
  });

  it('attends every tenant ticket from the VETOR session', async () => {
    tenants.rows.push(
      Object.assign(new Tenant(), {
        email: 'ops@example.com',
        id: vetorId,
        name: 'VETOR',
        slug: 'vetor',
      }),
    );
    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'suporte_tecnico',
      description: 'O cliente precisa de atendimento da VETOR.',
      title: 'Atendimento VETOR',
    });

    await expect(
      service.get(actor(adminId, 'Administrador', tenantB), created.ticket.id),
    ).rejects.toThrow('Access denied.');

    const listed = await service.list(
      actor(adminId, 'Administrador', vetorId),
      {},
    );
    expect(listed.items.map((item) => item.id)).toContain(created.ticket.id);
    expect(
      listed.items.find((item) => item.id === created.ticket.id)?.tenantName,
    ).toBe('Acme');

    const north = await service.create(
      actor(otherClientId, 'AdministradorTenant', tenantB),
      {
        category: 'outros',
        description: 'O cliente da North também precisa de atendimento.',
        title: 'Atendimento North',
      },
    );
    const filtered = await service.list(
      actor(adminId, 'Administrador', vetorId),
      { tenantId: tenantA },
    );
    expect(filtered.items.map((item) => item.id)).toEqual([created.ticket.id]);
    await expect(
      service.list(actor(clientId, 'Usuario', tenantA), { tenantId: tenantB }),
    ).rejects.toThrow('Access denied.');
    const ownTenant = await service.list(actor(clientId, 'Usuario', tenantA), {
      tenantId: tenantA,
    });
    expect(ownTenant.items.map((item) => item.id)).toEqual([created.ticket.id]);
    expect(ownTenant.items.map((item) => item.id)).not.toContain(
      north.ticket.id,
    );

    const changed = await service.updateStatus(
      actor(adminId, 'Administrador', vetorId),
      created.ticket.id,
      { status: 'em_andamento' },
    );
    expect(changed.ticket.status).toBe('em_andamento');
    expect(changed.ticket.tenantName).toBe('Acme');
  });

  it('lets the company use the session tenant for status and tenant-wide mail', async () => {
    const created = await service.create(
      actor(otherClientId, 'AdministradorTenant', tenantB),
      {
        category: 'financeiro_cobranca',
        description: 'A cobrança deste mês está divergente.',
        title: 'Cobrança divergente',
      },
    );
    users.rows.push(
      person(randomUUID(), tenantB, 'Usuario', 'bia@example.com'),
    );

    await expect(
      service.list(actor(adminId, 'Administrador', tenantA), {}),
    ).resolves.toMatchObject({ total: 0 });
    const visible = await service.list(
      actor(adminId, 'Administrador', tenantB),
      {
        status: 'aberto',
      },
    );
    expect(visible.items.map((item) => item.id)).toEqual([created.ticket.id]);

    await expect(
      service.updateStatus(
        actor(otherClientId, 'AdministradorTenant', tenantB),
        created.ticket.id,
        {
          status: 'resolvido',
        },
      ),
    ).rejects.toThrow('Access denied.');

    const unchanged = await service.updateStatus(
      actor(adminId, 'Administrador', tenantB),
      created.ticket.id,
      { status: 'aberto' },
    );
    expect(unchanged.ticket.status).toBe('aberto');

    const changed = await service.updateStatus(
      actor(adminId, 'Administrador', tenantB),
      created.ticket.id,
      { status: 'em_analise' },
    );
    expect(changed.ticket.status).toBe('em_analise');
    await service.createComment(
      actor(adminId, 'Administrador', tenantB),
      created.ticket.id,
      {
        body: 'Estamos analisando a cobrança.',
      },
    );

    await finishNotices();
    const tenantNotices = mail.sendTicketNotice.mock.calls.filter(
      (call) => call[1] !== 'Novo chamado',
    );
    expect(tenantNotices[0][0]).toEqual(['bia@example.com']);
    expect(tenantNotices[0][1]).toBe('Alteração de status');
    expect(tenantNotices[1][1]).toBe('Novo comentário da empresa');
    expect(JSON.stringify(tenantNotices)).not.toContain('cobrança deste mês');
    expect(JSON.stringify(tenantNotices)).not.toContain(
      'analisando a cobrança',
    );
  });

  it('stores Baixa by default and keeps an image attachment inside the tenant', async () => {
    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'erro_falha',
      description: 'A tela de login falhou hoje.',
      title: 'Falha no login',
    });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

    expect(created.ticket.priority).toBe('low');
    expect(created.ticket.attachments).toEqual([]);

    const saved = await service.addAttachment(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
      {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'captura.jpg',
        size: jpeg.length,
      } as Express.Multer.File,
    );

    expect(saved.originalName).toBe('captura.jpg');
    expect(saved.url).toBe(
      `/api/v1/tickets/${created.ticket.id}/attachments/${saved.id}`,
    );
    expect(saved).not.toHaveProperty('filename');
    expect(storage.writeTenantFile).toHaveBeenCalledWith(
      tenantA,
      expect.stringMatching(/\.jpg$/),
      jpeg,
    );

    const detail = await service.get(actor(clientId, 'Usuario', tenantA), created.ticket.id);
    expect(detail.attachments.map((file) => file.id)).toEqual([saved.id]);
    expect(detail.priority).toBe('low');

    const bytes = await service.readAttachment(
      actor(clientId, 'Usuario', tenantA),
      created.ticket.id,
      saved.id,
    );
    expect(bytes.bytes.equals(jpeg)).toBe(true);
    expect(bytes.contentType).toBe('image/jpeg');

    await expect(
      service.addAttachment(actor(otherClientId, 'AdministradorTenant', tenantB), created.ticket.id, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'outra.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).rejects.toThrow('Access denied.');
    await expect(
      service.readAttachment(
        actor(otherClientId, 'AdministradorTenant', tenantB),
        created.ticket.id,
        saved.id,
      ),
    ).rejects.toThrow('Access denied.');
    await expect(
      service.addAttachment(actor(clientId, 'Usuario', tenantA), created.ticket.id, {
        buffer: Buffer.from('plain'),
        mimetype: 'image/png',
        originalname: 'nota.png',
        size: 5,
      } as Express.Multer.File),
    ).rejects.toThrow('Invalid input.');
  });

  it('stores an explicit priority and rejects the eleventh attachment', async () => {
    const created = await service.create(actor(clientId, 'Usuario', tenantA), {
      category: 'melhoria',
      description: 'Quero um filtro mais claro na lista.',
      priority: 'high',
      title: 'Filtro da lista',
    });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

    expect(created.ticket.priority).toBe('high');

    for (let index = 0; index < 10; index += 1) {
      await service.addAttachment(actor(clientId, 'Usuario', tenantA), created.ticket.id, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: `foto-${index}.jpg`,
        size: jpeg.length,
      } as Express.Multer.File);
    }

    await expect(
      service.addAttachment(actor(clientId, 'Usuario', tenantA), created.ticket.id, {
        buffer: jpeg,
        mimetype: 'image/jpeg',
        originalname: 'extra.jpg',
        size: jpeg.length,
      } as Express.Multer.File),
    ).rejects.toThrow('Invalid input.');
    expect(mail.sendTicketNotice).toHaveBeenCalledTimes(1);
  });
});
