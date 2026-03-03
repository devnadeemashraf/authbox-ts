import { getQueue } from './queue.registry';
import { QUEUE_NAMES } from './queue-names';

/**
 * Schedules repeatable jobs for subscriptions and database cleanup.
 * Call once during app/worker startup.
 *
 * Cron: 0 9 * * * = daily at 09:00 UTC
 */
export async function scheduleSubscriptionJobs(): Promise<void> {
  const reminderQueue = getQueue(QUEUE_NAMES.SUBSCRIPTION_RENEWAL_REMINDER);
  const demotionQueue = getQueue(QUEUE_NAMES.SUBSCRIPTION_DEMOTION);
  const cleanupQueue = getQueue(QUEUE_NAMES.DATABASE_CLEANUP);

  await reminderQueue.add('daily-reminder', {}, { repeat: { pattern: '0 9 * * *' } });
  await demotionQueue.add('daily-demotion', {}, { repeat: { pattern: '0 9 * * *' } });
  await cleanupQueue.add('daily-cleanup', {}, { repeat: { pattern: '0 3 * * *' } });
}
