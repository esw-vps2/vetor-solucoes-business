import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1760000001000 implements MigrationInterface {
  name = 'AddUserProfileFields1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "first_name" character varying(160) NOT NULL DEFAULT '',
        ADD COLUMN "last_name" character varying(160) NOT NULL DEFAULT '',
        ADD COLUMN "age" integer NOT NULL DEFAULT 0,
        ADD COLUMN "sex" character varying(1) NOT NULL DEFAULT 'O',
        ADD COLUMN "photo_url" character varying(2048) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_sex" CHECK ("sex" IN ('M', 'F', 'O'))
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "first_name" DROP DEFAULT,
        ALTER COLUMN "last_name" DROP DEFAULT,
        ALTER COLUMN "age" DROP DEFAULT,
        ALTER COLUMN "sex" DROP DEFAULT,
        ALTER COLUMN "photo_url" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "chk_users_sex"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "photo_url",
        DROP COLUMN "sex",
        DROP COLUMN "age",
        DROP COLUMN "last_name",
        DROP COLUMN "first_name"
    `);
  }
}
