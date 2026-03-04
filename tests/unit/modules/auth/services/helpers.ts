import type { Knex } from 'knex';

/** Mock Knex instance for service tests. No-op transaction. */
export function createMockDb(): Knex {
  const transactionFn = jest.fn((cb: (trx: unknown) => Promise<void>) => cb({}));
  return {
    transaction: transactionFn,
  } as unknown as Knex;
}
