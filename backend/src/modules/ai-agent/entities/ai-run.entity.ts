import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { RunStatus } from '../ai-agent.constants.js';
import type { ToolTraceEntry } from '../project-card-match.js';

@Entity('ai_runs')
@Index('uq_ai_runs_tenant_id', ['tenantId', 'id'], { unique: true })
@Index('idx_ai_runs_conversation_status', [
  'tenantId',
  'conversationId',
  'status',
])
@Index('idx_ai_runs_requester_created', [
  'tenantId',
  'requesterUserId',
  'createdAt',
])
@Index('idx_ai_runs_status_created', ['status', 'createdAt'])
export class AiRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'requester_user_id', type: 'uuid' })
  requesterUserId: string;

  @Column({ name: 'user_message_id', type: 'uuid' })
  userMessageId: string;

  @Column({ name: 'assistant_message_id', nullable: true, type: 'uuid' })
  assistantMessageId: string | null;

  @Column({
    length: 128,
    name: 'idempotency_key',
    nullable: true,
    type: 'varchar',
  })
  idempotencyKey: string | null;

  @Column({ length: 16, type: 'varchar' })
  status: RunStatus;

  @Column({ length: 32, type: 'varchar' })
  provider: 'openrouter';

  @Column({ length: 160, name: 'requested_model', type: 'varchar' })
  requestedModel: string;

  @Column({
    length: 160,
    name: 'effective_model',
    nullable: true,
    type: 'varchar',
  })
  effectiveModel: string | null;

  @Column({ name: 'input_tokens', nullable: true, type: 'int' })
  inputTokens: number | null;

  @Column({ name: 'output_tokens', nullable: true, type: 'int' })
  outputTokens: number | null;

  @Column({ name: 'duration_ms', nullable: true, type: 'bigint' })
  durationMs: number | null;

  @Column({ default: 0, type: 'int' })
  attempt: number;

  @Column({ name: 'lease_expires_at', nullable: true, type: 'timestamptz' })
  leaseExpiresAt: Date | null;

  @Column({ name: 'started_at', nullable: true, type: 'timestamptz' })
  startedAt: Date | null;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' })
  completedAt: Date | null;

  @Column({ length: 64, name: 'error_code', nullable: true, type: 'varchar' })
  errorCode: string | null;

  @Column({
    length: 240,
    name: 'error_message',
    nullable: true,
    type: 'varchar',
  })
  errorMessage: string | null;

  @Column({ name: 'tool_trace', nullable: true, type: 'jsonb' })
  toolTrace: ToolTraceEntry[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
