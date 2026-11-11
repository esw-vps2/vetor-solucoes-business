import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ContactController } from '../src/modules/contact/contact.controller.js';
import { ContactService } from '../src/modules/contact/contact.service.js';

describe('Contact API (e2e)', () => {
  let app: INestApplication<Server>;
  const contactService = {
    send: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        {
          provide: ContactService,
          useValue: contactService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  it('accepts a valid contact payload and returns no content', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contact')
      .send({
        customerEmail: 'ana@example.com',
        customerName: 'Ana',
        projectDescription: 'Projeto de automação',
      })
      .expect(204)
      .then(() => {
        expect(contactService.send).toHaveBeenCalled();
      });
  });

  it('rejects invalid contact payloads at the HTTP boundary', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contact')
      .send({
        customerEmail: 'not-an-email',
        customerName: '',
        projectDescription: '',
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
