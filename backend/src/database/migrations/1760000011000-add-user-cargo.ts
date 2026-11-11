import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCargo1760000011000 implements MigrationInterface {
  name = 'AddUserCargo1760000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "cargo" character varying(160) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "cargo" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "cargo"
    `);
  }
}
