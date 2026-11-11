import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { MessageRole } from '../ai-agent.constants.js';

@Entity('ai_messages')
@Index('uq_ai_messages_tenant_id', ['tenantId', 'id'], { unique: true })
@Index('uq_ai_messages_sequence', ['tenantId', 'conversationId', 'sequence'], {
  unique: true,
})
@Index('idx_ai_messages_conversation', [
  'tenantId',
  'conversationId',
  'sequence',
])
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ length: 16, type: 'varchar' })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'author_user_id', nullable: true, type: 'uuid' })
  authorUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
