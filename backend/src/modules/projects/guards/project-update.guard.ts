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
import {
  hasMappedAction,
  isLaneConfigAction,
  isWorkspaceManager,
} from '../../portal/enabled-actions.js';
import { User } from '../../portal/entities/user.entity.js';

@Injectable()
export class ProjectUpdateGuard implements CanActivate {
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

    if (!user) {
      throw new ForbiddenException('Access denied.');
    }

    if (isWorkspaceManager(user.profile)) {
      return true;
    }

    const canConfigureLanes = (user.enabledActions ?? []).some((action) =>
      isLaneConfigAction(action),
    );

    if (hasMappedAction(user, 'viewProjects') && canConfigureLanes) {
      return true;
    }

    throw new ForbiddenException('Access denied.');
  }
}
