import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_OPTIONS = 'rate_limit_options';

export interface RateLimitOptions {
  key: string;
  maxEnvironmentVariable: string;
  windowEnvironmentVariable: string;
  identifier?: 'ip' | 'ip-and-body';
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_OPTIONS, options);
