import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { TenantStorageService } from './tenant-storage.service.js';
import { Tenant } from './entities/tenant.entity.js';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn(),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('TenantStorageService', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';

  function createService(tenants: Tenant[] = []) {
    const repository = {
      find: vi.fn().mockResolvedValue(tenants),
    };
    const config = {
      get: vi.fn().mockReturnValue('/tmp/vetor-files'),
    };

    return {
      repository,
      service: new TenantStorageService(repository as never, config as never),
    };
  }

  beforeEach(() => {
    vi.mocked(mkdir).mockClear();
    vi.mocked(unlink).mockClear();
    vi.mocked(rename).mockClear();
    vi.mocked(writeFile).mockClear();
  });

  it('creates a folder named by tenant id under the configured root', async () => {
    const { service } = createService();

    await expect(service.ensureTenantFolder(tenantId)).resolves.toBe(
      `/tmp/vetor-files/${tenantId}`,
    );
    expect(mkdir).toHaveBeenCalledWith(`/tmp/vetor-files/${tenantId}`, {
      recursive: true,
    });
  });

  it('creates folders for every tenant already stored', async () => {
    const { service } = createService([
      Object.assign(new Tenant(), { id: tenantId }),
      Object.assign(new Tenant(), {
        id: '22222222-2222-2222-2222-222222222222',
      }),
    ]);

    await service.ensureExistingTenantFolders();

    expect(mkdir).toHaveBeenCalledTimes(2);
  });

  it('rejects a tenant id that could escape the files root', async () => {
    const { service } = createService();

    await expect(service.ensureTenantFolder('../etc')).rejects.toThrow(
      'Invalid tenant id.',
    );
    expect(mkdir).not.toHaveBeenCalled();
  });

  it('writes a user photo only under the tenant folder', async () => {
    const { service } = createService();
    const pointer = '11111111-1111-4111-8111-111111111111.jpg';
    const bytes = Buffer.from([0xff, 0xd8, 0xff]);

    await service.writeUserPhoto(tenantId, pointer, bytes);

    expect(writeFile).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/${pointer}`,
      bytes,
    );
  });

  it('rejects a photo pointer that could escape the tenant folder', async () => {
    const { service } = createService();

    await expect(
      service.writeUserPhoto(tenantId, '../secret.jpg', Buffer.from([0xff])),
    ).rejects.toThrow('Invalid photo pointer.');
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('deletes an attachment pointer under the tenant folder', async () => {
    const { service } = createService();
    const pointer = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf';

    await service.deleteTenantFile(tenantId, pointer);

    expect(unlink).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/${pointer}`,
    );
  });

  it('overwrites a contract PDF through a temporary file inside the tenant folder', async () => {
    const { service } = createService();
    const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const pointer = `contracts/${projectId}.pdf`;
    const bytes = Buffer.from('%PDF-1.4');

    await service.writeTenantFile(tenantId, pointer, bytes, 'contract');

    expect(writeFile).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/contracts/${projectId}.pdf.tmp`,
      bytes,
    );
    expect(rename).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/contracts/${projectId}.pdf.tmp`,
      `/tmp/vetor-files/${tenantId}/contracts/${projectId}.pdf`,
    );
  });

  it('rejects a contract pointer that could escape the tenant folder', async () => {
    const { service } = createService();

    await expect(
      service.writeTenantFile(
        tenantId,
        '../secret.pdf',
        Buffer.from('%PDF'),
        'contract',
      ),
    ).rejects.toThrow('Invalid attachment pointer.');
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('writes finance documents below the resolved tenant root and project path', async () => {
    const { service } = createService();
    const projectTenantId = '22222222-2222-4222-8222-222222222222';
    const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const documentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const pointer = `finance/${projectTenantId}/${projectId}/${documentId}.pdf`;
    const bytes = Buffer.from('%PDF-1.7');

    await service.writeTenantFile(tenantId, pointer, bytes, 'finance');

    expect(mkdir).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/finance/${projectTenantId}/${projectId}`,
      { recursive: true },
    );
    expect(writeFile).toHaveBeenCalledWith(
      `${`/tmp/vetor-files/${tenantId}/${pointer}`}.tmp`,
      bytes,
    );
    expect(rename).toHaveBeenCalledWith(
      `${`/tmp/vetor-files/${tenantId}/${pointer}`}.tmp`,
      `/tmp/vetor-files/${tenantId}/${pointer}`,
    );
  });

  it('rejects a finance pointer that could escape the tenant folder', async () => {
    const { service } = createService();

    await expect(
      service.writeTenantFile(
        tenantId,
        'finance/../secret/../../secret.pdf',
        Buffer.from('%PDF'),
        'finance',
      ),
    ).rejects.toThrow('Invalid finance document pointer.');
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('writes an expense document under the tenant root and expense path', async () => {
    const { service } = createService();
    const expenseId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const documentId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const pointer = `expenses/${expenseId}/${documentId}.pdf`;
    const bytes = Buffer.from('%PDF-1.7');

    await service.writeTenantFile(tenantId, pointer, bytes, 'expense');

    expect(mkdir).toHaveBeenCalledWith(`/tmp/vetor-files/${tenantId}/expenses/${expenseId}`, {
      recursive: true,
    });
    expect(rename).toHaveBeenCalledWith(
      `/tmp/vetor-files/${tenantId}/${pointer}.tmp`,
      `/tmp/vetor-files/${tenantId}/${pointer}`,
    );
  });

  it('rejects an expense pointer that could escape the tenant folder', async () => {
    const { service } = createService();

    await expect(
      service.writeTenantFile(tenantId, 'expenses/../secret.pdf', Buffer.from('%PDF'), 'expense'),
    ).rejects.toThrow('Invalid expense document pointer.');
    expect(writeFile).not.toHaveBeenCalled();
  });
});
