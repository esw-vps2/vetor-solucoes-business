import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PUBLIC_API_URL,
  loopbackApiRewrites,
  publicApiBaseUrl,
  resolvePublicApiUrl,
  usesSameOriginApi,
} from './public-api-url';

describe('resolvePublicApiUrl', () => {
  it('uses the configured origin', () => {
    expect(resolvePublicApiUrl('https://api.example.com').origin).toBe('https://api.example.com');
  });

  it('falls back when the value is missing or blank', () => {
    expect(resolvePublicApiUrl(undefined).href).toBe(`${DEFAULT_PUBLIC_API_URL}/`);
    expect(resolvePublicApiUrl('').href).toBe(`${DEFAULT_PUBLIC_API_URL}/`);
    expect(resolvePublicApiUrl('   ').href).toBe(`${DEFAULT_PUBLIC_API_URL}/`);
  });

  it('rejects a value that is not a URL', () => {
    expect(() => resolvePublicApiUrl('not-a-url')).toThrow(
      'Invalid NEXT_PUBLIC_API_URL: "not-a-url"',
    );
  });
});

describe('usesSameOriginApi', () => {
  it('uses same origin for loopback API hosts', () => {
    expect(usesSameOriginApi('http://localhost:3001', undefined)).toBe(true);
  });

  it('uses same origin when proxy mode is enabled', () => {
    expect(usesSameOriginApi('https://vps2.com.br', 'true')).toBe(true);
    expect(usesSameOriginApi('https://vps2.com.br', 'false')).toBe(false);
  });
});

describe('publicApiBaseUrl', () => {
  it('uses the page origin when the API host is loopback', () => {
    expect(publicApiBaseUrl(undefined, undefined)).toBe('');
    expect(publicApiBaseUrl('http://localhost:3001', undefined)).toBe('');
    expect(publicApiBaseUrl('http://127.0.0.1:3001', undefined)).toBe('');
  });

  it('uses the page origin when proxy mode is enabled', () => {
    expect(publicApiBaseUrl('https://vps2.com.br', 'true')).toBe('');
  });

  it('keeps a remote API origin', () => {
    expect(publicApiBaseUrl('https://api.example.com', undefined)).toBe(
      'https://api.example.com',
    );
  });
});

describe('loopbackApiRewrites', () => {
  it('proxies loopback API calls to the internal backend origin', () => {
    expect(
      loopbackApiRewrites('http://localhost:3001', 'http://backend:3001/', undefined),
    ).toEqual([
      {
        source: '/api/v1/:path*',
        destination: 'http://backend:3001/api/v1/:path*',
      },
    ]);
  });

  it('proxies public hosts when proxy mode is enabled', () => {
    expect(
      loopbackApiRewrites('https://vps2.com.br', 'http://backend:3001', 'true'),
    ).toEqual([
      {
        source: '/api/v1/:path*',
        destination: 'http://backend:3001/api/v1/:path*',
      },
    ]);
  });

  it('does not proxy a remote API without proxy mode', () => {
    expect(loopbackApiRewrites('https://api.example.com', 'http://backend:3001', undefined)).toEqual(
      [],
    );
  });
});
