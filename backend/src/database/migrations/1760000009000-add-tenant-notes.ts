import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantNotes1760000009000 implements MigrationInterface {
  name = 'AddTenantNotes1760000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "ciphertext" bytea NOT NULL,
        "iv" bytea NOT NULL,
        "auth_tag" bytea NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_tenant_notes" PRIMARY KEY ("id"),
        CONSTRAINT "fk_tenant_notes_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_tenant_notes_created_by_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "chk_tenant_notes_iv" CHECK (octet_length("iv") = 12),
        CONSTRAINT "chk_tenant_notes_auth_tag" CHECK (octet_length("auth_tag") = 16),
        CONSTRAINT "chk_tenant_notes_ciphertext" CHECK (octet_length("ciphertext") BETWEEN 1 AND 16384)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_tenant_notes_tenant_id" ON "tenant_notes" ("tenant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_tenant_notes_created_by_user_id" ON "tenant_notes" ("created_by_user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tenant_notes"');
  }
}
