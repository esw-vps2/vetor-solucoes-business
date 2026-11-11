import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstallmentAmountsAndCostLines1760000016000 implements MigrationInterface {
  name = 'AddInstallmentAmountsAndCostLines1760000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "project_contract_installments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "position" integer NOT NULL,
        "amount_cents" bigint NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_contract_installments" PRIMARY KEY ("id"),
        CONSTRAINT "uq_project_contract_installments_project_position" UNIQUE ("project_id", "position"),
        CONSTRAINT "fk_project_contract_installments_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_contract_installments_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_project_contract_installments_position" CHECK (
          "position" BETWEEN 1 AND 120
        ),
        CONSTRAINT "chk_project_contract_installments_amount_cents" CHECK (
          "amount_cents" BETWEEN 0 AND 99999999999
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_contract_installments_project_id" ON "project_contract_installments" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_project_contract_installments_created_by_user_id" ON "project_contract_installments" ("created_by_user_id")',
    );
    await queryRunner.query(`
      ALTER TABLE "project_costs"
        ADD COLUMN "label" character varying(80),
        ADD COLUMN "position" integer
    `);
    await queryRunner.query(`
      UPDATE "project_costs"
      SET "label" = CASE
        WHEN "note" IS NOT NULL AND btrim("note") <> '' THEN left(btrim("note"), 80)
        WHEN "category" = 'team' THEN 'Equipe'
        WHEN "category" = 'third_party' THEN 'Terceiro'
        WHEN "category" = 'infrastructure' THEN 'Infraestrutura'
        ELSE 'Outro'
      END
    `);
    await queryRunner.query(`
      WITH "ranked" AS (
        SELECT
          "id",
          row_number() OVER (
            PARTITION BY "project_id"
            ORDER BY "created_at" ASC, "id" ASC
          ) AS "position"
        FROM "project_costs"
      )
      UPDATE "project_costs" AS "cost"
      SET "position" = "ranked"."position"
      FROM "ranked"
      WHERE "cost"."id" = "ranked"."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_costs"
        ALTER COLUMN "label" SET NOT NULL,
        ALTER COLUMN "position" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "project_costs"
        ADD CONSTRAINT "chk_project_costs_label" CHECK (char_length("label") BETWEEN 1 AND 80),
        ADD CONSTRAINT "chk_project_costs_position" CHECK ("position" BETWEEN 1 AND 500),
        ADD CONSTRAINT "uq_project_costs_project_id_position" UNIQUE ("project_id", "position")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_costs"
        DROP CONSTRAINT "uq_project_costs_project_id_position",
        DROP CONSTRAINT "chk_project_costs_position",
        DROP CONSTRAINT "chk_project_costs_label",
        DROP COLUMN "position",
        DROP COLUMN "label"
    `);
    await queryRunner.query('DROP TABLE "project_contract_installments"');
  }
}
