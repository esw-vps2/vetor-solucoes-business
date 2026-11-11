import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardStartsAt1760000012000 implements MigrationInterface {
  name = 'AddCardStartsAt1760000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cards"
        ADD COLUMN "starts_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cards"
        DROP COLUMN "starts_at"
    `);
  }
}
