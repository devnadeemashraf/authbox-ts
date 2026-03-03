import { createDatabaseCleanupProcessor } from '../processors/database-cleanup.processor';
import type { JobProcessor, WorkerDefinition } from '../worker.types';

import { getDb } from '@/infrastructure/database/db.client';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export const databaseCleanupWorker: WorkerDefinition = {
  queueName: QUEUE_NAMES.DATABASE_CLEANUP,
  createProcessor: (ctx) => {
    const db = ctx.db ?? getDb();
    return createDatabaseCleanupProcessor(db) as JobProcessor;
  },
  concurrency: 1,
  label: 'Database cleanup',
};
