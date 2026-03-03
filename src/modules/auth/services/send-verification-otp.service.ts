import { randomInt, randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { VerificationTokenRepository } from '../repositories/verification-token.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { ConflictError } from '@/core/errors/client-errors';
import { logger } from '@/core/logger';
import type { PasswordHasher } from '@/core/security/password-hasher';
import type { EmailVerificationJobPayload } from '@/infrastructure/queue/job-payloads';
import { getQueue } from '@/infrastructure/queue/queue.registry';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';
import { getResendCooldownTtl, setResendCooldown } from '@/infrastructure/queue/redis.client';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const OTP_LENGTH = 6;
const OTP_EXPIRY_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;

export interface SendVerificationOtpResult {
  sent: boolean;
  resendAfterSeconds: number;
}

@injectable()
export class SendVerificationOtpService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.VerificationTokenRepository)
    private readonly verificationTokenRepo: VerificationTokenRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {
    super(db);
  }

  async execute(userId: string): Promise<SendVerificationOtpResult> {
    const remainingTtl = await getResendCooldownTtl(userId);
    if (remainingTtl > 0) {
      return { sent: false, resendAfterSeconds: remainingTtl };
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ConflictError({ message: 'User not found' });
    }
    if (user.isEmailVerified) {
      throw new ConflictError({ message: 'Email already verified' });
    }

    const otp = this.generateOtp();
    const tokenHash = await this.passwordHasher.hash(otp);

    await this.verificationTokenRepo.invalidateByUserIdAndType(userId, 'email_verify');

    await this.verificationTokenRepo.create({
      id: randomUUID(),
      userId,
      type: 'email_verify',
      tokenHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_HOURS * 60 * 60 * 1000),
    });

    try {
      const queue = getQueue(QUEUE_NAMES.EMAIL_VERIFICATION);
      await queue.add('send-otp', {
        userId,
        email: user.email,
        otp,
      } as EmailVerificationJobPayload);
    } catch (err) {
      logger.warn({ err, userId }, 'Failed to queue verification OTP');
      throw new ConflictError({ message: 'Failed to send verification email. Please try again.' });
    }

    await setResendCooldown(userId, RESEND_COOLDOWN_SECONDS);

    return { sent: true, resendAfterSeconds: RESEND_COOLDOWN_SECONDS };
  }

  private generateOtp(): string {
    const max = 10 ** OTP_LENGTH - 1;
    const min = 10 ** (OTP_LENGTH - 1);
    return String(randomInt(min, max + 1));
  }
}
