import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { Tokens } from '@/core/di/tokens';
import { ForbiddenError } from '@/core/errors/client-errors';

/**
 * Base class for all domain services.
 * Provides transaction orchestration and ownership validation helpers.
 *
 * Subclasses must:
 * - Be decorated with `@injectable()`
 * - Inject `Tokens.Infrastructure.Database` and pass to `super(db)`
 * - Add their own repository/service dependencies
 *
 * Use `runInTransaction` when multiple repository operations must succeed or fail together.
 * Use `validateOwnership` before allowing a user to modify a resource they don't own.
 */
@injectable()
export class BaseService {
  constructor(@inject(Tokens.Infrastructure.Database) protected readonly db: Knex) {}

  /**
   * Runs a callback within a database transaction.
   * Use when multiple operations (across one or more repositories) must be atomic.
   *
   * @example
   * await this.runInTransaction(async (trx) => {
   *   await this.userRepo.update(id, data, trx);
   *   await this.sessionRepo.create(sessionData, trx);
   * });
   */
  async runInTransaction<TResult>(
    fn: (trx: Knex.Transaction) => Promise<TResult>,
  ): Promise<TResult> {
    return this.db.transaction(fn);
  }

  /**
   * Validates that the current user owns the resource.
   * Throws ForbiddenError if the resource's userId does not match.
   *
   * @param resource - Object with a userId property (e.g. Session, User)
   * @param userId - The authenticated user's ID
   * @throws ForbiddenError when ownership check fails
   */
  protected validateOwnership(resource: { userId: string }, userId: string): void {
    if (resource.userId !== userId) {
      throw new ForbiddenError({
        message: 'You do not have permission to access this resource',
      });
    }
  }
}
