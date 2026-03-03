/**
 * Mailer interface (Strategy Pattern).
 * Implementations: ConsoleMailer (dev/test), NodemailerMailer (prod).
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IMailer {
  send(options: SendEmailOptions): Promise<void>;
}
