import type { Job } from 'bullmq';

import type { IMailer } from '@/core/interfaces/mailer.interface';
import type { PasswordResetJobPayload } from '@/infrastructure/queue/job-payloads';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

const OTP_EXPIRY_MINUTES = 10;

export function createPasswordResetProcessor(mailer: IMailer) {
  return async (job: Job<PasswordResetJobPayload>): Promise<void> => {
    const { email, otp } = job.data;

    await mailer.send({
      to: email,
      subject: 'Your password reset code',
      text: `Your password reset code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your password reset code is: <strong>${otp}</strong>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });
  };
}

export const PASSWORD_RESET_QUEUE_NAME = QUEUE_NAMES.PASSWORD_RESET;
