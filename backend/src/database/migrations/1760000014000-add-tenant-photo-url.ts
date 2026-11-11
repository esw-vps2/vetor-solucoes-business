import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantPhotoUrl1760000014000 implements MigrationInterface {
  name = 'AddTenantPhotoUrl1760000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN "photo_url" character varying(255) NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP COLUMN "photo_url"
    `);
  }
}
