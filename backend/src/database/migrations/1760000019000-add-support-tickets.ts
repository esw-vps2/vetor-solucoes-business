import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportTickets1760000019000 implements MigrationInterface {
  name = 'AddSupportTickets1760000019000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "opened_by_user_id" uuid NOT NULL,
        "title" character varying(160) NOT NULL,
        "description" text NOT NULL,
        "category" character varying(40) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'aberto',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "fk_tickets_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_tickets_opened_by_user" FOREIGN KEY ("opened_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_tickets_category" CHECK (
          "category" IN (
            'duvida',
            'suporte_tecnico',
            'erro_falha',
            'solicitacao_servico',
            'financeiro_cobranca',
            'melhoria',
            'outros'
          )
        ),
        CONSTRAINT "chk_tickets_status" CHECK (
          "status" IN (
            'aberto',
            'em_andamento',
            'em_analise',
            'resolvido',
            'cancelado'
          )
        )
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_tickets_tenant_id" ON "tickets" ("tenant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_tickets_tenant_updated_created" ON "tickets" ("tenant_id", "updated_at" DESC, "created_at" DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_tickets_tenant_status" ON "tickets" ("tenant_id", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_tickets_tenant_category" ON "tickets" ("tenant_id", "category")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_tickets_opened_by_user_id" ON "tickets" ("opened_by_user_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "ticket_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "body" character varying(5000) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ticket_comments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_ticket_comments_ticket" FOREIGN KEY ("ticket_id")
          REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_ticket_comments_author_user" FOREIGN KEY ("author_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_comments_ticket_created" ON "ticket_comments" ("ticket_id", "created_at" DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_comments_author_user_id" ON "ticket_comments" ("author_user_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "ticket_read_states" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_ticket_read_states" PRIMARY KEY ("id"),
        CONSTRAINT "uq_ticket_read_states_ticket_user" UNIQUE ("ticket_id", "user_id"),
        CONSTRAINT "fk_ticket_read_states_ticket" FOREIGN KEY ("ticket_id")
          REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_ticket_read_states_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_read_states_ticket_id" ON "ticket_read_states" ("ticket_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_ticket_read_states_user_id" ON "ticket_read_states" ("user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ticket_read_states"');
    await queryRunner.query('DROP TABLE "ticket_comments"');
    await queryRunner.query('DROP TABLE "tickets"');
  }
}
