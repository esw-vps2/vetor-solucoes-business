import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../portal/entities/tenant.entity.js';
import { PowerBiReport } from './powerbi-report.entity.js';

@Entity('powerbi_report_distributions')
@Index(
  'uq_powerbi_report_distributions_report_id_tenant_id',
  ['reportId', 'tenantId'],
  { unique: true },
)
@Index('idx_powerbi_report_distributions_report_id', ['reportId'])
@Index('idx_powerbi_report_distributions_tenant_id', ['tenantId'])
export class PowerBiReportDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => PowerBiReport, (report) => report.distributions, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'report_id' })
  report: PowerBiReport;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'display_name', type: 'varchar', length: 255, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'default_page', type: 'varchar', length: 255, nullable: true })
  defaultPage: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
