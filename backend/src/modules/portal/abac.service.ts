import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity.js';

@Injectable()
export class AbacService {
  canAccessTenant(user: User, tenantId: string): boolean {
    if (user.profile === 'Administrador') {
      return true;
    }

    return user.tenantId === tenantId;
  }

  canAccessResource(
    user: User,
    resource: { tenantId: string },
    action: 'read' | 'write' | 'delete',
  ): boolean {
    if (!['read', 'write', 'delete'].includes(action)) {
      return false;
    }

    return this.canAccessTenant(user, resource.tenantId);
  }
}
