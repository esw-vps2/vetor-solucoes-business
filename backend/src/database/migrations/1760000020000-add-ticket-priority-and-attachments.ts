import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketPriorityAndAttachments1760000020000 implements MigrationInterface {
  name = 'AddTicketPriorityAndAttachments1760000020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD "priority" character varying(20) NOT NULL DEFAULT 'low'
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "chk_tickets_priority"
      CHECK ("priority" IN ('low', 'medium', 'high'))
    `);
    await queryRunner.query(`
      CREATE TABLE "ticket_attachments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "filename" character varying(255) NOT NULL,
        "content_type" character varying(100) NOT NULL,
        "byte_size" integer NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ticket_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ticket_attachments_ticket" FOREIGN KEY ("ticket_id")
          REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_ticket_attachments_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_attachments_ticket_id" ON "ticket_attachments" ("ticket_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_attachments_created_by_user_id" ON "ticket_attachments" ("created_by_user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ticket_attachments"');
    await queryRunner.query(
      'ALTER TABLE "tickets" DROP CONSTRAINT "chk_tickets_priority"',
    );
    await queryRunner.query('ALTER TABLE "tickets" DROP COLUMN "priority"');
  }
}
