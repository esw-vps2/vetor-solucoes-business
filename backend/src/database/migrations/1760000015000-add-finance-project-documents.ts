import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceProjectDocuments1760000015000 implements MigrationInterface {
  name = 'AddFinanceProjectDocuments1760000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "finance_project_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "storage_filename" character varying(255) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "content_type" character varying(200) NOT NULL,
        "byte_size" integer NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_finance_project_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_finance_project_documents_project"
          FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_finance_project_documents_tenant"
          FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_finance_project_documents_created_by_user"
          FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_finance_project_documents_byte_size"
          CHECK ("byte_size" BETWEEN 1 AND 26214400)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_finance_project_documents_project_id" ON "finance_project_documents" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_finance_project_documents_tenant_id" ON "finance_project_documents" ("tenant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_finance_project_documents_created_by_user_id" ON "finance_project_documents" ("created_by_user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "finance_project_documents"');
  }
}
