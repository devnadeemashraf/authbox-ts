/**
 * Queue names. Each queue is isolated to avoid cross-use-case interference.
 * Add new names here when introducing new job types.
 */
export const QUEUE_NAMES = {
  EMAIL_VERIFICATION: 'email-verification',
  WELCOME_EMAIL: 'welcome-email',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
