import { HttpException, HttpStatus } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { healthExample } from './common/swagger/examples.js';
import type { HealthResponse } from './common/health/health.types.js';

describe('AppController', () => {
  const healthy = healthExample as HealthResponse;
  const unhealthy: HealthResponse = {
    checks: {
      api: { status: 'up' },
      database: { status: 'down' },
      smtp: { status: 'up' },
    },
    status: 'unhealthy',
  };

  it('returns health statistics when every check is up', async () => {
    const appService = {
      getHealth: vi.fn().mockResolvedValue(healthy),
    };
    const controller = new AppController(appService as unknown as AppService);

    await expect(controller.getHealth()).resolves.toEqual(healthy);
    expect(JSON.stringify(await controller.getHealth())).not.toMatch(
      /password|secret|DATABASE_URL|smtp\./i,
    );
  });

  it('throws 500 with the health body when a check is down', async () => {
    const appService = {
      getHealth: vi.fn().mockResolvedValue(unhealthy),
    };
    const controller = new AppController(appService as unknown as AppService);

    await expect(controller.getHealth()).rejects.toMatchObject({
      response: unhealthy,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
    await expect(controller.getHealth()).rejects.toBeInstanceOf(HttpException);
  });
});
