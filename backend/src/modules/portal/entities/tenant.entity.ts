import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
@Index('uq_tenants_name', ['name'], { unique: true })
@Index('uq_tenants_slug', ['slug'], { unique: true })
@Index('uq_tenants_email', ['email'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 80 })
  slug: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  email: string | null;

  @Column({ default: '', length: 255, name: 'photo_url' })
  photoUrl: string;

  @Column({ default: false, name: 'mfa_enabled' })
  mfaEnabled: boolean;

  @Column({
    default: 0.6,
    name: 'ai_token_cost_per_million',
    precision: 12,
    scale: 4,
    type: 'numeric',
  })
  aiTokenCostPerMillion: string;

  @Column({ length: 30, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
