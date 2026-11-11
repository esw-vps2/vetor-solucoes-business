import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { ABAC_ACTION, AbacAction } from './abac.decorator.js';
import { AbacService } from './abac.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abac: AbacService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<AbacAction>(ABAC_ACTION, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!action || !request.user) {
      throw new ForbiddenException('Access denied.');
    }

    const user = await this.users.findOne({
      where: { id: request.user.id, status: 'active' },
    });
    const tenantId =
      typeof request.params.tenantId === 'string'
        ? request.params.tenantId
        : request.user.tenantId;

    if (!user || !this.abac.canAccessResource(user, { tenantId }, action)) {
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }
}
