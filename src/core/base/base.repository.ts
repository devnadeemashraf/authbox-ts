import type { Knex } from 'knex';

/**
 * Abstract base class for all repositories.
 * Provides generic CRUD operations and transaction support.
 *
 * Subclasses must:
 * - Be decorated with `@injectable()`
 * - Inject `Tokens.Infrastructure.Database` and pass to `super(db)`
 * - Set `tableName` to the database table name
 * - Implement `toEntity(row)` to map raw DB rows to domain entities
 *
 * Subclasses may override any method for custom behavior.
 *
 * @template T - The domain entity type returned by this repository
 */
export abstract class BaseRepository<T> {
  constructor(protected readonly db: Knex) {}

  /** Database table name. Must be set by subclasses. */
  protected abstract tableName: string;

  /** Primary key column name. Override if different from 'id'. */
  protected idColumn = 'id' as const;

  /**
   * Maps a raw database row to a domain entity.
   * Handles snake_case to camelCase conversion if needed.
   */
  protected abstract toEntity(row: Record<string, unknown>): T;

  /**
   * Finds a single entity by primary key.
   * @returns The entity or null if not found
   */
  async findById(id: string | number): Promise<T | null> {
    const row = await this.db(this.tableName).where(this.idColumn, id).first();

    return row ? this.toEntity(row as Record<string, unknown>) : null;
  }

  /**
   * Finds a single entity matching the given criteria.
   * @returns The first matching entity or null
   */
  async findOne(criteria: Record<string, unknown>): Promise<T | null> {
    const query = this.db(this.tableName);

    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined) query.where(key, value);
    }

    const row = await query.first();
    return row ? this.toEntity(row as Record<string, unknown>) : null;
  }

  /**
   * Creates a new entity.
   * @param data - Column values to insert (exclude auto-generated fields)
   * @returns The created entity with generated fields
   */
  async create(data: Record<string, unknown>): Promise<T> {
    const [row] = await this.db(this.tableName).insert(data).returning('*');

    if (!row) {
      throw new Error(`Insert into ${this.tableName} returned no row`);
    }

    return this.toEntity(row as Record<string, unknown>);
  }

  /**
   * Updates an entity by primary key.
   * @returns The updated entity or null if not found
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<T | null> {
    const [row] = await this.db(this.tableName)
      .where(this.idColumn, id)
      .update(data)
      .returning('*');

    return row ? this.toEntity(row as Record<string, unknown>) : null;
  }

  /**
   * Deletes an entity by primary key.
   * @returns true if a row was deleted, false otherwise
   */
  async delete(id: string | number): Promise<boolean> {
    const deleted = await this.db(this.tableName).where(this.idColumn, id).del();

    return deleted > 0;
  }

  /**
   * Counts entities matching optional criteria.
   * @param criteria - Optional filters; omit for total count
   */
  async count(criteria?: Record<string, unknown>): Promise<number> {
    const query = this.db(this.tableName).count('* as count');

    if (criteria) {
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) query.where(key, value);
      }
    }

    const [{ count: result }] = await query;
    return Number(result);
  }

  /**
   * Runs a callback within a database transaction.
   * Use when multiple operations must succeed or fail together.
   *
   * @example
   * await this.withTransaction(async (trx) => {
   *   await trx(this.tableName).insert(...);
   *   await trx('other_table').update(...);
   * });
   */
  async withTransaction<TResult>(
    fn: (trx: Knex.Transaction) => Promise<TResult>,
  ): Promise<TResult> {
    return this.db.transaction(fn);
  }
}
