import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `
      CREATE TABLE IF NOT EXISTS social_providers (
        id UUID PRIMARY KEY,

        -- If a user is deleted, instantly wipe their social links
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        "providerName" VARCHAR(50) NOT NULL,
        "providerId" VARCHAR(255) NOT NULL,

        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Ensures a specific social account can only be linked once across the whole app
        UNIQUE("providerName", "providerId")
      );
    `,
  );

  // Index the userId so we can quickly fetch a user's connected providers
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_social_providers_user_id ON social_providers("userId");`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS social_providers CASCADE;`);
}
