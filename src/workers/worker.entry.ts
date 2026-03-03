import 'reflect-metadata';

import { Worker } from 'bullmq';

import { logger } from '@/core/logger';
import { ConsoleMailer } from '@/infrastructure/mailer/console.mailer';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';
import { redisConnectionOptions } from '@/infrastructure/queue/redis.client';
import { registerOnShutdown } from '@/shutdown';
import { createEmailVerificationProcessor } from '@/workers/processors/email-verification.processor';
import { createPasswordResetProcessor } from '@/workers/processors/password-reset.processor';
import { createWelcomeEmailProcessor } from '@/workers/processors/welcome-email.processor';

const mailer = new ConsoleMailer();

const workerConnection = {
  ...redisConnectionOptions,
  maxRetriesPerRequest: null,
};

const emailVerificationWorker = new Worker(
  QUEUE_NAMES.EMAIL_VERIFICATION,
  createEmailVerificationProcessor(mailer),
  { connection: workerConnection, concurrency: 5 },
);

const welcomeEmailWorker = new Worker(
  QUEUE_NAMES.WELCOME_EMAIL,
  createWelcomeEmailProcessor(mailer),
  { connection: workerConnection, concurrency: 10 },
);

const passwordResetWorker = new Worker(
  QUEUE_NAMES.PASSWORD_RESET,
  createPasswordResetProcessor(mailer),
  { connection: workerConnection, concurrency: 5 },
);

emailVerificationWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id, queue: QUEUE_NAMES.EMAIL_VERIFICATION }, 'Job completed');
});

emailVerificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email verification job failed');
});

welcomeEmailWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id, queue: QUEUE_NAMES.WELCOME_EMAIL }, 'Job completed');
});

welcomeEmailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Welcome email job failed');
});

passwordResetWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id, queue: QUEUE_NAMES.PASSWORD_RESET }, 'Job completed');
});

passwordResetWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Password reset job failed');
});

async function shutdown(): Promise<void> {
  await Promise.all([
    emailVerificationWorker.close(),
    welcomeEmailWorker.close(),
    passwordResetWorker.close(),
  ]);
}

registerOnShutdown(shutdown);

logger.info(
  {
    queues: [QUEUE_NAMES.EMAIL_VERIFICATION, QUEUE_NAMES.WELCOME_EMAIL, QUEUE_NAMES.PASSWORD_RESET],
  },
  'Queue workers started',
);
