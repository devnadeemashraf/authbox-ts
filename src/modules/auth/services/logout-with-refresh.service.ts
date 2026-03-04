import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { RefreshTokenPayload } from '@/core/security/jwt';
import { verifyToken } from '@/core/security/jwt';
import type { SessionCache } from '@/infrastructure/cache/session-cache';

export interface LogoutInput {
  refreshToken: string;
}

/**
 * Logout service: invalidates the session associated with the refresh token.
 * Verifies the token, extracts session id (jti), and deletes the session from DB.
 * Invalidates session cache on logout.
 */
@injectable()
export class LogoutWithRefreshService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
    @inject(Tokens.Cache.SessionCache) private readonly sessionCache: SessionCache,
  ) {
    super(db);
  }

  async execute(input: LogoutInput): Promise<void> {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyToken<RefreshTokenPayload>(input.refreshToken);
    } catch {
      return;
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      return;
    }

    const userId = await this.sessionCache.getSessionUserId(payload.jti);
    await this.sessionRepo.delete(payload.jti);
    if (userId) await this.sessionCache.removeSession(userId, payload.jti);
  }
}
