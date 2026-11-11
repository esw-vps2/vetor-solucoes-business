import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { loopbackApiRewrites, resolvePublicApiUrl } from './lib/public-api-url';
import { MAX_API_PROXY_BODY_SIZE } from './lib/upload-limits';

const monorepoRoot = resolve(__dirname, '..');
const apiUrl = resolvePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  allowedDevOrigins: ['app.vps2.com.br', 'vps2.com.br'],
  experimental: {
    proxyClientMaxBodySize: MAX_API_PROXY_BODY_SIZE,
  },
  images: {
    remotePatterns: [
      {
        hostname: apiUrl.hostname,
        pathname: '/api/v1/users/**',
        port: apiUrl.port,
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  async rewrites() {
    return loopbackApiRewrites(
      process.env.NEXT_PUBLIC_API_URL,
      process.env.API_INTERNAL_URL,
      process.env.NEXT_PUBLIC_API_PROXY,
    );
  },
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
