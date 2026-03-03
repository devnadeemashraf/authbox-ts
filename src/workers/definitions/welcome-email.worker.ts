import { createWelcomeEmailProcessor } from '../processors/welcome-email.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const welcomeEmailWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.WELCOME_EMAIL,
  createProcessor: (ctx) => createWelcomeEmailProcessor(ctx.mailer) as JobProcessor,
  concurrency: 10,
  label: 'Welcome email',
};
