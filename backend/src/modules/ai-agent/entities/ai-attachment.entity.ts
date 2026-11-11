import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_attachments')
@Index('idx_ai_attachments_expires_at', ['expiresAt'])
@Index('idx_ai_attachments_conversation', [
  'tenantId',
  'conversationId',
  'ownerUserId',
])
export class AiAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId: string;

  @Column({ name: 'message_id', nullable: true, type: 'uuid' })
  messageId: string | null;

  @Column({ length: 255, name: 'original_name' })
  originalName: string;

  @Column({ length: 127, name: 'mime_type' })
  mimeType: string;

  @Column({ length: 512, name: 'storage_pointer' })
  storagePointer: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
