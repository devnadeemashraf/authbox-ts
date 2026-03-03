import type { IMailer, SendEmailOptions } from '@/core/interfaces/mailer.interface';
import { logger } from '@/core/logger';

/**
 * Console mailer for development/testing. Logs emails instead of sending.
 */
export class ConsoleMailer implements IMailer {
  async send(options: SendEmailOptions): Promise<void> {
    logger.info(
      { to: options.to, subject: options.subject, preview: options.text.slice(0, 80) },
      '[ConsoleMailer] Email would be sent',
    );
  }
}
