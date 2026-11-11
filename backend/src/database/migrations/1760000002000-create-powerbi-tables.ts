import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePowerbiTables1760000002000 implements MigrationInterface {
  name = 'CreatePowerbiTables1760000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "powerbi_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL,
        "report_id" uuid NOT NULL,
        "dataset_id" uuid NOT NULL,
        "embed_url" character varying(1000) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" character varying(500),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_powerbi_reports" PRIMARY KEY ("id"),
        CONSTRAINT "uq_powerbi_reports_workspace_id_report_id"
          UNIQUE ("workspace_id", "report_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "powerbi_report_distributions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "display_name" character varying(255),
        "icon" character varying(100),
        "sort_order" integer NOT NULL DEFAULT 0,
        "default_page" character varying(255),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_powerbi_report_distributions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_powerbi_report_distributions_report_id_tenant_id"
          UNIQUE ("report_id", "tenant_id"),
        CONSTRAINT "fk_powerbi_report_distributions_report" FOREIGN KEY ("report_id")
          REFERENCES "powerbi_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_powerbi_report_distributions_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_powerbi_report_distributions_report_id" ON "powerbi_report_distributions" ("report_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_powerbi_report_distributions_tenant_id" ON "powerbi_report_distributions" ("tenant_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "powerbi_report_distributions"');
    await queryRunner.query('DROP TABLE "powerbi_reports"');
  }
}
