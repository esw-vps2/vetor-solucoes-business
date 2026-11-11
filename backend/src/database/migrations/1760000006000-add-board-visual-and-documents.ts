import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardVisualAndDocuments1760000006000 implements MigrationInterface {
  name = 'AddBoardVisualAndDocuments1760000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN "background_filename" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "card_attachments"
      ADD COLUMN "created_by_user_id" uuid
    `);
    await queryRunner.query(`
      UPDATE "card_attachments" AS attachment
      SET "created_by_user_id" = card."created_by_user_id"
      FROM "cards" AS card
      WHERE card."id" = attachment."card_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "card_attachments"
      ALTER COLUMN "created_by_user_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "card_attachments"
      ADD CONSTRAINT "fk_card_attachments_created_by_user"
      FOREIGN KEY ("created_by_user_id")
      REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      UPDATE "cards"
      SET "tags" = COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', tag.value,
            'color', (ARRAY['lime','sky','pink','amber','violet','teal','coral','navy'])[
              (abs(hashtext(tag.value)) % 8) + 1
            ]
          )
        )
        FROM jsonb_array_elements_text("cards"."tags") AS tag(value)
        WHERE jsonb_typeof("cards"."tags") = 'array'
          AND jsonb_typeof("cards"."tags" -> 0) = 'string'
      ), "cards"."tags")
    `);
    await queryRunner.query(`
      ALTER TABLE "cards"
      ADD COLUMN "cover_attachment_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "cards"
      ADD CONSTRAINT "fk_cards_cover_attachment"
      FOREIGN KEY ("cover_attachment_id")
      REFERENCES "card_attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      CREATE TABLE "card_checklist_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "card_id" uuid NOT NULL,
        "body" character varying(200) NOT NULL,
        "done" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_card_checklist_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_card_checklist_items_card" FOREIGN KEY ("card_id")
          REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_card_checklist_items_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_card_checklist_items_card_id" ON "card_checklist_items" ("card_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "project_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "parent_id" uuid,
        "kind" character varying(16) NOT NULL,
        "original_name" character varying(120) NOT NULL,
        "filename" character varying(255),
        "content_type" character varying(200),
        "byte_size" integer NOT NULL DEFAULT 0,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_project_documents_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_documents_parent" FOREIGN KEY ("parent_id")
          REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_project_documents_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_project_documents_kind" CHECK ("kind" IN ('file', 'folder'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_documents_project_id" ON "project_documents" ("project_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_project_documents_parent_id" ON "project_documents" ("parent_id")',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_project_documents_siblings"
      ON "project_documents" (
        "project_id",
        COALESCE("parent_id", '00000000-0000-0000-0000-000000000000'),
        "original_name"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "project_documents"');
    await queryRunner.query('DROP TABLE "card_checklist_items"');
    await queryRunner.query(
      'ALTER TABLE "cards" DROP CONSTRAINT "fk_cards_cover_attachment"',
    );
    await queryRunner.query(
      'ALTER TABLE "cards" DROP COLUMN "cover_attachment_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "card_attachments" DROP CONSTRAINT "fk_card_attachments_created_by_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "card_attachments" DROP COLUMN "created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "projects" DROP COLUMN "background_filename"',
    );
  }
}
