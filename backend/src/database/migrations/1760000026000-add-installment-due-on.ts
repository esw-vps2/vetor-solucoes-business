import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstallmentDueOn1760000026000 implements MigrationInterface {
  name = 'AddInstallmentDueOn1760000026000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_contract_installments"
        ADD COLUMN "due_on" date NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_contract_installments"
        DROP COLUMN "due_on"
    `);
  }
}
