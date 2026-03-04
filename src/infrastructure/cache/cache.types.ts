/**
 * Cache layer types. Supports composable lookup chains (Bloom → Cache → DB).
 */

export type LookupResult<T> = { found: true; value: T } | { found: false };

/** Symbol for "layer does not have this key" (delegate to next layer). */
export const CACHE_MISS = Symbol('cache_miss');
export type CacheMiss = typeof CACHE_MISS;

/**
 * Generic key-value cache adapter.
 * Implementations: Redis, in-memory (testing), etc.
 */
export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Delete all keys matching pattern (e.g. "user:id:*"). Use sparingly. */
  delPattern?(pattern: string): Promise<number>;
}

/**
 * Optional layer in a lookup chain (e.g. Bloom filter).
 * Returns CACHE_MISS to delegate to next layer.
 */
export interface ILookupLayer<T> {
  get(key: string): Promise<T | CacheMiss>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
