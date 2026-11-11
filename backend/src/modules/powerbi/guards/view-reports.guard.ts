import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedRequest } from '../../portal/auth.types.js';
import { hasMappedAction } from '../../portal/enabled-actions.js';
import { User } from '../../portal/entities/user.entity.js';

@Injectable()
export class ViewReportsGuard implements CanActivate {
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

    if (!user || !hasMappedAction(user, 'viewReports')) {
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }
}
