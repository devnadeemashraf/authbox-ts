import { inject, injectable } from 'tsyringe';

import type { ICacheAdapter } from './cache.types';
import { CacheKeys, SESSION_TTL_SECONDS } from './cache-keys';

import { Tokens } from '@/core/di/tokens';
import { getQueueConnection } from '@/infrastructure/queue/redis.client';

/** Cached session entry: userId for quick lookup during refresh. */
export interface CachedSession {
  userId: string;
}

/**
 * Session cache: stores active session IDs and userId lookups.
 * Invalidate on: logout, revoke, revoke-all, refresh (rotate).
 */
@injectable()
export class SessionCache {
  constructor(@inject(Tokens.Cache.CacheAdapter) private readonly cache: ICacheAdapter) {}

  private get redis() {
    return getQueueConnection();
  }

  /** Get userId for a session. Returns null if not cached or expired. */
  async getSessionUserId(sessionId: string): Promise<string | null> {
    const cached = await this.cache.get<CachedSession>(CacheKeys.session(sessionId));
    return cached?.userId ?? null;
  }

  /** Store session and add to user's session set. Call after sessionRepo.create. */
  async addSession(userId: string, sessionId: string): Promise<void> {
    const key = CacheKeys.session(sessionId);
    await this.cache.set<CachedSession>(key, { userId }, SESSION_TTL_SECONDS);
    await this.redis.sadd(CacheKeys.userSessions(userId), sessionId);
  }

  /** Remove session. Call after sessionRepo.delete. */
  async removeSession(userId: string, sessionId: string): Promise<void> {
    await this.cache.del(CacheKeys.session(sessionId));
    await this.redis.srem(CacheKeys.userSessions(userId), sessionId);
  }

  /** Remove all sessions for a user. Call after sessionRepo.deleteByUserId. */
  async removeAllSessionsForUser(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(CacheKeys.userSessions(userId));
    for (const id of sessionIds) {
      await this.cache.del(CacheKeys.session(id));
    }
    await this.redis.del(CacheKeys.userSessions(userId));
  }

  /** Count active sessions for user (from Redis set). May overcount by expired sessions. */
  async countActiveByUserId(userId: string): Promise<number> {
    const count = await this.redis.scard(CacheKeys.userSessions(userId));
    return count;
  }
}
