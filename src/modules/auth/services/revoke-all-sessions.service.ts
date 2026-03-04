import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { Tokens } from '@/core/di/tokens';
import type { SessionCache } from '@/infrastructure/cache/session-cache';

/**
 * Revokes all sessions for a user. User will need to log in again on all devices.
 * Invalidates session cache on revoke-all.
 */
@injectable()
export class RevokeAllSessionsService {
  constructor(
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
    @inject(Tokens.Cache.SessionCache) private readonly sessionCache: SessionCache,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.sessionRepo.deleteByUserId(userId);
    await this.sessionCache.removeAllSessionsForUser(userId);
  }
}
