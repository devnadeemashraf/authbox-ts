import { createSubscriptionDemotionProcessor } from '../processors/subscription-demotion.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const subscriptionDemotionWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.SUBSCRIPTION_DEMOTION,
  createProcessor: (ctx) => {
    if (!ctx.subscriptionRepo || !ctx.userRepo) {
      throw new Error('Subscription demotion worker requires subscriptionRepo and userRepo');
    }
    return createSubscriptionDemotionProcessor(ctx.subscriptionRepo, ctx.userRepo) as JobProcessor;
  },
  concurrency: 1,
  label: 'Subscription demotion',
};
