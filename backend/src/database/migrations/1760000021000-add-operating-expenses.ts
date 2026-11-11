import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperatingExpenses1760000021000 implements MigrationInterface {
  name = 'AddOperatingExpenses1760000021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "expense_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(80) NOT NULL,
        "name" character varying(80) NOT NULL,
        "position" integer NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_expense_categories" PRIMARY KEY ("id"),
        CONSTRAINT "uq_expense_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "uq_expense_categories_position" UNIQUE ("position")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_expense_categories_name_ci"
      ON "expense_categories" (lower("name"))
    `);
    await queryRunner.query(`
      CREATE TABLE "expense_subcategories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL,
        "slug" character varying(80) NOT NULL,
        "name" character varying(80) NOT NULL,
        "position" integer NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_expense_subcategories" PRIMARY KEY ("id"),
        CONSTRAINT "uq_expense_subcategories_category_slug" UNIQUE ("category_id", "slug"),
        CONSTRAINT "uq_expense_subcategories_category_position" UNIQUE ("category_id", "position"),
        CONSTRAINT "fk_expense_subcategories_category" FOREIGN KEY ("category_id")
          REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_subcategories_category_id"
      ON "expense_subcategories" ("category_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_expense_subcategories_name_ci"
      ON "expense_subcategories" ("category_id", lower("name"))
    `);
    await queryRunner.query(`
      CREATE TABLE "expense_series" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "interval" character varying(20) NOT NULL,
        "occurrence_count" integer NOT NULL,
        "starts_on" date NOT NULL,
        "description" character varying(160) NOT NULL,
        "category_id" uuid NOT NULL,
        "subcategory_id" uuid,
        "amount_cents" bigint NOT NULL,
        "expense_type" character varying(20) NOT NULL,
        "supplier_name" character varying(160),
        "payment_method" character varying(80),
        "notes" character varying(2000),
        "client_tenant_id" uuid,
        "project_id" uuid,
        "active" boolean NOT NULL DEFAULT true,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_expense_series" PRIMARY KEY ("id"),
        CONSTRAINT "chk_expense_series_interval" CHECK ("interval" IN ('monthly', 'yearly')),
        CONSTRAINT "chk_expense_series_count" CHECK ("occurrence_count" >= 1 AND "occurrence_count" <= 120),
        CONSTRAINT "chk_expense_series_amount" CHECK ("amount_cents" >= 1 AND "amount_cents" <= 99999999999),
        CONSTRAINT "chk_expense_series_type" CHECK ("expense_type" IN ('fixed', 'variable', 'occasional')),
        CONSTRAINT "fk_expense_series_category" FOREIGN KEY ("category_id")
          REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_expense_series_subcategory" FOREIGN KEY ("subcategory_id")
          REFERENCES "expense_subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_expense_series_client_tenant" FOREIGN KEY ("client_tenant_id")
          REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_expense_series_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_expense_series_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_series_category_id" ON "expense_series" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_series_subcategory_id" ON "expense_series" ("subcategory_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_series_client_tenant_id" ON "expense_series" ("client_tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_series_project_id" ON "expense_series" ("project_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_expense_series_created_by_user_id" ON "expense_series" ("created_by_user_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "operating_expenses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "description" character varying(160) NOT NULL,
        "category_id" uuid NOT NULL,
        "subcategory_id" uuid,
        "amount_cents" bigint NOT NULL,
        "competence_month" date NOT NULL,
        "expense_type" character varying(20) NOT NULL,
        "supplier_name" character varying(160),
        "due_on" date,
        "paid_on" date,
        "payment_method" character varying(80),
        "notes" character varying(2000),
        "client_tenant_id" uuid,
        "project_id" uuid,
        "status" character varying(20) NOT NULL,
        "series_id" uuid,
        "series_index" integer,
        "series_detached" boolean NOT NULL DEFAULT false,
        "created_by_user_id" uuid,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_by_user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_operating_expenses" PRIMARY KEY ("id"),
        CONSTRAINT "chk_operating_expenses_status" CHECK ("status" IN ('pending', 'paid', 'cancelled')),
        CONSTRAINT "chk_operating_expenses_type" CHECK ("expense_type" IN ('fixed', 'variable', 'occasional')),
        CONSTRAINT "chk_operating_expenses_amount" CHECK ("amount_cents" >= 1 AND "amount_cents" <= 99999999999),
        CONSTRAINT "chk_operating_expenses_paid_on" CHECK (
          ("status" = 'paid' AND "paid_on" IS NOT NULL)
          OR ("status" = 'pending' AND "paid_on" IS NULL)
          OR ("status" = 'cancelled')
        ),
        CONSTRAINT "chk_operating_expenses_series_shape" CHECK (
          ("series_id" IS NULL AND "series_index" IS NULL AND "series_detached" = false)
          OR ("series_id" IS NOT NULL AND "series_index" IS NOT NULL)
        ),
        CONSTRAINT "chk_operating_expenses_series_index" CHECK (
          "series_index" IS NULL OR ("series_index" >= 0 AND "series_index" <= 119)
        ),
        CONSTRAINT "chk_operating_expenses_competence_day" CHECK (EXTRACT(DAY FROM "competence_month") = 1),
        CONSTRAINT "fk_operating_expenses_category" FOREIGN KEY ("category_id")
          REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_subcategory" FOREIGN KEY ("subcategory_id")
          REFERENCES "expense_subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_client_tenant" FOREIGN KEY ("client_tenant_id")
          REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_project" FOREIGN KEY ("project_id")
          REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_series" FOREIGN KEY ("series_id")
          REFERENCES "expense_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expenses_cancelled_by_user" FOREIGN KEY ("cancelled_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_operating_expenses_series_competence"
      ON "operating_expenses" ("series_id", "competence_month")
      WHERE "series_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_operating_expenses_series_index"
      ON "operating_expenses" ("series_id", "series_index")
      WHERE "series_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_competence_month" ON "operating_expenses" ("competence_month")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_status" ON "operating_expenses" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_category_id" ON "operating_expenses" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_subcategory_id" ON "operating_expenses" ("subcategory_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_project_id" ON "operating_expenses" ("project_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_client_tenant_id" ON "operating_expenses" ("client_tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_series_id" ON "operating_expenses" ("series_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_paid_on" ON "operating_expenses" ("paid_on")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_created_by_user_id" ON "operating_expenses" ("created_by_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expenses_cancelled_by_user_id" ON "operating_expenses" ("cancelled_by_user_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "operating_expense_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "expense_id" uuid NOT NULL,
        "storage_filename" character varying(255) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "content_type" character varying(200) NOT NULL,
        "byte_size" integer NOT NULL,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_operating_expense_documents" PRIMARY KEY ("id"),
        CONSTRAINT "chk_operating_expense_documents_byte_size" CHECK (
          "byte_size" >= 1 AND "byte_size" <= 26214400
        ),
        CONSTRAINT "fk_operating_expense_documents_expense" FOREIGN KEY ("expense_id")
          REFERENCES "operating_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_operating_expense_documents_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expense_documents_expense_id"
      ON "operating_expense_documents" ("expense_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_operating_expense_documents_created_by_user_id"
      ON "operating_expense_documents" ("created_by_user_id")
    `);
    await queryRunner.query(`
      INSERT INTO "expense_categories" ("slug", "name", "position")
      VALUES
        ('infraestrutura-e-cloud', 'Infraestrutura e Cloud', 1),
        ('ia-e-apis', 'IA e APIs', 2),
        ('marketing-e-aquisicao', 'Marketing e aquisição', 3),
        ('software-e-licencas', 'Software e licenças', 4),
        ('servicos-e-operacao', 'Serviços e operação', 5)
      ON CONFLICT ("slug") DO NOTHING
    `);
    await this.seedSubcategories(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "operating_expense_documents"');
    await queryRunner.query('DROP TABLE "operating_expenses"');
    await queryRunner.query('DROP TABLE "expense_series"');
    await queryRunner.query('DROP TABLE "expense_subcategories"');
    await queryRunner.query('DROP TABLE "expense_categories"');
  }

  private async seedSubcategories(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<[string, string, string, number]> = [
      ['infraestrutura-e-cloud', 'vps-e-servidores', 'VPS e servidores', 1],
      ['infraestrutura-e-cloud', 'aws-e-outros-provedores-cloud', 'AWS e outros provedores cloud', 2],
      ['infraestrutura-e-cloud', 'dominios-e-dns', 'Domínios e DNS', 3],
      ['infraestrutura-e-cloud', 'armazenamento-e-monitoramento', 'Armazenamento e monitoramento', 4],
      ['ia-e-apis', 'tokens-de-llm', 'Tokens de LLM', 1],
      ['ia-e-apis', 'assinaturas-de-ia', 'Assinaturas de IA', 2],
      ['ia-e-apis', 'consumo-de-apis', 'Consumo de APIs', 3],
      ['ia-e-apis', 'outros-servicos-de-ia', 'Outros serviços de IA', 4],
      ['marketing-e-aquisicao', 'meta-ads', 'Meta Ads', 1],
      ['marketing-e-aquisicao', 'google-ads', 'Google Ads', 2],
      ['marketing-e-aquisicao', 'ferramentas-de-marketing', 'Ferramentas de marketing', 3],
      ['marketing-e-aquisicao', 'producao-de-conteudo', 'Produção de conteúdo', 4],
      ['software-e-licencas', 'ferramentas-de-desenvolvimento', 'Ferramentas de desenvolvimento', 1],
      ['software-e-licencas', 'assinaturas-saas', 'Assinaturas SaaS', 2],
      ['software-e-licencas', 'ferramentas-de-bi', 'Ferramentas de BI', 3],
      ['software-e-licencas', 'licencas-corporativas', 'Licenças corporativas', 4],
      ['servicos-e-operacao', 'contabilidade', 'Contabilidade', 1],
      ['servicos-e-operacao', 'consultores-e-freelancers', 'Consultores e freelancers', 2],
      ['servicos-e-operacao', 'servicos-terceirizados', 'Serviços terceirizados', 3],
      ['servicos-e-operacao', 'despesas-administrativas', 'Despesas administrativas', 4],
    ];

    for (const [categorySlug, slug, name, position] of rows) {
      await queryRunner.query(
        `
          INSERT INTO "expense_subcategories" ("category_id", "slug", "name", "position")
          SELECT "id", $1, $2, $3
          FROM "expense_categories"
          WHERE "slug" = $4
          ON CONFLICT ("category_id", "slug") DO NOTHING
        `,
        [slug, name, position, categorySlug],
      );
    }
  }
}
