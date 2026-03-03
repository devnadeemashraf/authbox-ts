import type { Job } from 'bullmq';

/**
 * Shared context passed to worker definitions.
 * Add dependencies here as workers grow (e.g., db, logger).
 */
export interface WorkerContext {
  mailer: import('@/core/interfaces/mailer.interface').IMailer;
  subscriptionRepo?: import('@/modules/subscriptions/repositories/subscription.repository').SubscriptionRepository;
  userRepo?: import('@/modules/users/repositories/user.repository').UserRepository;
}

/** Processor function signature for BullMQ Worker. Accepts any job payload. */
export type JobProcessor = (job: Job) => Promise<void>;

/**
 * Worker definition (Strategy Pattern).
 * Each queue has one definition: queue name, processor factory, concurrency, label.
 */
export interface WorkerDefinition {
  queueName: string;
  createProcessor: (ctx: WorkerContext) => JobProcessor;
  concurrency?: number;
  label: string;
}
