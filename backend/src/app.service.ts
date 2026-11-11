import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MailService } from './modules/mail/mail.service.js';
import type { HealthResponse } from './common/health/health.types.js';

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const [databaseUp, smtpUp] = await Promise.all([
      this.checkDatabase(),
      this.mail.verifyTransport(),
    ]);
    const healthy = databaseUp && smtpUp;

    return {
      checks: {
        api: { status: 'up' },
        database: { status: databaseUp ? 'up' : 'down' },
        smtp: { status: smtpUp ? 'up' : 'down' },
      },
      status: healthy ? 'healthy' : 'unhealthy',
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
