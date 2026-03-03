import knex, { type Knex } from 'knex';

import knexConfig from '@/config/knexfile';

/** Knex instance for testing. Uses testing config from knexfile. */
let testDb: Knex | null = null;

/**
 * Returns a Knex instance connected to the test database.
 * Call connectTestDb() in beforeAll; call disconnectTestDb() in afterAll.
 */
export function getTestDb(): Knex {
  if (!testDb) {
    testDb = knex(knexConfig.testing);
  }
  return testDb;
}

/**
 * Connects to the test database and runs migrations.
 * Use in integration test beforeAll.
 */
export async function connectTestDb(): Promise<Knex> {
  const db = getTestDb();
  await db.migrate.latest();
  return db;
}

/**
 * Truncates the given tables (in order). Use in beforeEach/afterEach to reset state.
 * Tables are truncated with CASCADE to handle foreign keys.
 */
export async function truncateTables(db: Knex, tables: string[]): Promise<void> {
  if (tables.length === 0) return;
  await db.raw('TRUNCATE TABLE ' + tables.join(', ') + ' CASCADE');
}

/**
 * Disconnects from the test database. Call in afterAll.
 */
export async function disconnectTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
}
