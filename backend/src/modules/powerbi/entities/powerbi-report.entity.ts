import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PowerBiReportDistribution } from './powerbi-report-distribution.entity.js';

@Entity('powerbi_reports')
@Index('uq_powerbi_reports_workspace_id_report_id', ['workspaceId', 'reportId'], {
  unique: true,
})
export class PowerBiReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @Column({ name: 'dataset_id', type: 'uuid' })
  datasetId: string;

  @Column({ name: 'embed_url', type: 'varchar', length: 1000 })
  embedUrl: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(
    () => PowerBiReportDistribution,
    (distribution) => distribution.report,
  )
  distributions: PowerBiReportDistribution[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
