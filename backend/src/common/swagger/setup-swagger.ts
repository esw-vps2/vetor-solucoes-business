import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createSwaggerAuthMiddleware } from './swagger-auth.middleware.js';

export const SWAGGER_UI_PATH = 'api/docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('VETOR API')
    .setDescription('Published HTTP contract for the VETOR backend.')
    .setVersion('1.0')
    .addCookieAuth(
      'access_token',
      {
        in: 'cookie',
        name: 'access_token',
        type: 'apiKey',
      },
      'access-cookie',
    )
    .addCookieAuth(
      'refresh_token',
      {
        in: 'cookie',
        name: 'refresh_token',
        type: 'apiKey',
      },
      'refresh-cookie',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    createSwaggerAuthMiddleware(app.get(JwtService), app.get(ConfigService)),
  );
  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });
}
