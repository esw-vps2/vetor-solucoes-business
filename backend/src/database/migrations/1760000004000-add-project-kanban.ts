import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectKanban1760000004000 implements MigrationInterface {
  name = 'AddProjectKanban1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "project_workspaces" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_workspaces" PRIMARY KEY ("id"),
        CONSTRAINT "fk_project_workspaces_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_workspaces_tenant_id" ON "project_workspaces" ("tenant_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "next_card_number" integer NOT NULL DEFAULT 1,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_projects" PRIMARY KEY ("id"),
        CONSTRAINT "fk_projects_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "project_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "chk_projects_next_card_number" CHECK ("next_card_number" >= 1)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_projects_workspace_id" ON "projects" ("workspace_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "number" integer NOT NULL,
        "title" character varying(120) NOT NULL,
        "description" text NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "assignee_user_id" uuid NOT NULL,
        "due_at" TIMESTAMP WITH TIME ZONE,
        "priority" character varying(10) NOT NULL,
        "lane" character varying(20) NOT NULL,
        "position" integer NOT NULL,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_cards" PRIMARY KEY ("id"),
        CONSTRAINT "uq_cards_project_id_number" UNIQUE ("project_id", "number"),
        CONSTRAINT "fk_cards_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_cards_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_cards_assignee_user" FOREIGN KEY ("assignee_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_cards_priority" CHECK ("priority" IN ('low', 'medium', 'high')),
        CONSTRAINT "chk_cards_lane" CHECK (
          "lane" IN ('backlog', 'ready', 'working', 'review', 'deploy', 'done')
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_cards_project_id" ON "cards" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_cards_project_id_lane_position" ON "cards" ("project_id", "lane", "position")',
    );
    await queryRunner.query(`
      CREATE TABLE "card_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "card_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "body" character varying(4000) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_card_comments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_card_comments_card" FOREIGN KEY ("card_id")
          REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_card_comments_author_user" FOREIGN KEY ("author_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_card_comments_card_id" ON "card_comments" ("card_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "card_attachments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "card_id" uuid NOT NULL,
        "filename" character varying(255) NOT NULL,
        "content_type" character varying(100) NOT NULL,
        "byte_size" integer NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_card_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_card_attachments_card" FOREIGN KEY ("card_id")
          REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_card_attachments_card_id" ON "card_attachments" ("card_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "card_attachments"');
    await queryRunner.query('DROP TABLE "card_comments"');
    await queryRunner.query('DROP TABLE "cards"');
    await queryRunner.query('DROP TABLE "projects"');
    await queryRunner.query('DROP TABLE "project_workspaces"');
  }
}
