import { injectable } from 'tsyringe';

import { logger } from '@/core/logger';
import { addEmailJobIfEnabled } from '@/infrastructure/queue/email-job-gate';
import type { WelcomeEmailJobPayload } from '@/infrastructure/queue/job-payloads';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

/**
 * Queues welcome email job. Single responsibility: enqueue.
 * When EMAIL_DELIVERY_ENABLED=false, job is skipped (no-op).
 * Worker processes asynchronously; no await for send.
 * Fails gracefully if Redis/queue unavailable (e.g. in tests).
 */
@injectable()
export class QueueWelcomeEmailService {
  async execute(email: string, name?: string): Promise<void> {
    try {
      await addEmailJobIfEnabled(QUEUE_NAMES.WELCOME_EMAIL, 'welcome', {
        email,
        name,
      } as WelcomeEmailJobPayload);
    } catch (err) {
      logger.warn({ err, email }, 'Failed to queue welcome email; registration still succeeded');
    }
  }
}
