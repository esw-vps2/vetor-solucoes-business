import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  RATE_LIMIT_OPTIONS,
  RateLimitOptions,
} from './rate-limit.decorator.js';

interface RateLimitEntry {
  count: number;
  startedAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_OPTIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const max = this.getNumber(options.maxEnvironmentVariable, 5);
    const windowMs = this.getDuration(
      options.windowEnvironmentVariable,
      900000,
    );
    const identifier = this.getIdentifier(request, options);
    const key = `${options.key}:${identifier}`;
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      this.entries.set(key, { count: 1, startedAt: now });
      return true;
    }

    if (entry.count >= max) {
      throw new HttpException(
        'Too many requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }

  private getIdentifier(request: Request, options: RateLimitOptions): string {
    const ip = request.ip || 'unknown';

    if (options.identifier !== 'ip-and-body') {
      return ip;
    }

    const body = request.body as Record<string, unknown> | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.toLowerCase() : '';
    const challengeId =
      typeof body?.challengeId === 'string'
        ? body.challengeId.toLowerCase()
        : '';

    return `${ip}:${email || challengeId}`;
  }

  private getNumber(name: string, fallback: number): number {
    const value = Number(this.config.get<string>(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private getDuration(name: string, fallback: number): number {
    const value = this.config.get<string>(name);

    if (!value) {
      return fallback;
    }

    const match = value.match(/^(\d+)(s|m|h)$/);

    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const multiplier =
      match[2] === 'h' ? 3600000 : match[2] === 'm' ? 60000 : 1000;
    return amount * multiplier;
  }
}
