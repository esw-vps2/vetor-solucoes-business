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
import { ExpenseCategory } from './expense-category.entity.js';

@Entity('expense_subcategories')
@Index('idx_expense_subcategories_category_id', ['categoryId'])
@Index('uq_expense_subcategories_category_slug', ['categoryId', 'slug'], {
  unique: true,
})
@Index('uq_expense_subcategories_category_position', ['categoryId', 'position'], {
  unique: true,
})
export class ExpenseSubcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Relation<ExpenseCategory>;

  @Column({ length: 80, type: 'varchar' })
  slug: string;

  @Column({ length: 80, type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  position: number;

  @Column({ default: true, type: 'boolean' })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
