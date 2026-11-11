import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiAttachmentsService } from './ai-attachments.service.js';
import type { AiAttachment } from './entities/ai-attachment.entity.js';
import type { AuthenticatedUser } from '../portal/auth.types.js';

const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = '11111111-1111-4111-8111-111111111111';
const conversationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const attachmentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const messageId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

function session(): AuthenticatedUser {
  return {
    id: userId,
    profile: 'Usuario',
    sessionId: '55555555-5555-4555-8555-555555555555',
    tenantId,
  };
}

function row(overrides: Partial<AiAttachment> = {}): AiAttachment {
  return {
    conversationId,
    createdAt: new Date('2026-11-04T00:00:00.000Z'),
    expiresAt: new Date(Date.now() + 60_000),
    id: attachmentId,
    messageId,
    mimeType: 'image/png',
    originalName: 'foto.png',
    ownerUserId: userId,
    storagePointer: 'ai/foto.png',
    tenantId,
    updatedAt: new Date('2026-11-04T00:00:00.000Z'),
    ...overrides,
  };
}

function service(options: {
  rows?: AiAttachment[];
  found?: AiAttachment | null;
  bytes?: Buffer;
  readError?: Error;
}) {
  const attachments = {
    find: vi.fn().mockResolvedValue(options.rows ?? []),
    findOne: vi.fn().mockResolvedValue(
      options.found === undefined ? row() : options.found,
    ),
  };
  const users = {
    findOne: vi.fn().mockResolvedValue({
      enabledActions: ['vetorAgent'],
      id: userId,
      profile: 'Usuario',
      status: 'active',
    }),
  };
  const storage = {
    readTenantFile: vi.fn().mockImplementation(async () => {
      if (options.readError) {
        throw options.readError;
      }

      return options.bytes ?? Buffer.from('png');
    }),
  };

  return {
    storage,
    subject: new AiAttachmentsService(
      attachments as never,
      {} as never,
      users as never,
      storage as never,
    ),
  };
}

describe('AiAttachmentsService', () => {
  it('lists only files already bound to a live message', async () => {
    const { subject } = service({
      rows: [
        row(),
        row({
          id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          messageId: null,
          originalName: 'pendente.png',
        }),
        row({
          expiresAt: new Date(Date.now() - 1000),
          id: '99999999-9999-4999-8999-999999999999',
          originalName: 'expirado.png',
        }),
      ],
    });

    const grouped = await subject.listBoundByMessage(
      tenantId,
      userId,
      conversationId,
    );

    expect(grouped.get(messageId)).toEqual([
      {
        id: attachmentId,
        mimeType: 'image/png',
        originalName: 'foto.png',
      },
    ]);
    expect(JSON.stringify([...grouped.values()])).not.toContain('ai/foto.png');
  });

  it('returns the bytes of an owned message attachment', async () => {
    const { storage, subject } = service({ bytes: Buffer.from('png') });

    await expect(
      subject.read(session(), conversationId, attachmentId),
    ).resolves.toEqual({
      bytes: Buffer.from('png'),
      mimeType: 'image/png',
      originalName: 'foto.png',
    });
    expect(storage.readTenantFile).toHaveBeenCalledWith(
      tenantId,
      'ai/foto.png',
      'ai',
    );
  });

  it('hides an attachment that is missing, unbound, or unreadable', async () => {
    const missing = service({ found: null });
    const unbound = service({ found: row({ messageId: null }) });
    const unreadable = service({ readError: new Error('missing file') });

    await expect(
      missing.subject.read(session(), conversationId, attachmentId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      unbound.subject.read(session(), conversationId, attachmentId),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      unreadable.subject.read(session(), conversationId, attachmentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
