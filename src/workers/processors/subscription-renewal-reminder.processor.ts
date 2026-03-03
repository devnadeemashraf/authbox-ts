import type { Job } from 'bullmq';

import type { IMailer } from '@/core/interfaces/mailer.interface';
import type { SubscriptionRepository } from '@/modules/subscriptions/repositories/subscription.repository';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

/**
 * Daily job: finds subscriptions due for renewal reminder (currentPeriodEnd in next 7 days),
 * sends email, marks renewalReminderSentAt. Repeatable via cron.
 */
export function createSubscriptionRenewalReminderProcessor(
  mailer: IMailer,
  subscriptionRepo: SubscriptionRepository,
  userRepo: UserRepository,
) {
  return async (_job: Job): Promise<void> => {
    const now = new Date();
    const subscriptions = await subscriptionRepo.findDueForReminder(now);

    for (const sub of subscriptions) {
      const user = await userRepo.findById(sub.userId);
      if (!user?.email) continue;

      const endDate = sub.currentPeriodEnd;

      await mailer.send({
        to: user.email,
        subject: 'Your premium subscription renews soon',
        text: `Your premium subscription is set to renew on ${endDate.toLocaleDateString()}. Please ensure your payment method is up to date.`,
        html: `<p>Your premium subscription is set to renew on <strong>${endDate.toLocaleDateString()}</strong>.</p><p>Please ensure your payment method is up to date to avoid any interruption in service.</p>`,
      });

      await subscriptionRepo.update(sub.id, {
        renewalReminderSentAt: new Date(),
      });
    }
  };
}
