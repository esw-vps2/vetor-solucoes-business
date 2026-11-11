import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { CardAttachment } from './card-attachment.entity.js';
import { CardChecklistItem } from './card-checklist-item.entity.js';
import { CardComment } from './card-comment.entity.js';
import { Project } from './project.entity.js';
import type { CardTag } from '../project-constants.js';

@Entity('cards')
@Index('idx_cards_project_id', ['projectId'])
@Index('uq_cards_project_id_number', ['projectId', 'number'], { unique: true })
@Index('idx_cards_project_id_lane_position', ['projectId', 'lane', 'position'])
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @Column({ name: 'assignee_user_id', type: 'uuid', nullable: true })
  assigneeUserId: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'varchar', length: 10 })
  priority: string;

  @Column({ type: 'varchar', length: 20 })
  lane: string;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: CardTag[];

  @Column({ name: 'cover_attachment_id', type: 'uuid', nullable: true })
  coverAttachmentId: string | null;

  @ManyToOne(() => CardAttachment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cover_attachment_id' })
  coverAttachment: Relation<CardAttachment> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @OneToMany(() => CardComment, (comment) => comment.card)
  comments: Relation<CardComment[]>;

  @OneToMany(() => CardAttachment, (attachment) => attachment.card)
  attachments: Relation<CardAttachment[]>;

  @OneToMany(() => CardChecklistItem, (item) => item.card)
  checklistItems: Relation<CardChecklistItem[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
