import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMfaEmailChallenges1760000010000 implements MigrationInterface {
  name = 'AddMfaEmailChallenges1760000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mfa_email_challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "failed_attempts" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mfa_email_challenges" PRIMARY KEY ("id"),
        CONSTRAINT "fk_mfa_email_challenges_users" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_mfa_email_challenges_user_id" ON "mfa_email_challenges" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_mfa_email_challenges_token_hash" ON "mfa_email_challenges" ("token_hash")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "mfa_email_challenges"');
  }
}
