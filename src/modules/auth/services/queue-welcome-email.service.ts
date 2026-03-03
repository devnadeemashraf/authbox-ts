import { injectable } from 'tsyringe';

import { logger } from '@/core/logger';
import type { WelcomeEmailJobPayload } from '@/infrastructure/queue/job-payloads';
import { getQueue } from '@/infrastructure/queue/queue.registry';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

/**
 * Queues welcome email job. Single responsibility: enqueue.
 * Worker processes asynchronously; no await for send.
 * Fails gracefully if Redis/queue unavailable (e.g. in tests).
 */
@injectable()
export class QueueWelcomeEmailService {
  async execute(email: string, name?: string): Promise<void> {
    try {
      const queue = getQueue(QUEUE_NAMES.WELCOME_EMAIL);
      await queue.add('welcome', { email, name } as WelcomeEmailJobPayload);
    } catch (err) {
      logger.warn({ err, email }, 'Failed to queue welcome email; registration still succeeded');
    }
  }
}
