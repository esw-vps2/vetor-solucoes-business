import {
  Check,
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
import { ExpenseSeries } from './expense-series.entity.js';
import { ExpenseSubcategory } from './expense-subcategory.entity.js';

const moneyTransformer = {
  from: (value: string | number | null): number => (value == null ? 0 : Number(value)),
  to: (value: number): number => value,
};

@Entity('operating_expenses')
@Index('idx_operating_expenses_competence_month', ['competenceMonth'])
@Index('idx_operating_expenses_status', ['status'])
@Index('idx_operating_expenses_category_id', ['categoryId'])
@Index('idx_operating_expenses_subcategory_id', ['subcategoryId'])
@Index('idx_operating_expenses_project_id', ['projectId'])
@Index('idx_operating_expenses_client_tenant_id', ['clientTenantId'])
@Index('idx_operating_expenses_series_id', ['seriesId'])
@Index('idx_operating_expenses_created_by_user_id', ['createdByUserId'])
@Index('idx_operating_expenses_cancelled_by_user_id', ['cancelledByUserId'])
@Check(
  'chk_operating_expenses_status',
  `"status" IN ('pending', 'paid', 'cancelled')`,
)
@Check(
  'chk_operating_expenses_type',
  `"expense_type" IN ('fixed', 'variable', 'occasional')`,
)
@Check(
  'chk_operating_expenses_amount',
  `"amount_cents" >= 1 AND "amount_cents" <= 99999999999`,
)
@Check(
  'chk_operating_expenses_paid_on',
  `("status" = 'paid' AND "paid_on" IS NOT NULL) OR ("status" = 'pending' AND "paid_on" IS NULL) OR ("status" = 'cancelled')`,
)
@Check(
  'chk_operating_expenses_series_shape',
  `("series_id" IS NULL AND "series_index" IS NULL AND "series_detached" = false) OR ("series_id" IS NOT NULL AND "series_index" IS NOT NULL)`,
)
@Check(
  'chk_operating_expenses_series_index',
  `"series_index" IS NULL OR ("series_index" >= 0 AND "series_index" <= 119)`,
)
@Check(
  'chk_operating_expenses_competence_day',
  `EXTRACT(DAY FROM "competence_month") = 1`,
)
export class OperatingExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'competence_month', type: 'date' })
  competenceMonth: string;

  @Column({ length: 20, name: 'expense_type', type: 'varchar' })
  expenseType: string;

  @Column({ length: 160, name: 'supplier_name', nullable: true, type: 'varchar' })
  supplierName: string | null;

  @Column({ name: 'due_on', nullable: true, type: 'date' })
  dueOn: string | null;

  @Column({ name: 'paid_on', nullable: true, type: 'date' })
  paidOn: string | null;

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

  @Column({ length: 20, type: 'varchar' })
  status: string;

  @Column({ name: 'series_id', nullable: true, type: 'uuid' })
  seriesId: string | null;

  @ManyToOne(() => ExpenseSeries, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'series_id' })
  series: Relation<ExpenseSeries> | null;

  @Column({ name: 'series_index', nullable: true, type: 'int' })
  seriesIndex: number | null;

  @Column({ default: false, name: 'series_detached', type: 'boolean' })
  seriesDetached: boolean;

  @Column({ name: 'created_by_user_id', nullable: true, type: 'uuid' })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: Relation<User> | null;

  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamptz' })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by_user_id', nullable: true, type: 'uuid' })
  cancelledByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cancelled_by_user_id' })
  cancelledBy: Relation<User> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
