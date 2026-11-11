import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityAuditEvent } from './entities/security-audit-event.entity.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(SecurityAuditEvent)
    private readonly events: Repository<SecurityAuditEvent>,
  ) {}

  async record(
    eventType: string,
    values: {
      userId?: string | null;
      tenantId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.events.save(
      this.events.create({
        eventType,
        metadata: values.metadata ?? {},
        tenantId: values.tenantId ?? null,
        userId: values.userId ?? null,
      }),
    );
  }
}
