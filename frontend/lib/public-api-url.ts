export const DEFAULT_PUBLIC_API_URL = 'http://localhost:3001';

export function resolvePublicApiUrl(value: string | undefined): URL {
  const candidate = value?.trim() || DEFAULT_PUBLIC_API_URL;

  try {
    return new URL(candidate);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_API_URL: "${candidate}"`);
  }
}

export function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

export function usesSameOriginApi(
  configuredValue: string | undefined,
  proxyThroughFrontend: string | undefined,
): boolean {
  const configured = resolvePublicApiUrl(configuredValue);

  if (isLoopbackHostname(configured.hostname)) {
    return true;
  }

  return proxyThroughFrontend?.trim().toLowerCase() === 'true';
}

export function publicApiBaseUrl(
  value: string | undefined,
  proxyThroughFrontend: string | undefined,
): string {
  if (usesSameOriginApi(value, proxyThroughFrontend)) {
    return '';
  }

  return resolvePublicApiUrl(value).origin;
}

export function loopbackApiRewrites(
  configuredValue: string | undefined,
  internalOrigin: string | undefined,
  proxyThroughFrontend: string | undefined,
): Array<{ source: string; destination: string }> {
  if (!usesSameOriginApi(configuredValue, proxyThroughFrontend)) {
    return [];
  }

  const configured = resolvePublicApiUrl(configuredValue);
  const target = (internalOrigin?.trim() || configured.origin).replace(/\/$/, '');

  return [
    {
      source: '/api/v1/:path*',
      destination: `${target}/api/v1/:path*`,
    },
  ];
}
