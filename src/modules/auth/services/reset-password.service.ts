import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { UnauthorizedError } from '@/core/errors/client-errors';
import type { PasswordHasher } from '@/core/security/password-hasher';
import { consumeResetToken } from '@/infrastructure/queue/redis.client';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

/**
 * Resets password using a short-lived token issued after OTP verification.
 * Single-use: token is consumed. Invalidates all sessions for security.
 */
@injectable()
export class ResetPasswordService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {
    super(db);
  }

  async execute(resetToken: string, newPassword: string): Promise<void> {
    const userId = await consumeResetToken(resetToken);
    if (!userId) {
      throw new UnauthorizedError({ message: 'Invalid or expired reset token' });
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);

    await this.db.transaction(async (trx) => {
      await trx('users').where('id', userId).update({ passwordHash });
      await trx('sessions').where('userId', userId).del();
    });
  }
}
