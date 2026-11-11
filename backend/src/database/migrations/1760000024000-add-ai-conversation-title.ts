import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiConversationTitle1760000024000 implements MigrationInterface {
  name = 'AddAiConversationTitle1760000024000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_conversations"
        ADD COLUMN "title" varchar(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_conversations"
        DROP COLUMN "title"
    `);
  }
}
