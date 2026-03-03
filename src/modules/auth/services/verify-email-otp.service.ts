import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { VerificationTokenRepository } from '../repositories/verification-token.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { UnauthorizedError } from '@/core/errors/client-errors';
import type { PasswordHasher } from '@/core/security/password-hasher';

@injectable()
export class VerifyEmailOtpService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Auth.VerificationTokenRepository)
    private readonly verificationTokenRepo: VerificationTokenRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {
    super(db);
  }

  async execute(userId: string, otp: string): Promise<void> {
    const token = await this.verificationTokenRepo.findValidByUserIdAndType(userId, 'email_verify');
    if (!token) {
      throw new UnauthorizedError({ message: 'Invalid or expired verification code' });
    }

    const valid = await this.passwordHasher.verify(token.tokenHash, otp);
    if (!valid) {
      throw new UnauthorizedError({ message: 'Invalid or expired verification code' });
    }

    await this.db.transaction(async (trx) => {
      await trx('users').where('id', userId).update({ isEmailVerified: true });
      await trx('verification_tokens').where('id', token.id).del();
    });
  }
}
