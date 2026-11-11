import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortalTables1760000000000 implements MigrationInterface {
  name = 'CreatePortalTables1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(160) NOT NULL,
        "slug" character varying(80) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "uq_tenants_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "profile" character varying(50) NOT NULL DEFAULT 'Usuario',
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "fk_users_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_users_email" ON "users" ("email")',
    );
    await queryRunner.query(`
      CREATE TABLE "refresh_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_refresh_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_refresh_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_refresh_sessions_user_id" ON "refresh_sessions" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_refresh_sessions_token_hash" ON "refresh_sessions" ("token_hash")',
    );
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "fk_password_reset_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash")',
    );
    await queryRunner.query(`
      CREATE TABLE "security_audit_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "tenant_id" uuid,
        "event_type" character varying(100) NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_security_audit_events" PRIMARY KEY ("id"),
        CONSTRAINT "fk_security_audit_events_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_security_audit_events_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_security_audit_events_user_id" ON "security_audit_events" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_security_audit_events_tenant_id" ON "security_audit_events" ("tenant_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "security_audit_events"');
    await queryRunner.query('DROP TABLE "password_reset_tokens"');
    await queryRunner.query('DROP TABLE "refresh_sessions"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "tenants"');
  }
}
