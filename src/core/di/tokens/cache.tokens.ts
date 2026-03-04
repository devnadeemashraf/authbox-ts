/** Cache layer DI tokens. */
export const CacheTokens = {
  CacheAdapter: Symbol('authbox.cache.CacheAdapter'),
  SessionCache: Symbol('authbox.cache.SessionCache'),
  UserCache: Symbol('authbox.cache.UserCache'),
} as const;
