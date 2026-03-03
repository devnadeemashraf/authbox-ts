import type { Server } from 'http';

import { logger } from '@/core/logger';

type ShutdownTask = () => Promise<void> | void;

const cleanupTasks: ShutdownTask[] = [];

export function registerOnShutdown(task: ShutdownTask): void {
  cleanupTasks.push(task);
}

export async function gracefulShutdown(server: Server): Promise<void> {
  const timeoutMs = 10_000; // Max time to wait before force-exit

  logger.info('Shutdown signal received, draining connections...');

  const serverClosed = new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('HTTP server closed');
      resolve();
    });
  });

  const cleanups = Promise.all(
    cleanupTasks.map(async (task) => {
      try {
        await Promise.resolve(task());
      } catch (err) {
        logger.error({ err }, 'Shutdown task failed');
      }
    }),
  );

  const completed = Promise.race([
    Promise.all([serverClosed, cleanups]),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs),
    ),
  ]).catch(() => {
    logger.warn('Shutdown timeout reached, forcing exit');
    process.exitCode = 1;
  });

  await completed;
  process.exit(process.exitCode ?? 0);
}

/**
 * Runs registered shutdown tasks without closing an HTTP server.
 * Use for worker processes that have no server.
 */
export async function runShutdownTasks(): Promise<void> {
  logger.info('Shutdown signal received, running cleanup tasks...');
  await Promise.all(
    cleanupTasks.map(async (task) => {
      try {
        await Promise.resolve(task());
      } catch (err) {
        logger.error({ err }, 'Shutdown task failed');
      }
    }),
  );
  process.exit(process.exitCode ?? 0);
}
