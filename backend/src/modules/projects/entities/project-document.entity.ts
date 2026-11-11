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
import { Project } from './project.entity.js';
import { User } from '../../portal/entities/user.entity.js';

@Entity('project_documents')
@Index('idx_project_documents_project_id', ['projectId'])
@Index('idx_project_documents_parent_id', ['parentId'])
export class ProjectDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => ProjectDocument, (document) => document.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Relation<ProjectDocument> | null;

  @OneToMany(() => ProjectDocument, (document) => document.parent)
  children: Relation<ProjectDocument[]>;

  @Column({ type: 'varchar', length: 16 })
  kind: 'file' | 'folder';

  @Column({ name: 'original_name', type: 'varchar', length: 120 })
  originalName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename: string | null;

  @Column({
    name: 'content_type',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contentType: string | null;

  @Column({ name: 'byte_size', type: 'int', default: 0 })
  byteSize: number;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: Relation<User>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
