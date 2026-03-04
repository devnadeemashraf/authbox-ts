import { inject, injectable } from 'tsyringe';

import type { ICacheAdapter } from './cache.types';
import { CacheKeys, USER_CACHE_TTL_SECONDS } from './cache-keys';

import { Tokens } from '@/core/di/tokens';
import type { User } from '@/core/interfaces/user.types';

/** Stored shape (dates as ISO strings). */
interface CachedUserRaw {
  id: string;
  email: string;
  username: string | null;
  passwordHash: string | null;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  permissions: number;
  tierId: number;
  createdAt: string;
  updatedAt: string;
}

function toUser(raw: CachedUserRaw): User {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

function toRaw(user: User): CachedUserRaw {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * User cache: caches user by ID and email.
 * Invalidate on: user update, password change, avatar change, tier change.
 */
@injectable()
export class UserCache {
  constructor(@inject(Tokens.Cache.CacheAdapter) private readonly cache: ICacheAdapter) {}

  async getById(userId: string): Promise<User | null> {
    const raw = await this.cache.get<CachedUserRaw>(CacheKeys.userById(userId));
    return raw ? toUser(raw) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const raw = await this.cache.get<CachedUserRaw>(CacheKeys.userByEmail(email.toLowerCase()));
    return raw ? toUser(raw) : null;
  }

  async set(user: User): Promise<void> {
    const raw = toRaw(user);
    await this.cache.set(CacheKeys.userById(user.id), raw, USER_CACHE_TTL_SECONDS);
    await this.cache.set(CacheKeys.userByEmail(user.email), raw, USER_CACHE_TTL_SECONDS);
  }

  /** Invalidate all cache entries for a user. Call after any user mutation. */
  async invalidateUser(userId: string, email?: string): Promise<void> {
    await this.cache.del(CacheKeys.userById(userId));
    if (email) {
      await this.cache.del(CacheKeys.userByEmail(email));
    }
  }
}
