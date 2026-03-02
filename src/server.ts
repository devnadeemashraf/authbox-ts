import 'reflect-metadata';

import cluster from 'node:cluster';
import os from 'node:os';

import { bootstrap } from '@/bootstrap';
import { env } from '@/config/env';
import { logger } from '@/core/logger';
import { gracefulShutdown } from '@/shutdown';

const isPrimary = cluster.isPrimary;

/** Number of workers: 0 = CPU count, otherwise use env value */
const workerCount = env.WEB_CONCURRENCY > 0 ? env.WEB_CONCURRENCY : os.cpus().length;

if (isPrimary) {
  logger.info({ workerCount }, 'Primary process started, spawning workers');

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    logger.warn({ workerId: worker.id, code }, 'Worker exited, respawning');
    cluster.fork();
  });

  // TODO: Optional - spawn background job workers when env.RUN_WORKERS is true
  // Workers (e.g. BullMQ) would run in a separate process alongside HTTP workers
} else {
  bootstrap()
    .then((server) => {
      const shutdown = () => gracefulShutdown(server);

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err) => {
      logger.fatal({ err }, 'Bootstrap failed');
      process.exit(1);
    });
}
