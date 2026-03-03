import 'reflect-metadata';

import { WORKER_DEFINITIONS } from './definitions';
import { bootstrapWorkers, shutdownWorkers } from './worker.bootstrap';

import { bootstrapDI, container } from '@/core/di/container';
import { Tokens } from '@/core/di/tokens';
import { logger } from '@/core/logger';
import { connectDatabase, disconnectDatabase, getDb } from '@/infrastructure/database/db.client';
import { ConsoleMailer } from '@/infrastructure/mailer/console.mailer';
import { closeAllQueues } from '@/infrastructure/queue/queue.registry';
import { disconnectQueue } from '@/infrastructure/queue/redis.client';
import { scheduleSubscriptionJobs } from '@/infrastructure/queue/subscription-scheduler';
import { registerOnShutdown, runShutdownTasks } from '@/shutdown';

async function main(): Promise<void> {
  await connectDatabase();
  registerOnShutdown(disconnectDatabase);
  registerOnShutdown(async () => {
    await closeAllQueues();
    await disconnectQueue();
  });

  bootstrapDI();

  const ctx: import('./worker.types').WorkerContext = {
    mailer: new ConsoleMailer(),
    db: getDb(),
    subscriptionRepo: container.resolve(Tokens.Subscriptions.SubscriptionRepository),
    userRepo: container.resolve(Tokens.Users.UserRepository),
  };

  await scheduleSubscriptionJobs();

  const workers = bootstrapWorkers(WORKER_DEFINITIONS, ctx);
  registerOnShutdown(() => shutdownWorkers(workers));

  process.on('SIGTERM', runShutdownTasks);
  process.on('SIGINT', runShutdownTasks);

  logger.info({ queues: WORKER_DEFINITIONS.map((d) => d.queueName) }, 'Queue workers started');
}

main().catch((err) => {
  logger.fatal({ err }, 'Worker bootstrap failed');
  process.exit(1);
});
