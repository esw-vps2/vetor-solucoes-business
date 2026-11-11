import { NextResponse } from 'next/server';

function apiOrigin(): string {
  const internal = process.env.API_INTERNAL_URL?.trim();

  if (internal) {
    return internal.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3001';
}

function publicOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');

  if (host) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const email = form.get('email');
  const password = form.get('password');
  const loginUrl = new URL('/login', publicOrigin(request));

  if (typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password === '') {
    loginUrl.searchParams.set('erro', '1');
    return NextResponse.redirect(loginUrl, 303);
  }

  let upstream: Response;

  try {
    upstream = await fetch(`${apiOrigin()}/api/v1/auth/login`, {
      body: JSON.stringify({ email: email.trim(), password }),
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      method: 'POST',
    });
  } catch {
    loginUrl.searchParams.set('erro', '1');
    return NextResponse.redirect(loginUrl, 303);
  }

  if (!upstream.ok) {
    loginUrl.searchParams.set('erro', upstream.status === 429 ? '429' : '1');
    return NextResponse.redirect(loginUrl, 303);
  }

  const payload = (await upstream.json()) as { mfaRequired?: boolean };

  if (payload.mfaRequired) {
    loginUrl.searchParams.set('erro', '1');
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL('/portal', publicOrigin(request)), 303);

  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}
