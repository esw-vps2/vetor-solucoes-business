import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { AccessTokenPayload } from '../../modules/portal/auth.types.js';
import { isSwaggerPath } from './swagger-path.js';

const unauthorizedBody = {
  error: 'Unauthorized',
  message: 'Invalid credentials.',
  statusCode: 401,
};

export function createSwaggerAuthMiddleware(
  jwt: JwtService,
  config: ConfigService,
) {
  return async (request: Request, response: Response, next: NextFunction) => {
    if (!isSwaggerPath(request.path)) {
      next();
      return;
    }

    const token = request.cookies?.access_token;

    if (!token) {
      response.status(401).json(unauthorizedBody);
      return;
    }

    try {
      const payload = await jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: config.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.type !== 'access') {
        response.status(401).json(unauthorizedBody);
        return;
      }

      next();
    } catch {
      response.status(401).json(unauthorizedBody);
    }
  };
}
