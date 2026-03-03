import { getQueue } from './queue.registry';
import { QUEUE_NAMES } from './queue-names';

/**
 * Schedules repeatable jobs for subscription renewal reminder and demotion.
 * Call once during app/worker startup.
 *
 * Cron: 0 9 * * * = daily at 09:00 UTC
 */
export async function scheduleSubscriptionJobs(): Promise<void> {
  const reminderQueue = getQueue(QUEUE_NAMES.SUBSCRIPTION_RENEWAL_REMINDER);
  const demotionQueue = getQueue(QUEUE_NAMES.SUBSCRIPTION_DEMOTION);

  await reminderQueue.add('daily-reminder', {}, { repeat: { pattern: '0 9 * * *' } });
  await demotionQueue.add('daily-demotion', {}, { repeat: { pattern: '0 9 * * *' } });
}
