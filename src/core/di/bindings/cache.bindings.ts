import type { DependencyContainer } from 'tsyringe';

import { CacheTokens } from '../tokens/cache.tokens';

import { RedisCacheAdapter } from '@/infrastructure/cache/redis-cache.adapter';
import { SessionCache } from '@/infrastructure/cache/session-cache';
import { UserCache } from '@/infrastructure/cache/user-cache';

export function registerCacheBindings(container: DependencyContainer): void {
  container.register(CacheTokens.CacheAdapter, { useClass: RedisCacheAdapter });
  container.register(CacheTokens.SessionCache, { useClass: SessionCache });
  container.register(CacheTokens.UserCache, { useClass: UserCache });
}
