import { randomBytes } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { VerificationTokenRepository } from '../repositories/verification-token.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { UnauthorizedError } from '@/core/errors/client-errors';
import type { PasswordHasher } from '@/core/security/password-hasher';
import { RESET_TOKEN_TTL_SECONDS, setResetToken } from '@/infrastructure/queue/redis.client';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

export interface VerifyPasswordResetOtpResult {
  resetToken: string;
  expiresInSeconds: number;
}

/**
 * Verifies OTP and issues a short-lived reset token.
 * Single-use: reset token is consumed when password is changed.
 */
@injectable()
export class VerifyPasswordResetOtpService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.VerificationTokenRepository)
    private readonly verificationTokenRepo: VerificationTokenRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {
    super(db);
  }

  async execute(email: string, otp: string): Promise<VerifyPasswordResetOtpResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError({ message: 'Invalid or expired code' });
    }

    const token = await this.verificationTokenRepo.findValidByUserIdAndType(
      user.id,
      'password_reset',
    );
    if (!token) {
      throw new UnauthorizedError({ message: 'Invalid or expired code' });
    }

    const valid = await this.passwordHasher.verify(token.tokenHash, otp);
    if (!valid) {
      throw new UnauthorizedError({ message: 'Invalid or expired code' });
    }

    await this.verificationTokenRepo.invalidateByUserIdAndType(user.id, 'password_reset');

    const resetToken = randomBytes(32).toString('hex');
    await setResetToken(resetToken, user.id);

    return {
      resetToken,
      expiresInSeconds: RESET_TOKEN_TTL_SECONDS,
    };
  }
}
