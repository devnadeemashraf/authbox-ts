import knex, { Knex } from 'knex';

import { env } from '@/config/env';
import knexConfig from '@/config/knexfile';
import { logger } from '@/core/logger';

/** Knex instance - use in repositories via getDb() or direct import */
const dbClient: Knex = knex(knexConfig[env.NODE_ENV]);

/**
 * Bootstrap: Verifies database connectivity. Call during startup.
 */
export async function connectDatabase(): Promise<void> {
  await dbClient.raw('SELECT 1');
  logger.info('Database connection established');
}

/**
 * Shutdown: Closes the connection pool. Call during graceful shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await dbClient.destroy();
  logger.info('Database connection closed');
}

/**
 * Repository usage: Returns the Knex client for queries and transactions.
 */
export function getDb(): Knex {
  return dbClient;
}

export type DatabaseClient = Knex;
export type DatabaseTransaction = Knex.Transaction;
