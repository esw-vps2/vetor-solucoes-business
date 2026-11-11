import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantAiPricingAndAttachments1760000023000
  implements MigrationInterface
{
  name = 'AddTenantAiPricingAndAttachments1760000023000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN "ai_token_cost_per_million" numeric(12, 4) NOT NULL DEFAULT 0.6
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_attachments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "conversation_id" uuid NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "message_id" uuid,
        "original_name" varchar(255) NOT NULL,
        "mime_type" varchar(127) NOT NULL,
        "storage_pointer" varchar(512) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ai_attachments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ai_attachments_expires_at"
        ON "ai_attachments" ("expires_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ai_attachments_conversation"
        ON "ai_attachments" ("tenant_id", "conversation_id", "owner_user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_ai_attachments_conversation"`);
    await queryRunner.query(`DROP INDEX "idx_ai_attachments_expires_at"`);
    await queryRunner.query(`DROP TABLE "ai_attachments"`);
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP COLUMN "ai_token_cost_per_million"
    `);
  }
}
