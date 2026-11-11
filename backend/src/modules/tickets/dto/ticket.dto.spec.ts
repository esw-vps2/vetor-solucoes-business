import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateTicketCommentDto,
  CreateTicketDto,
  ListTicketsQueryDto,
  MarkTicketReadDto,
  UpdateTicketStatusDto,
} from './ticket.dto.js';

async function violations(
  type: new () => object,
  payload: object,
): Promise<string[]> {
  const instance = plainToInstance(type, payload);
  const errors = await validate(instance, {
    forbidNonWhitelisted: true,
    whitelist: true,
  });

  return errors.flatMap((error) => [
    ...(error.constraints ? Object.keys(error.constraints) : []),
    error.property,
  ]);
}

describe('ticket DTOs', () => {
  it('accepts a trimmed ticket and rejects unknown ownership fields', async () => {
    const valid = plainToInstance(CreateTicketDto, {
      category: 'duvida',
      description: '  Preciso de ajuda com o acesso.  ',
      title: '  Acesso ao portal  ',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(valid.title).toBe('Acesso ao portal');
    expect(valid.description).toBe('Preciso de ajuda com o acesso.');
    const prioritized = plainToInstance(CreateTicketDto, {
      category: 'duvida',
      description: 'Preciso de ajuda com o acesso.',
      priority: 'high',
      title: 'Acesso ao portal',
    });
    expect(await validate(prioritized)).toHaveLength(0);
    expect(prioritized.priority).toBe('high');
    await expect(
      violations(CreateTicketDto, {
        category: 'duvida',
        description: 'Preciso de ajuda com o acesso.',
        status: 'resolvido',
        tenantId: '22222222-2222-4222-8222-222222222222',
        title: 'Acesso',
      }),
    ).resolves.toEqual(expect.arrayContaining(['status', 'tenantId']));
  });

  it('rejects blank, short, long, and unknown ticket values', async () => {
    await expect(
      violations(CreateTicketDto, {
        category: 'urgente',
        description: 'curta',
        priority: 'urgente',
        title: 'ab',
      }),
    ).resolves.toEqual(
      expect.arrayContaining(['minLength', 'isIn', 'category', 'title']),
    );
  });

  it('rejects unknown status and comment fields', async () => {
    await expect(
      violations(UpdateTicketStatusDto, {
        status: 'fechado',
        tenantId: '22222222-2222-4222-8222-222222222222',
      }),
    ).resolves.toEqual(expect.arrayContaining(['isIn', 'tenantId']));
    await expect(
      violations(CreateTicketCommentDto, {
        authorId: '11111111-1111-4111-8111-111111111111',
        body: 'x',
      }),
    ).resolves.toEqual(expect.arrayContaining(['minLength', 'authorId']));
  });

  it('rejects unknown read-state and list query fields', async () => {
    const readErrors = await validate(
      plainToInstance(MarkTicketReadDto, {
        lastSeenAt: '2026-10-26T00:00:00.000Z',
      }),
      { forbidNonWhitelisted: true, whitelist: true },
    );
    expect(readErrors.some((error) => error.constraints?.unknownValue)).toBe(
      true,
    );
    const query = plainToInstance(ListTicketsQueryDto, {
      category: 'outros',
      limit: '20',
      page: '2',
      status: 'aberto',
      tenantId: '22222222-2222-4222-8222-222222222222',
    });

    expect(await validate(query)).toHaveLength(0);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(20);
    expect(query.tenantId).toBe('22222222-2222-4222-8222-222222222222');
    await expect(
      violations(ListTicketsQueryDto, {
        limit: '101',
        status: 'fechado',
        tenantId: 'acme',
      }),
    ).resolves.toEqual(expect.arrayContaining(['max', 'isIn', 'isUuid']));
  });
});
