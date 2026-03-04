/**
 * Rate limit configuration.
 * Auth routes (login, register, forgot-password): strict per-IP to prevent brute force.
 * Tier limits for general API come from tiers.config.ts.
 */
export const RATE_LIMIT = {
  /** Auth-sensitive routes (login, register, forgot-password): requests per window per IP */
  AUTH_WINDOW_MS: 60 * 1000, // 1 minute
  AUTH_MAX_PER_WINDOW: 5,
} as const;
