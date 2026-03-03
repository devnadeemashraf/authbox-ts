import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS "avatarUrl" VARCHAR(512) NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS "avatarUrl";
  `);
}
