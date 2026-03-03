import { createSubscriptionRenewalReminderProcessor } from '../processors/subscription-renewal-reminder.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const subscriptionRenewalReminderWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.SUBSCRIPTION_RENEWAL_REMINDER,
  createProcessor: (ctx) => {
    if (!ctx.subscriptionRepo || !ctx.userRepo) {
      throw new Error(
        'Subscription renewal reminder worker requires subscriptionRepo and userRepo',
      );
    }
    return createSubscriptionRenewalReminderProcessor(
      ctx.mailer,
      ctx.subscriptionRepo,
      ctx.userRepo,
    ) as JobProcessor;
  },
  concurrency: 1,
  label: 'Subscription renewal reminder',
};
