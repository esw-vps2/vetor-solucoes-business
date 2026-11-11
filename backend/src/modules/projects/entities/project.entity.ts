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
import { Card } from './card.entity.js';
import { ProjectDocument } from './project-document.entity.js';
import { ProjectWorkspace } from './project-workspace.entity.js';

@Entity('projects')
@Index('idx_projects_workspace_id', ['workspaceId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => ProjectWorkspace, (workspace) => workspace.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Relation<ProjectWorkspace>;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'next_card_number', type: 'int', default: 1 })
  nextCardNumber: number;

  @Column({
    name: 'background_filename',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  backgroundFilename: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @OneToMany(() => Card, (card) => card.project)
  cards: Relation<Card[]>;

  @OneToMany(() => ProjectDocument, (document) => document.project)
  documents: Relation<ProjectDocument[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
