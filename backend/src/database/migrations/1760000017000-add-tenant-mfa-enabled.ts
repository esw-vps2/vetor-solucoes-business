import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantMfaEnabled1760000017000 implements MigrationInterface {
  name = 'AddTenantMfaEnabled1760000017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN "mfa_enabled" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP COLUMN "mfa_enabled"
    `);
  }
}
