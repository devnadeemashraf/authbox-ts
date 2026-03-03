import type { Server } from 'http';

import { env } from '@/config/env';
import { bootstrapDI } from '@/core/di/container';
import { logger } from '@/core/logger';
import { connectDatabase, disconnectDatabase } from '@/infrastructure/database/db.client';
import { closeAllQueues } from '@/infrastructure/queue/queue.registry';
import { disconnectQueue } from '@/infrastructure/queue/redis.client';
import { registerOnShutdown } from '@/shutdown';

export async function bootstrapInfrastructure(): Promise<void> {
  // --- Database connection pool (Knex / pg)
  await connectDatabase();
  registerOnShutdown(disconnectDatabase);

  registerOnShutdown(async () => {
    await closeAllQueues();
    await disconnectQueue();
  });

  // --- tsyringe DI container (must run before app imports that resolve controllers)
  bootstrapDI();

  // --- Redis client (for sessions, cache)
  // TODO: const redis = await connectRedis();
  // TODO: registerOnShutdown(async () => redis.quit());

  // --- MinIO / object store (if used)
  // TODO: registerOnShutdown(...) for any external clients

  logger.info('Infrastructure bootstrap complete');
}

export async function startServer(): Promise<Server> {
  const { createApp } = await import('@/app');
  const app = createApp();

  return new Promise((resolve) => {
    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on PORT:${env.PORT}`);
      resolve(server);
    });
  });
}

export async function bootstrap(): Promise<Server> {
  await bootstrapInfrastructure();
  return startServer();
}
