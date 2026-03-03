import { Worker } from 'bullmq';

import type { WorkerContext } from './worker.types';
import type { WorkerDefinition } from './worker.types';

import { logger } from '@/core/logger';
import { redisConnectionOptions } from '@/infrastructure/queue/redis.client';

const workerConnection = {
  ...redisConnectionOptions,
  maxRetriesPerRequest: null,
};

/**
 * Creates BullMQ workers from definitions and wires lifecycle events.
 * Returns array of workers for shutdown handling.
 */
export function bootstrapWorkers(definitions: WorkerDefinition[], ctx: WorkerContext): Worker[] {
  const workers: Worker[] = [];

  for (const def of definitions) {
    const worker = new Worker(def.queueName, def.createProcessor(ctx), {
      connection: workerConnection,
      concurrency: def.concurrency ?? 1,
    });

    worker.on('completed', (job) => {
      logger.debug({ jobId: job.id, queue: def.queueName }, `${def.label} job completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, `${def.label} job failed`);
    });

    workers.push(worker);
  }

  return workers;
}

/**
 * Gracefully closes all workers.
 */
export async function shutdownWorkers(workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}
