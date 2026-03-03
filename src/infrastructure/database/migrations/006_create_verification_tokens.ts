import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
      "tokenHash" VARCHAR(255) NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_type
    ON verification_tokens("userId", type);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS verification_tokens CASCADE;`);
}
