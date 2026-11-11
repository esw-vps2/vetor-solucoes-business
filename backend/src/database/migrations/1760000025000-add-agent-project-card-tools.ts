import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentProjectCardTools1760000025000 implements MigrationInterface {
  name = 'AddAgentProjectCardTools1760000025000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cards"
        ALTER COLUMN "assignee_user_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
        ADD COLUMN "tool_trace" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
        DROP COLUMN "tool_trace"
    `);
    await queryRunner.query(`
      UPDATE "cards"
        SET "assignee_user_id" = "created_by_user_id"
        WHERE "assignee_user_id" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "cards"
        ALTER COLUMN "assignee_user_id" SET NOT NULL
    `);
  }
}
