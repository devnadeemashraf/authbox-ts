import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE,
        "passwordHash" VARCHAR(255),
        "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        permissions INTEGER NOT NULL DEFAULT 1, -- Bitmask Permissions

        "tierId" INTEGER NOT NULL DEFAULT 1 REFERENCES tiers(id) ON DELETE RESTRICT,

        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );    
    `,
  );

  await knex.raw(`
    CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS update_users_modtime ON users;`);
  await knex.raw(`DROP TABLE IF EXISTS users CASCADE;`);
}
