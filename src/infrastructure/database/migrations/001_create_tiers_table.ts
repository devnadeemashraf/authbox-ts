import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // PostgreSQL trigger function to automatically update the 'updatedAt' timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(
    `
     CREATE TABLE IF NOT EXISTS tiers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      features JSONB NOT NULL DEFAULT '{}'::jsonb,

      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );
    `,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP FUNCTION IF EXISTS update_modified_column;`);
  await knex.raw('DROP TABLE IF EXISTS tiers CASCADE;');
}
