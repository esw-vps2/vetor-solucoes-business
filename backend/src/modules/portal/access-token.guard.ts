import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessTokenPayload, AuthenticatedRequest } from './auth.types.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const user = await this.users.findOne({
        where: { id: payload.sub, status: 'active' },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      request.user = {
        id: payload.sub,
        profile: payload.profile,
        sessionId: payload.sessionId,
        tenantId: payload.tenantId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid credentials.');
    }
  }
}
