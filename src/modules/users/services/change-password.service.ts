import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { BadRequestError, UnauthorizedError } from '@/core/errors/client-errors';
import type { PasswordHasher } from '@/core/security/password-hasher';
import type { SessionCache } from '@/infrastructure/cache/session-cache';
import type { UserCache } from '@/infrastructure/cache/user-cache';
import type { UserRepository } from '@/modules/users/repositories/user.repository';
import type { ChangePasswordInput } from '@/modules/users/schemas/user.schemas';

/**
 * Changes the authenticated user's password.
 * Requires current password; invalidates all other sessions, keeps current session active.
 * OAuth-only users (no passwordHash) cannot use this flow—use forgot-password instead.
 */
@injectable()
export class ChangePasswordService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @inject(Tokens.Cache.SessionCache) private readonly sessionCache: SessionCache,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
  ) {
    super(db);
  }

  async execute(userId: string, sessionId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError({ message: 'User not found' });
    }

    if (!user.passwordHash) {
      throw new BadRequestError({
        message: 'Account uses social sign-in. Set a password via forgot-password flow first.',
      });
    }

    const valid = await this.passwordHasher.verify(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw new UnauthorizedError({ message: 'Current password is incorrect' });
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);

    await this.runInTransaction(async (trx) => {
      await trx('users').where('id', userId).update({ passwordHash });
      await trx('sessions').where('userId', userId).whereNot('id', sessionId).del();
    });

    await this.sessionCache.removeAllSessionsForUser(userId);
    await this.sessionCache.addSession(userId, sessionId);
    await this.userCache.invalidateUser(userId, user.email);
  }
}
