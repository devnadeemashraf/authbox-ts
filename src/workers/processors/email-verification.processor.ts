import type { Job } from 'bullmq';

import type { IMailer } from '@/core/interfaces/mailer.interface';
import type { EmailVerificationJobPayload } from '@/infrastructure/queue/job-payloads';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

const OTP_EXPIRY_MINUTES = 15;

export function createEmailVerificationProcessor(mailer: IMailer) {
  return async (job: Job<EmailVerificationJobPayload>): Promise<void> => {
    const { email, otp } = job.data;

    await mailer.send({
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });
  };
}

export const EMAIL_VERIFICATION_QUEUE_NAME = QUEUE_NAMES.EMAIL_VERIFICATION;
