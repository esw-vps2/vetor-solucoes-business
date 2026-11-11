import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../portal/entities/user.entity.js';
import type { CostCategory } from '../finance-amounts.js';
import { Project } from './project.entity.js';

const moneyTransformer = {
  from: (value: string | number | null): number =>
    value == null ? 0 : Number(value),
  to: (value: number): number => value,
};

@Entity('project_costs')
@Index('idx_project_costs_project_id', ['projectId'])
@Index('uq_project_costs_project_id_position', ['projectId', 'position'], {
  unique: true,
})
export class ProjectCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  @Column({ name: 'incurred_on', type: 'date' })
  incurredOn: string;

  @Column({
    name: 'amount_cents',
    type: 'bigint',
    transformer: moneyTransformer,
  })
  amountCents: number;

  @Column({ type: 'varchar', length: 30 })
  category: CostCategory;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

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
