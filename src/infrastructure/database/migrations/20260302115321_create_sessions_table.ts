import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `
      CREATE TABLE IF NOT EXISTS sessions (
        -- Primary key is typically the JWT ID (jti) or a cryptographically secure random string
        id VARCHAR(255) PRIMARY KEY,

        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "deviceInfo" VARCHAR(255),
        "ipAddress" VARCHAR(45),
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await knex.raw(`CREATE INDEX idx_sessions_user_expires ON sessions("userId", "expiresAt");`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS sessions CASCADE;`);
}
