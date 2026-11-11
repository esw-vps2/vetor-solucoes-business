import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('expense_categories')
@Index('uq_expense_categories_slug', ['slug'], { unique: true })
@Index('uq_expense_categories_position', ['position'], { unique: true })
export class ExpenseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
