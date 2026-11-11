import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantEmailAndUniqueName1760000005000 implements MigrationInterface {
  name = 'AddTenantEmailAndUniqueName1760000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tenants" ADD "email" character varying(255)',
    );
    await queryRunner.query(
      'ALTER TABLE "tenants" ADD CONSTRAINT "uq_tenants_name" UNIQUE ("name")',
    );
    await queryRunner.query(
      'ALTER TABLE "tenants" ADD CONSTRAINT "uq_tenants_email" UNIQUE ("email")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tenants" DROP CONSTRAINT "uq_tenants_email"',
    );
    await queryRunner.query(
      'ALTER TABLE "tenants" DROP CONSTRAINT "uq_tenants_name"',
    );
    await queryRunner.query('ALTER TABLE "tenants" DROP COLUMN "email"');
  }
}
