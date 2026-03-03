import type { Job } from 'bullmq';

import { TIER_BY_ID } from '@/core/config/tiers.config';
import type { SubscriptionRepository } from '@/modules/subscriptions/repositories/subscription.repository';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const FREE_TIER_ID =
  Number(Object.entries(TIER_BY_ID).find(([, t]) => t.name === 'free')?.[0]) || 1;

/**
 * Daily job: finds subscriptions past grace period (currentPeriodEnd > 7 days ago,
 * status canceled/past_due/unpaid), demotes users to free. Repeatable via cron.
 */
export function createSubscriptionDemotionProcessor(
  subscriptionRepo: SubscriptionRepository,
  userRepo: UserRepository,
) {
  return async (_job: Job): Promise<void> => {
    const now = new Date();
    const subscriptions = await subscriptionRepo.findDueForDemotion(now);

    for (const sub of subscriptions) {
      await userRepo.update(sub.userId, { tierId: FREE_TIER_ID });
    }
  };
}
