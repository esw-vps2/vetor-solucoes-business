import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OutboxPayload } from '../ai-agent.types.js';

@Entity('outbox_events')
@Index('uq_outbox_events_tenant_id', ['tenantId', 'id'], { unique: true })
@Index('idx_outbox_events_run', ['tenantId', 'runId'])
@Index('idx_outbox_events_available', [
  'publishedAt',
  'availableAt',
  'createdAt',
])
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @Column({ length: 64, name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: OutboxPayload;

  @Column({ default: 0, name: 'attempt_count', type: 'int' })
  attemptCount: number;

  @Column({ name: 'available_at', type: 'timestamptz' })
  availableAt: Date;

  @Column({ name: 'published_at', nullable: true, type: 'timestamptz' })
  publishedAt: Date | null;

  @Column({ length: 120, name: 'last_error', nullable: true, type: 'varchar' })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
