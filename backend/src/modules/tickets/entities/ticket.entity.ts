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
import { Tenant } from '../../portal/entities/tenant.entity.js';
import { User } from '../../portal/entities/user.entity.js';
import {
  DEFAULT_TICKET_PRIORITY,
  INITIAL_TICKET_STATUS,
} from '../ticket.constants.js';

@Entity('tickets')
@Index('idx_tickets_tenant_id', ['tenantId'])
@Index('idx_tickets_tenant_updated_created', [
  'tenantId',
  'updatedAt',
  'createdAt',
])
@Index('idx_tickets_tenant_status', ['tenantId', 'status'])
@Index('idx_tickets_tenant_category', ['tenantId', 'category'])
@Index('idx_tickets_opened_by_user_id', ['openedByUserId'])
@Check(
  'chk_tickets_category',
  `"category" IN ('duvida', 'suporte_tecnico', 'erro_falha', 'solicitacao_servico', 'financeiro_cobranca', 'melhoria', 'outros')`,
)
@Check(
  'chk_tickets_status',
  `"status" IN ('aberto', 'em_andamento', 'em_analise', 'resolvido', 'cancelado')`,
)
@Check(
  'chk_tickets_priority',
  `"priority" IN ('low', 'medium', 'high')`,
)
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Relation<Tenant>;

  @Column({ name: 'opened_by_user_id', type: 'uuid' })
  openedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'opened_by_user_id' })
  openedBy: Relation<User>;

  @Column({ length: 160, type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 40, type: 'varchar' })
  category: string;

  @Column({ default: INITIAL_TICKET_STATUS, length: 20, type: 'varchar' })
  status: string;

  @Column({
    default: DEFAULT_TICKET_PRIORITY,
    length: 20,
    type: 'varchar',
  })
  priority: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
