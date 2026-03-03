import { createPasswordResetProcessor } from '../processors/password-reset.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const passwordResetWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.PASSWORD_RESET,
  createProcessor: (ctx) => createPasswordResetProcessor(ctx.mailer) as JobProcessor,
  concurrency: 5,
  label: 'Password reset',
};
