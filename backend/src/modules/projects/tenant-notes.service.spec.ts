import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../portal/entities/user.entity.js';
import { Tenant } from '../portal/entities/tenant.entity.js';
import { MAX_TENANT_NOTES } from './dto/tenant-note.dto.js';
import { TenantNote } from './entities/tenant-note.entity.js';
import { encryptNote, noteKeyFromBase64 } from './note-cipher.js';
import { TenantNotesService } from './tenant-notes.service.js';

const tenantId = '22222222-2222-4222-8222-222222222222';
const otherTenantId = '33333333-3333-4333-8333-333333333333';
const noteId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const keyBase64 = Buffer.alloc(32, 7).toString('base64');

function actor() {
  return {
    id: 'admin-id',
    profile: 'Administrador' as const,
    sessionId: 'session-id',
    tenantId,
  };
}

describe('TenantNotesService', () => {
  function createService(options?: { key?: string | undefined }) {
    const user = Object.assign(new User(), {
      id: 'admin-id',
      profile: 'Administrador',
      status: 'active',
      tenantId,
    });
    const tenant = Object.assign(new Tenant(), {
      id: tenantId,
      name: 'Example',
    });
    const notes = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((value) => value),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(async (value: TenantNote) =>
        Object.assign(value, {
          id: value.id ?? noteId,
          updatedAt: value.updatedAt ?? new Date('2026-09-21T12:00:00.000Z'),
        }),
      ),
    };
    const tenants = {
      findOne: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
        if (where.id === tenantId) {
          return tenant;
        }

        return null;
      }),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue(user),
    };
    const config = {
      get: vi.fn((name: string) =>
        name === 'NOTES_ENCRYPTION_KEY' ? options?.key : undefined,
      ),
    } as unknown as ConfigService;

    const service = new TenantNotesService(
      notes as never,
      tenants as never,
      users as never,
      config,
    );

    return { notes, service, tenants, users };
  }

  it('stores ciphertext that does not contain the plaintext and list decrypts it', async () => {
    const { notes, service } = createService({ key: keyBase64 });
    const title = 'Secret title';
    const body = 'Secret body text';

    const created = await service.create(actor(), tenantId, { body, title });

    expect(created).toEqual({
      body,
      id: noteId,
      title,
      updatedAt: '2026-09-21T12:00:00.000Z',
    });
    expect(notes.save).toHaveBeenCalledTimes(1);
    const stored = notes.save.mock.calls[0][0] as TenantNote;
    expect(Buffer.isBuffer(stored.ciphertext)).toBe(true);
    expect(stored.ciphertext.toString('utf8')).not.toContain(title);
    expect(stored.ciphertext.toString('utf8')).not.toContain(body);
    expect(stored).not.toHaveProperty('title');
    expect(stored).not.toHaveProperty('body');

    notes.find.mockResolvedValue([
      Object.assign(new TenantNote(), {
        authTag: stored.authTag,
        ciphertext: stored.ciphertext,
        id: noteId,
        iv: stored.iv,
        tenantId,
        updatedAt: new Date('2026-09-21T12:00:00.000Z'),
      }),
    ]);

    await expect(service.list(actor(), tenantId)).resolves.toEqual([
      {
        body,
        id: noteId,
        title,
        updatedAt: '2026-09-21T12:00:00.000Z',
      },
    ]);
  });

  it('returns 404 when the tenant is missing', async () => {
    const { notes, service } = createService({ key: keyBase64 });

    await expect(
      service.list(actor(), otherTenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(notes.find).not.toHaveBeenCalled();
  });

  it('returns 404 when the note belongs to another tenant', async () => {
    const { notes, service } = createService({ key: keyBase64 });
    notes.findOne.mockResolvedValue(null);

    await expect(
      service.update(actor(), tenantId, noteId, {
        body: 'Updated',
        title: 'Title',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(notes.save).not.toHaveBeenCalled();
  });

  it('rejects the 51st note with 400', async () => {
    const { notes, service } = createService({ key: keyBase64 });
    notes.count.mockResolvedValue(MAX_TENANT_NOTES);

    await expect(
      service.create(actor(), tenantId, { body: 'Body', title: 'Title' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(notes.save).not.toHaveBeenCalled();
  });

  it('does not persist plaintext when the encryption key is missing', async () => {
    const { notes, service } = createService({ key: undefined });

    await expect(
      service.create(actor(), tenantId, {
        body: 'Must not persist',
        title: 'Plain',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(notes.save).not.toHaveBeenCalled();
  });

  it('rejects a key that is not 32 bytes', async () => {
    const { notes, service } = createService({
      key: Buffer.alloc(16, 1).toString('base64'),
    });

    await expect(
      service.create(actor(), tenantId, { body: 'Body', title: 'Title' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(notes.save).not.toHaveBeenCalled();
    expect(() => noteKeyFromBase64(Buffer.alloc(16, 1).toString('base64'))).toThrow();
  });

  it('updates an existing note for the same tenant', async () => {
    const key = noteKeyFromBase64(keyBase64);
    const sealed = encryptNote(key, { body: 'Old body', title: 'Old title' });
    const { notes, service } = createService({ key: keyBase64 });
    notes.findOne.mockResolvedValue(
      Object.assign(new TenantNote(), {
        authTag: sealed.authTag,
        ciphertext: sealed.ciphertext,
        id: noteId,
        iv: sealed.iv,
        tenantId,
        updatedAt: new Date('2026-09-20T12:00:00.000Z'),
      }),
    );

    const updated = await service.update(actor(), tenantId, noteId, {
      body: 'New body',
      title: 'New title',
    });

    expect(updated.title).toBe('New title');
    expect(updated.body).toBe('New body');
    const stored = notes.save.mock.calls[0][0] as TenantNote;
    expect(stored.ciphertext.toString('utf8')).not.toContain('New body');
  });
});
