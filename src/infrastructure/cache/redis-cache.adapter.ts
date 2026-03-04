import { injectable } from 'tsyringe';

import type { ICacheAdapter } from './cache.types';

import { getQueueConnection } from '@/infrastructure/queue/redis.client';

const DEFAULT_TTL_SECONDS = 300;

/**
 * Redis-backed cache adapter. Uses the shared queue Redis connection.
 * Implements generic get/set/del for any JSON-serializable value.
 */
@injectable()
export class RedisCacheAdapter implements ICacheAdapter {
  private get redis() {
    return getQueueConnection();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.setex(key, ttlSeconds, serialized);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    await this.redis.del(...keys);
    return keys.length;
  }
}
