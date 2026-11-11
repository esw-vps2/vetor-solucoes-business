import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedRequest } from '../auth.types.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class SelfOrAdministradorGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const rawId = request.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (typeof targetId !== 'string' || targetId.length === 0) {
      throw new ForbiddenException('Access denied.');
    }

    if (request.user.id === targetId) {
      return true;
    }

    const actor = await this.users.findOne({
      where: { id: request.user.id, status: 'active' },
    });

    if (actor?.profile === 'Administrador') {
      return true;
    }

    if (actor?.profile === 'AdministradorTenant') {
      const target = await this.users.findOne({ where: { id: targetId } });

      if (!target || target.tenantId === actor.tenantId) {
        return true;
      }
    }

    throw new ForbiddenException('Access denied.');
  }
}
