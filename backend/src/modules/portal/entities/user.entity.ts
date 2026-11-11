import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('uq_users_tenant_email', ['tenantId', 'email'], { unique: true })
@Index('idx_users_email', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 50, default: 'Usuario' })
  profile: string;

  @Column({ length: 30, default: 'active' })
  status: string;

  @Column({ name: 'first_name', length: 160 })
  firstName: string;

  @Column({ name: 'last_name', length: 160 })
  lastName: string;

  @Column({ length: 160, default: '' })
  cargo: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ length: 1 })
  sex: string;

  @Column({ name: 'photo_url', length: 2048 })
  photoUrl: string;

  @Column({ name: 'enabled_actions', type: 'jsonb', default: () => "'[]'" })
  enabledActions: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
