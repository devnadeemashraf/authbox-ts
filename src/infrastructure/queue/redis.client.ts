import Redis from 'ioredis';

import { env } from '@/config/env';
import { logger } from '@/core/logger';

/** Connection options for BullMQ. Pass to Queue/Worker to avoid ioredis version mismatch. */
export const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
} as const;

/** Redis connection for BullMQ Queue (producer). Use default retry for quick failure. */
let queueConnection: Redis | null = null;

/** Redis connection for BullMQ Worker. Requires maxRetriesPerRequest: null for blocking. */
let workerConnection: Redis | null = null;

function createConnection(options: { maxRetriesPerRequest: number | null }): Redis {
  const redis = new Redis({
    ...redisConnectionOptions,
    maxRetriesPerRequest: options.maxRetriesPerRequest,
  });

  redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  redis.on('connect', () => logger.debug('Redis connected'));

  return redis;
}

/**
 * Returns Redis connection for Queue (producer). Use in HTTP/API layer.
 */
export function getQueueConnection(): Redis {
  if (!queueConnection) {
    queueConnection = createConnection({ maxRetriesPerRequest: 1 });
  }
  return queueConnection;
}

/**
 * Returns Redis connection for Worker. Use in worker process only.
 * maxRetriesPerRequest: null allows indefinite blocking for workers.
 */
export function getWorkerConnection(): Redis {
  if (!workerConnection) {
    workerConnection = createConnection({ maxRetriesPerRequest: null });
  }
  return workerConnection;
}

export async function disconnectQueue(): Promise<void> {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
    logger.info('Queue Redis connection closed');
  }
}

export async function disconnectWorker(): Promise<void> {
  if (workerConnection) {
    await workerConnection.quit();
    workerConnection = null;
    logger.info('Worker Redis connection closed');
  }
}

/** Key prefix for resend cooldown. TTL in seconds. */
const COOLDOWN_PREFIX = 'email:resend:cooldown:';

export async function setResendCooldown(userId: string, ttlSeconds: number): Promise<void> {
  const redis = getQueueConnection();
  await redis.setex(`${COOLDOWN_PREFIX}${userId}`, ttlSeconds, '1');
}

export async function getResendCooldownTtl(userId: string): Promise<number> {
  const redis = getQueueConnection();
  return redis.ttl(`${COOLDOWN_PREFIX}${userId}`);
}

/** Key prefix for password-reset cooldown (by email). */
const PWD_RESET_COOLDOWN_PREFIX = 'pwd_reset:cooldown:';

export async function setPasswordResetCooldown(email: string, ttlSeconds: number): Promise<void> {
  const redis = getQueueConnection();
  await redis.setex(`${PWD_RESET_COOLDOWN_PREFIX}${email.toLowerCase()}`, ttlSeconds, '1');
}

export async function getPasswordResetCooldownTtl(email: string): Promise<number> {
  const redis = getQueueConnection();
  return redis.ttl(`${PWD_RESET_COOLDOWN_PREFIX}${email.toLowerCase()}`);
}

/** Short-lived reset token (single-use). TTL in seconds. */
const RESET_TOKEN_PREFIX = 'pwd_reset:token:';
export const RESET_TOKEN_TTL_SECONDS = 600; // 10 minutes

export async function setResetToken(token: string, userId: string): Promise<void> {
  const redis = getQueueConnection();
  await redis.setex(`${RESET_TOKEN_PREFIX}${token}`, RESET_TOKEN_TTL_SECONDS, userId);
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const redis = getQueueConnection();
  const key = `${RESET_TOKEN_PREFIX}${token}`;
  const userId = await redis.get(key);
  if (!userId) return null;
  await redis.del(key); // Single-use: delete on consume
  return userId;
}
