import type { Request, Response } from 'express';
import { createSwaggerAuthMiddleware } from './swagger-auth.middleware.js';

describe('createSwaggerAuthMiddleware', () => {
  function createResponse() {
    return {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  }

  it('returns 401 when the Swagger request has no access cookie', async () => {
    const jwt = { verifyAsync: vi.fn() };
    const config = { getOrThrow: vi.fn().mockReturnValue('secret') };
    const middleware = createSwaggerAuthMiddleware(
      jwt as never,
      config as never,
    );
    const response = createResponse();
    const next = vi.fn();

    await middleware(
      { cookies: {}, path: '/api/docs' } as unknown as Request,
      response as unknown as Response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the access cookie is not an access token', async () => {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({ type: 'refresh' }),
    };
    const config = { getOrThrow: vi.fn().mockReturnValue('secret') };
    const middleware = createSwaggerAuthMiddleware(
      jwt as never,
      config as never,
    );
    const response = createResponse();
    const next = vi.fn();

    await middleware(
      {
        cookies: { access_token: 'token' },
        path: '/api/docs-json',
      } as unknown as Request,
      response as unknown as Response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an authenticated access cookie through to Swagger', async () => {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({ type: 'access' }),
    };
    const config = { getOrThrow: vi.fn().mockReturnValue('secret') };
    const middleware = createSwaggerAuthMiddleware(
      jwt as never,
      config as never,
    );
    const response = createResponse();
    const next = vi.fn();

    await middleware(
      {
        cookies: { access_token: 'token' },
        path: '/api/docs',
      } as unknown as Request,
      response as unknown as Response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('does not require authentication for product routes', async () => {
    const jwt = { verifyAsync: vi.fn() };
    const config = { getOrThrow: vi.fn() };
    const middleware = createSwaggerAuthMiddleware(
      jwt as never,
      config as never,
    );
    const response = createResponse();
    const next = vi.fn();

    await middleware(
      { cookies: {}, path: '/api/v1' } as unknown as Request,
      response as unknown as Response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});
