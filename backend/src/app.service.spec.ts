import { AppService } from './app.service.js';
import type { MailService } from './modules/mail/mail.service.js';
import type { DataSource } from 'typeorm';

describe('AppService', () => {
  function createService(options: {
    database?: boolean;
    smtp?: boolean;
  }): AppService {
    const dataSource = {
      query:
        options.database === false
          ? vi.fn().mockRejectedValue(new Error('unavailable'))
          : vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const mail = {
      verifyTransport: vi.fn().mockResolvedValue(options.smtp !== false),
    };

    return new AppService(
      dataSource as unknown as DataSource,
      mail as unknown as MailService,
    );
  }

  it('returns healthy when database and smtp are up', async () => {
    const service = createService({});

    await expect(service.getHealth()).resolves.toEqual({
      checks: {
        api: { status: 'up' },
        database: { status: 'up' },
        smtp: { status: 'up' },
      },
      status: 'healthy',
    });
  });

  it('returns unhealthy when the database check is down', async () => {
    const service = createService({ database: false });

    await expect(service.getHealth()).resolves.toEqual({
      checks: {
        api: { status: 'up' },
        database: { status: 'down' },
        smtp: { status: 'up' },
      },
      status: 'unhealthy',
    });
  });

  it('returns unhealthy when the smtp check is down', async () => {
    const service = createService({ smtp: false });

    await expect(service.getHealth()).resolves.toEqual({
      checks: {
        api: { status: 'up' },
        database: { status: 'up' },
        smtp: { status: 'down' },
      },
      status: 'unhealthy',
    });
  });
});
