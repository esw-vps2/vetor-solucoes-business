import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxCardLaneCheck1760000013000 implements MigrationInterface {
  name = 'RelaxCardLaneCheck1760000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "cards" DROP CONSTRAINT "chk_cards_lane"',
    );
    await queryRunner.query(`
      ALTER TABLE "cards"
        ADD CONSTRAINT "chk_cards_lane"
        CHECK ("lane" ~ '^[a-z0-9-]{1,20}$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "cards" DROP CONSTRAINT "chk_cards_lane"',
    );
    await queryRunner.query(`
      ALTER TABLE "cards"
        ADD CONSTRAINT "chk_cards_lane"
        CHECK (
          "lane" IN ('backlog', 'ready', 'working', 'review', 'deploy', 'done')
        )
    `);
  }
}
