/**
 * Centralized cache key registry. Single source of truth for keys and TTLs.
 * All cache consumers must use these constants for consistency and safe invalidation.
 */

/** Default TTL for user cache (5 minutes). */
export const USER_CACHE_TTL_SECONDS = 300;

/** Session TTL (7 days, matches refresh token expiry). */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const PREFIX = {
  session: 'session:',
  userSessions: 'user:sessions:',
  userById: 'user:id:',
  userByEmail: 'user:email:',
} as const;

export const CacheKeys = {
  session: (sessionId: string) => `${PREFIX.session}${sessionId}`,
  userSessions: (userId: string) => `${PREFIX.userSessions}${userId}`,
  userById: (userId: string) => `${PREFIX.userById}${userId}`,
  userByEmail: (email: string) => `${PREFIX.userByEmail}${email.toLowerCase()}`,
  /** Pattern for invalidating all user-related keys (use with caution). */
  userByIdPattern: () => `${PREFIX.userById}*`,
  userByEmailPattern: () => `${PREFIX.userByEmail}*`,
} as const;
