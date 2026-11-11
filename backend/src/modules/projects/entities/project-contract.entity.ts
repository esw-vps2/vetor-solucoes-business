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
import type { ContractStatus } from '../finance-amounts.js';
import { Project } from './project.entity.js';

const moneyTransformer = {
  from: (value: string | number | null): number =>
    value == null ? 0 : Number(value),
  to: (value: number): number => value,
};

@Entity('project_contracts')
@Index('uq_project_contracts_project_id', ['projectId'], { unique: true })
export class ProjectContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ name: 'signed_on', type: 'date', nullable: true })
  signedOn: string | null;

  @Column({ name: 'starts_on', type: 'date', nullable: true })
  startsOn: string | null;

  @Column({ name: 'ends_on', type: 'date', nullable: true })
  endsOn: string | null;

  @Column({
    name: 'total_amount_cents',
    type: 'bigint',
    transformer: moneyTransformer,
  })
  totalAmountCents: number;

  @Column({ name: 'installment_count', type: 'int' })
  installmentCount: number;

  @Column({ type: 'varchar', length: 30 })
  status: ContractStatus;

  @Column({
    name: 'contract_filename',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contractFilename: string | null;

  @Column({ name: 'original_name', type: 'varchar', length: 255, nullable: true })
  originalName: string | null;

  @Column({ name: 'byte_size', type: 'int', nullable: true })
  byteSize: number | null;

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
