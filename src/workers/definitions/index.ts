import type { WorkerDefinition } from '../worker.types';
import { emailVerificationWorker } from './email-verification.worker';
import { passwordResetWorker } from './password-reset.worker';
import { welcomeEmailWorker } from './welcome-email.worker';

/**
 * All worker definitions. Add new workers here.
 * To add a worker: create definition file, then add to this array.
 */
export const WORKER_DEFINITIONS: WorkerDefinition[] = [
  emailVerificationWorker,
  welcomeEmailWorker,
  passwordResetWorker,
];
