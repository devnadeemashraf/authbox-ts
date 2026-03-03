import { createEmailVerificationProcessor } from '../processors/email-verification.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const emailVerificationWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.EMAIL_VERIFICATION,
  createProcessor: (ctx) => createEmailVerificationProcessor(ctx.mailer) as JobProcessor,
  concurrency: 5,
  label: 'Email verification',
};
