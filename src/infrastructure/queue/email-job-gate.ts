/**
 * Single choke point for all email-related job enqueuing.
 *
 * When EMAIL_DELIVERY_ENABLED is false:
 * - No jobs are added to email queues.
 * - OTP-bearing payloads (verification, password reset) are logged so devs can
 *   test the verify flow without a real mailer.
 * - Features like email verification "bypass" actual sending (less secure, acceptable tradeoff).
 *
 * When true: delegates to the real queue. No behaviour change.
 */

import { getQueue } from './queue.registry';
import type { QueueName } from './queue-names';
import { QUEUE_NAMES } from './queue-names';

import { env } from '@/config/env';
import { logger } from '@/core/logger';

/** Queues whose jobs send emails. When EMAIL_DELIVERY_ENABLED=false, we skip adding. */
const EMAIL_QUEUE_NAMES: readonly QueueName[] = [
  QUEUE_NAMES.EMAIL_VERIFICATION,
  QUEUE_NAMES.WELCOME_EMAIL,
  QUEUE_NAMES.PASSWORD_RESET,
  QUEUE_NAMES.SUBSCRIPTION_RENEWAL_REMINDER,
] as const;

type EmailQueueName = (typeof EMAIL_QUEUE_NAMES)[number];

function isEmailQueue(name: string): name is EmailQueueName {
  return (EMAIL_QUEUE_NAMES as readonly string[]).includes(name);
}

type RepeatOptions = { repeat: { pattern: string } };

/**
 * Adds a job to an email queue iff EMAIL_DELIVERY_ENABLED is true.
 * When disabled, logs OTP for verification/reset payloads so devs can test.
 */
export async function addEmailJobIfEnabled<T extends object>(
  queueName: EmailQueueName,
  jobName: string,
  payload: T,
  options?: { repeat?: { pattern: string } },
): Promise<void> {
  if (!env.EMAIL_DELIVERY_ENABLED) {
    const p = payload as Record<string, unknown>;
    if ('otp' in p && typeof p.otp === 'string') {
      const email = 'email' in p ? String(p.email) : 'unknown';
      logger.info(
        { queue: queueName, email },
        `[Email delivery disabled] OTP for ${email}: ${p.otp}`,
      );
    }
    return;
  }

  const queue = getQueue(queueName);
  if (options?.repeat) {
    await queue.add(jobName, payload, { repeat: options.repeat } as RepeatOptions);
  } else {
    await queue.add(jobName, payload);
  }
}

/**
 * Returns true if the given queue sends emails and delivery is disabled.
 * Use when scheduling: e.g. skip SUBSCRIPTION_RENEWAL_REMINDER when disabled.
 */
export function shouldSkipEmailQueue(queueName: QueueName): boolean {
  return isEmailQueue(queueName) && !env.EMAIL_DELIVERY_ENABLED;
}
