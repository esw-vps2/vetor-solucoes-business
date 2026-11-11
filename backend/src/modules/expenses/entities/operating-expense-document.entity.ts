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
import { OperatingExpense } from './operating-expense.entity.js';

@Entity('operating_expense_documents')
@Index('idx_operating_expense_documents_expense_id', ['expenseId'])
@Index('idx_operating_expense_documents_created_by_user_id', ['createdByUserId'])
export class OperatingExpenseDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id', type: 'uuid' })
  expenseId: string;

  @ManyToOne(() => OperatingExpense, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Relation<OperatingExpense>;

  @Column({ length: 255, name: 'storage_filename', type: 'varchar' })
  storageFilename: string;

  @Column({ length: 255, name: 'original_name', type: 'varchar' })
  originalName: string;

  @Column({ length: 200, name: 'content_type', type: 'varchar' })
  contentType: string;

  @Column({ name: 'byte_size', type: 'int' })
  byteSize: number;

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
