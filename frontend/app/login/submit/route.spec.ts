import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function formRequest(fields: Record<string, string>): Request {
  const body = new URLSearchParams(fields);

  return new Request('http://127.0.0.1:3000/login/submit', {
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
}

describe('login form submit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects to the same-origin portal and forwards the session cookies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(JSON.stringify({ mfaRequired: false, profile: 'Administrador' }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'access_token=session-token; Path=/; HttpOnly; SameSite=Lax',
          },
          status: 200,
        });
      }),
    );

    const response = await POST(formRequest({ email: 'ana@example.com', password: 'correct-password' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/portal');

    const forwarded = new Request('http://0.0.0.0:3000/login/submit', {
      body: new URLSearchParams({ email: 'ana@example.com', password: 'correct-password' }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-host': '127.0.0.1:3000',
        'x-forwarded-proto': 'http',
      },
      method: 'POST',
    });
    const forwardedResponse = await POST(forwarded);
    expect(forwardedResponse.headers.get('location')).toBe('http://127.0.0.1:3000/portal');
    expect(response.headers.get('set-cookie')).toContain('access_token=session-token');
  });

  it('returns to the login page when the credentials are rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid credentials.' }), { status: 401 })),
    );

    const response = await POST(formRequest({ email: 'ana@example.com', password: 'wrong-password' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/login?erro=1');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('does not call the API when the form is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(formRequest({ email: '   ', password: '' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/login?erro=1');
  });
});
