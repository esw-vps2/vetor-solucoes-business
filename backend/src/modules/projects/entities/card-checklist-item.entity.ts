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
import { Card } from './card.entity.js';
import { User } from '../../portal/entities/user.entity.js';

@Entity('card_checklist_items')
@Index('idx_card_checklist_items_card_id', ['cardId'])
export class CardChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.checklistItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Relation<Card>;

  @Column({ type: 'varchar', length: 200 })
  body: string;

  @Column({ type: 'boolean', default: false })
  done: boolean;

  @Column({ type: 'int' })
  position: number;

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
