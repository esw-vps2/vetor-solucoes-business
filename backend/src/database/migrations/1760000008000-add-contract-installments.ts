import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractInstallments1760000008000 implements MigrationInterface {
  name = 'AddContractInstallments1760000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_contracts"
      ADD COLUMN "installment_count" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "project_contracts"
      ADD CONSTRAINT "chk_project_contracts_installment_count"
      CHECK ("installment_count" BETWEEN 1 AND 120)
    `);
    await queryRunner.query(`
      ALTER TABLE "project_contracts" ALTER COLUMN "installment_count" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_contracts"
      DROP CONSTRAINT "chk_project_contracts_installment_count"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_contracts" DROP COLUMN "installment_count"
    `);
  }
}
