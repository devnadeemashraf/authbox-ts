import type { Job } from 'bullmq';

import type { IMailer } from '@/core/interfaces/mailer.interface';
import type { WelcomeEmailJobPayload } from '@/infrastructure/queue/job-payloads';
import { QUEUE_NAMES } from '@/infrastructure/queue/queue-names';

export function createWelcomeEmailProcessor(mailer: IMailer) {
  return async (job: Job<WelcomeEmailJobPayload>): Promise<void> => {
    const { email, name } = job.data;
    const greeting = name ? `Hi ${name}` : 'Hi';

    await mailer.send({
      to: email,
      subject: 'Welcome!',
      text: `${greeting}, welcome to Authbox. Your account has been created successfully.`,
      html: `<p>${greeting},</p><p>Welcome to Authbox. Your account has been created successfully.</p>`,
    });
  };
}

export const WELCOME_EMAIL_QUEUE_NAME = QUEUE_NAMES.WELCOME_EMAIL;
