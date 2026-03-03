import 'reflect-metadata';

import { WORKER_DEFINITIONS } from './definitions';
import { bootstrapWorkers, shutdownWorkers } from './worker.bootstrap';

import { logger } from '@/core/logger';
import { ConsoleMailer } from '@/infrastructure/mailer/console.mailer';
import { registerOnShutdown } from '@/shutdown';

const ctx = { mailer: new ConsoleMailer() };
const workers = bootstrapWorkers(WORKER_DEFINITIONS, ctx);

registerOnShutdown(() => shutdownWorkers(workers));

logger.info({ queues: WORKER_DEFINITIONS.map((d) => d.queueName) }, 'Queue workers started');
