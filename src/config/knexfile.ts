/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Knex } from 'knex';
import path from 'path';

import { env } from './env';

const migrationsDir = path.join(__dirname, '../infrastructure/database/migrations');
const seedsDir = path.join(__dirname, '../infrastructure/database/seeds');

const commonConfig: Knex.Config = {
  client: 'pg',
  migrations: {
    directory: migrationsDir,
    tableName: 'schema_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: seedsDir,
    extension: 'ts',
  },
  pool: {
    afterCreate: (conn: any, done: any) => {
      // Set timezone to UTC for absolute consistency
      conn.query('SET timezone="UTC";', (err: any) => done(err, conn));
    },
  },
};

const config: Record<string, Knex.Config> = {
  development: {
    ...commonConfig,
    connection: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      ssl: false,
      database: env.POSTGRES_DATABASE + '_dev',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  testing: {
    ...commonConfig,
    connection: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      ssl: false,
      database: env.POSTGRES_DATABASE + '_test',
    },
    pool: {
      min: 1,
      max: 2,
    },
  },
  production: {
    ...commonConfig,
    connection: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      ssl: true,
      database: env.POSTGRES_DATABASE,
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

export default config;
