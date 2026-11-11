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
import { hasMappedAction } from '../enabled-actions.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class AdministradorOrCreateUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.users.findOne({
      where: { id: request.user.id, status: 'active' },
    });

    if (!user || !hasMappedAction(user, 'createUser')) {
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }
}
