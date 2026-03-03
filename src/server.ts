import 'reflect-metadata';

import { fork } from 'node:child_process';
import cluster from 'node:cluster';
import os from 'node:os';
import path from 'node:path';

import { bootstrap } from '@/bootstrap';
import { env } from '@/config/env';
import { logger } from '@/core/logger';
import { gracefulShutdown } from '@/shutdown';

const isPrimary = cluster.isPrimary;

/** Number of workers: 0 = CPU count, otherwise use env value */
const workerCount = env.WEB_CONCURRENCY > 0 ? env.WEB_CONCURRENCY : os.cpus().length;

if (isPrimary) {
  logger.info({ workerCount }, 'Primary process started, spawning workers');

  if (env.RUN_WORKERS && env.NODE_ENV === 'production') {
    const workerPath = path.resolve(__dirname, 'workers', 'worker.entry.js');
    const workerProcess = fork(workerPath, [], { stdio: 'inherit' });
    workerProcess.on('exit', (code) => {
      logger.warn({ code }, 'Queue worker process exited');
    });
  } else if (env.RUN_WORKERS) {
    logger.info('Run workers separately in dev: pnpm run worker');
  }

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    logger.warn({ workerId: worker.id, code }, 'Worker exited, respawning');
    cluster.fork();
  });
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
