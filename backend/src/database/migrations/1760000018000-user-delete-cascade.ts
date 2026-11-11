import type { MigrationInterface, QueryRunner } from 'typeorm';

const CASCADE_CONSTRAINTS = [
  'fk_cards_created_by_user',
  'fk_card_comments_author_user',
  'fk_card_attachments_created_by_user',
  'fk_card_checklist_items_created_by_user',
  'fk_project_documents_created_by_user',
  'fk_project_contracts_created_by_user',
  'fk_project_payments_created_by_user',
  'fk_project_costs_created_by_user',
  'fk_tenant_notes_created_by_user',
  'fk_finance_project_documents_created_by_user',
  'fk_project_contract_installments_created_by_user',
] as const;

export class UserDeleteCascade1760000018000 implements MigrationInterface {
  name = 'UserDeleteCascade1760000018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of CASCADE_CONSTRAINTS) {
      await queryRunner.query(
        `ALTER TABLE "${this.tableForConstraint(name)}" DROP CONSTRAINT "${name}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${this.tableForConstraint(name)}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${this.columnForConstraint(name)}") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of CASCADE_CONSTRAINTS) {
      await queryRunner.query(
        `ALTER TABLE "${this.tableForConstraint(name)}" DROP CONSTRAINT "${name}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${this.tableForConstraint(name)}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${this.columnForConstraint(name)}") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      );
    }
  }

  private tableForConstraint(constraint: string): string {
    const map: Record<string, string> = {
      fk_cards_created_by_user: 'cards',
      fk_card_comments_author_user: 'card_comments',
      fk_card_attachments_created_by_user: 'card_attachments',
      fk_card_checklist_items_created_by_user: 'card_checklist_items',
      fk_project_documents_created_by_user: 'project_documents',
      fk_project_contracts_created_by_user: 'project_contracts',
      fk_project_payments_created_by_user: 'project_payments',
      fk_project_costs_created_by_user: 'project_costs',
      fk_tenant_notes_created_by_user: 'tenant_notes',
      fk_finance_project_documents_created_by_user: 'finance_project_documents',
      fk_project_contract_installments_created_by_user: 'project_contract_installments',
    };
    return map[constraint] ?? '';
  }

  private columnForConstraint(constraint: string): string {
    if (constraint === 'fk_card_comments_author_user') {
      return 'author_user_id';
    }

    return 'created_by_user_id';
  }
}
