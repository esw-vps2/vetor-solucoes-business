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
import { Project } from './project.entity.js';

const moneyTransformer = {
  from: (value: string | number | null): number =>
    value == null ? 0 : Number(value),
  to: (value: number): number => value,
};

@Entity('project_contract_installments')
@Index('idx_project_contract_installments_project_id', ['projectId'])
@Index(
  'uq_project_contract_installments_project_position',
  ['projectId', 'position'],
  {
    unique: true,
  },
)
@Index('idx_project_contract_installments_created_by_user_id', [
  'createdByUserId',
])
export class ProjectContractInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  @Column({ type: 'int' })
  position: number;

  @Column({ name: 'due_on', type: 'date', nullable: true })
  dueOn: string | null;

  @Column({
    name: 'amount_cents',
    type: 'bigint',
    transformer: moneyTransformer,
  })
  amountCents: number;

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
