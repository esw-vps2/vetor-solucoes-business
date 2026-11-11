import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEnabledActions1760000003000 implements MigrationInterface {
  name = 'AddUserEnabledActions1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "enabled_actions" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "enabled_actions"
    `);
  }
}
