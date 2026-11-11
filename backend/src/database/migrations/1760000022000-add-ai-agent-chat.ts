import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiAgentChat1760000022000 implements MigrationInterface {
  name = 'AddAiAgentChat1760000022000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_users_tenant_id_id" ON "users" ("tenant_id", "id")
    `);
    await queryRunner.query(`
      CREATE TABLE "ai_conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ai_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ai_conversations_tenant_id" UNIQUE ("tenant_id", "id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ai_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "conversation_id" uuid NOT NULL,
        "run_id" uuid NOT NULL,
        "sequence" integer NOT NULL,
        "role" character varying(16) NOT NULL,
        "content" text NOT NULL,
        "author_user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ai_messages" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ai_messages_tenant_id" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "uq_ai_messages_sequence" UNIQUE ("tenant_id", "conversation_id", "sequence"),
        CONSTRAINT "ck_ai_messages_sequence" CHECK ("sequence" >= 1),
        CONSTRAINT "ck_ai_messages_content" CHECK (char_length("content") BETWEEN 1 AND 8000),
        CONSTRAINT "ck_ai_messages_role" CHECK (
          ("role" = 'user' AND "author_user_id" IS NOT NULL)
          OR ("role" = 'assistant' AND "author_user_id" IS NULL)
        )
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ai_runs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "conversation_id" uuid NOT NULL,
        "requester_user_id" uuid NOT NULL,
        "user_message_id" uuid NOT NULL,
        "assistant_message_id" uuid,
        "idempotency_key" character varying(128),
        "status" character varying(16) NOT NULL,
        "provider" character varying(32) NOT NULL,
        "requested_model" character varying(160) NOT NULL,
        "effective_model" character varying(160),
        "input_tokens" integer,
        "output_tokens" integer,
        "duration_ms" bigint,
        "attempt" integer NOT NULL DEFAULT 0,
        "lease_expires_at" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "error_code" character varying(64),
        "error_message" character varying(240),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ai_runs" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ai_runs_tenant_id" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "ck_ai_runs_status" CHECK ("status" IN ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED')),
        CONSTRAINT "ck_ai_runs_provider" CHECK ("provider" = 'openrouter'),
        CONSTRAINT "ck_ai_runs_attempt" CHECK ("attempt" >= 0),
        CONSTRAINT "ck_ai_runs_input_tokens" CHECK ("input_tokens" IS NULL OR "input_tokens" >= 0),
        CONSTRAINT "ck_ai_runs_output_tokens" CHECK ("output_tokens" IS NULL OR "output_tokens" >= 0),
        CONSTRAINT "ck_ai_runs_duration" CHECK ("duration_ms" IS NULL OR "duration_ms" >= 0)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "run_id" uuid NOT NULL,
        "event_type" character varying(64) NOT NULL,
        "payload" jsonb NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "available_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "last_error" character varying(120),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_outbox_events" PRIMARY KEY ("id"),
        CONSTRAINT "uq_outbox_events_tenant_id" UNIQUE ("tenant_id", "id"),
        CONSTRAINT "ck_outbox_events_attempt" CHECK ("attempt_count" >= 0),
        CONSTRAINT "ck_outbox_events_type" CHECK ("event_type" = 'ai.run.requested'),
        CONSTRAINT "ck_outbox_events_payload" CHECK (
          jsonb_typeof("payload") = 'object'
          AND "payload" ? 'version'
          AND "payload" ? 'runId'
          AND NOT ("payload" ? 'content')
          AND NOT ("payload" ? 'apiKey')
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_conversations_owner_updated"
      ON "ai_conversations" ("tenant_id", "owner_user_id", "updated_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_messages_conversation"
      ON "ai_messages" ("tenant_id", "conversation_id", "sequence")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_ai_messages_one_assistant_run"
      ON "ai_messages" ("tenant_id", "run_id")
      WHERE "role" = 'assistant'
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_runs_conversation_status"
      ON "ai_runs" ("tenant_id", "conversation_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_runs_requester_created"
      ON "ai_runs" ("tenant_id", "requester_user_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_runs_status_created"
      ON "ai_runs" ("status", "created_at")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_ai_runs_one_active"
      ON "ai_runs" ("tenant_id", "conversation_id")
      WHERE "status" IN ('QUEUED', 'PROCESSING')
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_ai_runs_idempotency"
      ON "ai_runs" ("tenant_id", "conversation_id", "requester_user_id", "idempotency_key")
      WHERE "idempotency_key" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_outbox_events_run"
      ON "outbox_events" ("tenant_id", "run_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_outbox_events_available"
      ON "outbox_events" ("published_at", "available_at", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_outbox_events_unpublished"
      ON "outbox_events" ("available_at", "created_at")
      WHERE "published_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_conversations"
      ADD CONSTRAINT "fk_ai_conversations_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_conversations"
      ADD CONSTRAINT "fk_ai_conversations_owner"
      FOREIGN KEY ("tenant_id", "owner_user_id") REFERENCES "users"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_messages"
      ADD CONSTRAINT "fk_ai_messages_conversation"
      FOREIGN KEY ("tenant_id", "conversation_id") REFERENCES "ai_conversations"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_messages"
      ADD CONSTRAINT "fk_ai_messages_author"
      FOREIGN KEY ("tenant_id", "author_user_id") REFERENCES "users"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
      ADD CONSTRAINT "fk_ai_runs_conversation"
      FOREIGN KEY ("tenant_id", "conversation_id") REFERENCES "ai_conversations"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
      ADD CONSTRAINT "fk_ai_runs_requester"
      FOREIGN KEY ("tenant_id", "requester_user_id") REFERENCES "users"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_messages"
      ADD CONSTRAINT "fk_ai_messages_run"
      FOREIGN KEY ("tenant_id", "run_id") REFERENCES "ai_runs"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
      DEFERRABLE INITIALLY DEFERRED
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
      ADD CONSTRAINT "fk_ai_runs_user_message"
      FOREIGN KEY ("tenant_id", "user_message_id") REFERENCES "ai_messages"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
      DEFERRABLE INITIALLY DEFERRED
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs"
      ADD CONSTRAINT "fk_ai_runs_assistant_message"
      FOREIGN KEY ("tenant_id", "assistant_message_id") REFERENCES "ai_messages"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
      DEFERRABLE INITIALLY DEFERRED
    `);
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ADD CONSTRAINT "fk_outbox_events_run"
      FOREIGN KEY ("tenant_id", "run_id") REFERENCES "ai_runs"("tenant_id", "id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(`
      ALTER TABLE "ai_runs" DROP CONSTRAINT "fk_ai_runs_user_message"
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_runs" DROP CONSTRAINT "fk_ai_runs_assistant_message"
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_messages" DROP CONSTRAINT "fk_ai_messages_run"
    `);
    await queryRunner.query(`DROP TABLE "ai_runs"`);
    await queryRunner.query(`DROP TABLE "ai_messages"`);
    await queryRunner.query(`DROP TABLE "ai_conversations"`);
    await queryRunner.query(`DROP INDEX "uq_users_tenant_id_id"`);
  }
}
