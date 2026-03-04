import { randomInt, randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { VerificationTokenRepository } from '../repositories/verification-token.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { ConflictError } from '@/core/errors/client-errors';
import { logger } from '@/core/logger';
import type { PasswordHasher } from '@/core/security/password-hasher';
import { addEmailJobIfEnabled } from '@/infrastructure/queue/email-job-gate';
import type { PasswordResetJobPayload } from '@/infrastructure/queue/job-payloads';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';
import {
  getPasswordResetCooldownTtl,
  setPasswordResetCooldown,
} from '@/infrastructure/queue/redis.client';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 120;

export interface SendPasswordResetOtpResult {
  sent: boolean;
  resendAfterSeconds: number;
}

/**
 * Sends password reset OTP to email.
 * Account enumeration prevention: always returns same shape; does not reveal if email exists.
 */
@injectable()
export class SendPasswordResetOtpService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.VerificationTokenRepository)
    private readonly verificationTokenRepo: VerificationTokenRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {
    super(db);
  }

  async execute(email: string): Promise<SendPasswordResetOtpResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const remainingTtl = await getPasswordResetCooldownTtl(normalizedEmail);
    if (remainingTtl > 0) {
      return { sent: false, resendAfterSeconds: remainingTtl };
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      // Account enumeration prevention: return success, no email sent
      return { sent: true, resendAfterSeconds: RESEND_COOLDOWN_SECONDS };
    }

    const otp = this.generateOtp();
    const tokenHash = await this.passwordHasher.hash(otp);

    await this.verificationTokenRepo.invalidateByUserIdAndType(user.id, 'password_reset');

    await this.verificationTokenRepo.create({
      id: randomUUID(),
      userId: user.id,
      type: 'password_reset',
      tokenHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    try {
      await addEmailJobIfEnabled(QUEUE_NAMES.PASSWORD_RESET, 'send-otp', {
        userId: user.id,
        email: user.email,
        otp,
      } as PasswordResetJobPayload);
    } catch (err) {
      logger.warn({ err, email: normalizedEmail }, 'Failed to queue password reset OTP');
      throw new ConflictError({ message: 'Failed to send reset email. Please try again.' });
    }

    await setPasswordResetCooldown(normalizedEmail, RESEND_COOLDOWN_SECONDS);

    return { sent: true, resendAfterSeconds: RESEND_COOLDOWN_SECONDS };
  }

  private generateOtp(): string {
    const max = 10 ** OTP_LENGTH - 1;
    const min = 10 ** (OTP_LENGTH - 1);
    return String(randomInt(min, max + 1));
  }
}
