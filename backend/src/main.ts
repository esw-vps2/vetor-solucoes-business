import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { corsOptions } from './common/security/cors-origins.js';
import { setupSwagger } from './common/swagger/setup-swagger.js';
import { AppModule } from './app.module.js';
import { BootstrapAdminService } from './modules/portal/bootstrap-admin.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.enableCors(
    corsOptions(config.get<string>('CORS', 'http://localhost:3000')),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  setupSwagger(app);
  await app.get(BootstrapAdminService).ensure();
  app.enableShutdownHooks();

  await app.listen(config.get<number>('PORT', 3000));
}

await bootstrap();
