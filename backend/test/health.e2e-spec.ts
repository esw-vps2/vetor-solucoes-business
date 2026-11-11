import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:net';
import request from 'supertest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import type { HealthResponse } from '../src/common/health/health.types.js';

describe('Health API (e2e)', () => {
  let app: INestApplication<Server>;
  const getHealth = vi.fn();

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: { getHealth },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 and health JSON when every check is up', async () => {
    const body: HealthResponse = {
      checks: {
        api: { status: 'up' },
        database: { status: 'up' },
        smtp: { status: 'up' },
      },
      status: 'healthy',
    };
    getHealth.mockResolvedValue(body);

    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200);

    expect(response.body).toEqual(body);
    expect(response.text).not.toContain('Hello World!');
  });

  it('returns 500 and health JSON when a check is down', async () => {
    const body: HealthResponse = {
      checks: {
        api: { status: 'up' },
        database: { status: 'down' },
        smtp: { status: 'up' },
      },
      status: 'unhealthy',
    };
    getHealth.mockResolvedValue(body);

    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(500);

    expect(response.body).toEqual(body);
  });
});
