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
import { Tenant } from '../../portal/entities/tenant.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { ExpenseCategory } from './expense-category.entity.js';
import { ExpenseSubcategory } from './expense-subcategory.entity.js';

const moneyTransformer = {
  from: (value: string | number | null): number => (value == null ? 0 : Number(value)),
  to: (value: number): number => value,
};

@Entity('expense_series')
@Index('idx_expense_series_category_id', ['categoryId'])
@Index('idx_expense_series_subcategory_id', ['subcategoryId'])
@Index('idx_expense_series_client_tenant_id', ['clientTenantId'])
@Index('idx_expense_series_project_id', ['projectId'])
@Index('idx_expense_series_created_by_user_id', ['createdByUserId'])
export class ExpenseSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, type: 'varchar' })
  interval: string;

  @Column({ name: 'occurrence_count', type: 'int' })
  occurrenceCount: number;

  @Column({ name: 'starts_on', type: 'date' })
  startsOn: string;

  @Column({ length: 160, type: 'varchar' })
  description: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Relation<ExpenseCategory>;

  @Column({ name: 'subcategory_id', nullable: true, type: 'uuid' })
  subcategoryId: string | null;

  @ManyToOne(() => ExpenseSubcategory, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Relation<ExpenseSubcategory> | null;

  @Column({
    name: 'amount_cents',
    transformer: moneyTransformer,
    type: 'bigint',
  })
  amountCents: number;

  @Column({ length: 20, name: 'expense_type', type: 'varchar' })
  expenseType: string;

  @Column({ length: 160, name: 'supplier_name', nullable: true, type: 'varchar' })
  supplierName: string | null;

  @Column({ length: 80, name: 'payment_method', nullable: true, type: 'varchar' })
  paymentMethod: string | null;

  @Column({ length: 2000, nullable: true, type: 'varchar' })
  notes: string | null;

  @Column({ name: 'client_tenant_id', nullable: true, type: 'uuid' })
  clientTenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_tenant_id' })
  clientTenant: Relation<Tenant> | null;

  @Column({ name: 'project_id', nullable: true, type: 'uuid' })
  projectId: string | null;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project> | null;

  @Column({ default: true, type: 'boolean' })
  active: boolean;

  @Column({ name: 'created_by_user_id', nullable: true, type: 'uuid' })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: Relation<User> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
