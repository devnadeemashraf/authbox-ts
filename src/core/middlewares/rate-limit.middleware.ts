import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import type { RedisReply } from 'rate-limit-redis';
import { RedisStore } from 'rate-limit-redis';

import { env } from '@/config/env';
import { RATE_LIMIT } from '@/core/config/rate-limit.config';
import { TIER_BY_ID } from '@/core/config/tiers.config';
import { error } from '@/core/response';
import { getQueueConnection } from '@/infrastructure/queue/redis.client';

/** Shared rate-limit response to match app error format */
function rateLimitHandler(_req: Request, res: Response): void {
  error(res, {
    statusCode: 429,
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
  });
}

function createRedisStore(): RedisStore | undefined {
  try {
    const redis: Redis = getQueueConnection();
    return new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    });
  } catch {
    return undefined;
  }
}

/**
 * Strict rate limit for auth-sensitive routes (login, register, forgot-password).
 * 5 req/min per IP. Uses Redis store when available, otherwise memory.
 * In testing, uses a high limit so integration tests do not hit it.
 */
export const authStrictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: env.NODE_ENV === 'testing' ? 10_000 : RATE_LIMIT.AUTH_MAX_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: createRedisStore(),
});

/**
 * Tier-based rate limit for authenticated routes.
 * Must run AFTER authGuard (req.user must be set).
 * Uses generous limit for free, extended for premium.
 */
export function createTierRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
      const user = (req as Request & { user?: { tierId: number } }).user;
      if (!user?.tierId) return 100; // fallback
      const tier = TIER_BY_ID[user.tierId] ?? TIER_BY_ID[1];
      const limit = (tier.features as { rateLimit?: { requestsPerMinute: number } }).rateLimit
        ?.requestsPerMinute;
      return limit ?? 100;
    },
    keyGenerator: (req) => {
      const user = (req as Request & { user?: { id: string } }).user;
      if (user?.id) return user.id;
      return req.ip ? ipKeyGenerator(req.ip) : 'anonymous';
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    store: createRedisStore(),
  });
}

export const tierRateLimiter = createTierRateLimiter();
