import type { Job } from 'bullmq';
import type { Knex } from 'knex';

/**
 * Daily job: deletes expired sessions, expired verification tokens,
 * and optionally prunes old processed Stripe events.
 * Keeps the database tidy and prevents unbounded growth.
 */
export function createDatabaseCleanupProcessor(db: Knex) {
  return async (_job: Job): Promise<void> => {
    const now = new Date();

    const expiredSessions = await db('sessions').where('expiresAt', '<', now).del();
    const expiredTokens = await db('verification_tokens').where('expiresAt', '<', now).del();

    // Prune processed_stripe_events older than 90 days (idempotency window)
    const retentionDays = 90;
    const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const prunedEvents = await db('processed_stripe_events')
      .where('processedAt', '<', cutoff)
      .del();

    // Log for observability (avoid logging in tight loop; this runs daily)
    if (expiredSessions > 0 || expiredTokens > 0 || prunedEvents > 0) {
      const { logger } = await import('@/core/logger');
      logger.info({ expiredSessions, expiredTokens, prunedEvents }, 'Database cleanup completed');
    }
  };
}
