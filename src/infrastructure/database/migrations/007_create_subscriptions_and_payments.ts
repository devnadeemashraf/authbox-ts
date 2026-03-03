import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "stripeCustomerId" VARCHAR(255) NOT NULL,
      "stripeSubscriptionId" VARCHAR(255) UNIQUE NOT NULL,
      "tierId" INTEGER NOT NULL REFERENCES tiers(id) ON DELETE RESTRICT,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
      "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
      "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
      "renewalReminderSentAt" TIMESTAMP WITH TIME ZONE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT subscriptions_user_unique UNIQUE ("userId")
    );
  `);

  await knex.raw(`
    CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "subscriptionId" UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      "stripeInvoiceId" VARCHAR(255),
      "stripePaymentIntentId" VARCHAR(255),
      "amountCents" INTEGER NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'usd',
      status VARCHAR(50) NOT NULL,
      "paidAt" TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_payments_subscription ON payments("subscriptionId");
    CREATE INDEX idx_payments_paid_at ON payments("paidAt");
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS processed_stripe_events (
      id SERIAL PRIMARY KEY,
      "stripeEventId" VARCHAR(255) UNIQUE NOT NULL,
      "processedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await knex.raw(`
    CREATE INDEX idx_subscriptions_user ON subscriptions("userId");
    CREATE INDEX idx_subscriptions_period_end ON subscriptions("currentPeriodEnd");
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS update_subscriptions_modtime ON subscriptions;`);
  await knex.raw(`DROP TABLE IF EXISTS payments CASCADE;`);
  await knex.raw(`DROP TABLE IF EXISTS subscriptions CASCADE;`);
  await knex.raw(`DROP TABLE IF EXISTS processed_stripe_events CASCADE;`);
}
