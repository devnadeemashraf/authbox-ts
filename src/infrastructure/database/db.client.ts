import knex, { Knex } from 'knex';

import { env } from '@/config/env';
import knexConfig from '@/config/knexfile';
import { logger } from '@/core/logger';

export const dbClient: Knex = knex(knexConfig[env.NODE_ENV]);

export const verifyDatabaseConnection = async () => {
  await dbClient.raw(`SELECT 1;`);
  logger.info('Database Connection Successfull!');
};

export const destroyDatabaseConnection = async () => {
  await dbClient.destroy();
  logger.info('Database Connection Closed!');
};

export type DatabaseClient = Knex;
export type DatabaseTransaction = Knex.Transaction;
