import { Queue } from 'bullmq';

import type { QueueName } from './queue-names';
import { redisConnectionOptions } from './redis.client';

/**
 * Queue Registry (Factory Pattern).
 * Provides isolated queues per use case. Each queue is independent.
 *
 * To add a new queue:
 * 1. Add name to queue-names.ts
 * 2. Create processor in workers/processors/
 * 3. Create definition in workers/definitions/ and add to WORKER_DEFINITIONS
 */
const queues = new Map<string, Queue>();

export function getQueue<T extends QueueName>(name: T): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: { ...redisConnectionOptions, maxRetriesPerRequest: 1 },
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    queues.set(name, queue);
  }
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  return Promise.all(Array.from(queues.values()).map((q) => q.close())).then(() => {
    queues.clear();
  });
}
