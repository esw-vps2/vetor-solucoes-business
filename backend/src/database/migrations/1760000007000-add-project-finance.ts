import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectFinance1760000007000 implements MigrationInterface {
  name = 'AddProjectFinance1760000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "project_contracts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "title" character varying(160) NOT NULL,
        "signed_on" date,
        "starts_on" date,
        "ends_on" date,
        "total_amount_cents" bigint NOT NULL,
        "status" character varying(30) NOT NULL,
        "contract_filename" character varying(255),
        "original_name" character varying(255),
        "byte_size" integer,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_contracts" PRIMARY KEY ("id"),
        CONSTRAINT "uq_project_contracts_project_id" UNIQUE ("project_id"),
        CONSTRAINT "fk_project_contracts_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_contracts_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_project_contracts_status" CHECK (
          "status" IN ('draft', 'active', 'closed', 'cancelled')
        ),
        CONSTRAINT "chk_project_contracts_total_amount_cents" CHECK (
          "total_amount_cents" BETWEEN 0 AND 99999999999
        ),
        CONSTRAINT "chk_project_contracts_byte_size" CHECK (
          "byte_size" IS NULL OR "byte_size" BETWEEN 1 AND 10485760
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_contracts_created_by_user_id" ON "project_contracts" ("created_by_user_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "project_payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "paid_on" date NOT NULL,
        "amount_cents" bigint NOT NULL,
        "note" character varying(500),
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_payments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_project_payments_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_payments_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_project_payments_amount_cents" CHECK (
          "amount_cents" BETWEEN 1 AND 99999999999
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_payments_project_id" ON "project_payments" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_project_payments_created_by_user_id" ON "project_payments" ("created_by_user_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "project_costs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "incurred_on" date NOT NULL,
        "amount_cents" bigint NOT NULL,
        "category" character varying(30) NOT NULL,
        "note" character varying(500),
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_costs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_project_costs_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_costs_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_project_costs_amount_cents" CHECK (
          "amount_cents" BETWEEN 1 AND 99999999999
        ),
        CONSTRAINT "chk_project_costs_category" CHECK (
          "category" IN ('team', 'third_party', 'infrastructure', 'other')
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_costs_project_id" ON "project_costs" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_project_costs_created_by_user_id" ON "project_costs" ("created_by_user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "project_costs"');
    await queryRunner.query('DROP TABLE "project_payments"');
    await queryRunner.query('DROP TABLE "project_contracts"');
  }
}
