import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession } from './client';

describe('API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes the cookie session after an expired access token', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid session.' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ email: 'ana@example.com' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: 'ana@example.com',
            id: 'user-id',
            profile: 'Usuario',
            tenantId: 'tenant-id',
          }),
          { status: 200 },
        ),
      );

    await expect(getSession()).resolves.toMatchObject({
      email: 'ana@example.com',
      id: 'user-id',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
  });
});
