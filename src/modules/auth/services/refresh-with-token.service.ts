import { randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { UnauthorizedError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import type { RefreshTokenPayload } from '@/core/security/jwt';
import { signAccessToken, signRefreshToken, verifyToken } from '@/core/security/jwt';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshResult {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

const REFRESH_ERROR = 'Invalid or expired refresh token';

/**
 * Refresh service: validates refresh token, rotates session, returns new tokens.
 * Implements refresh token rotation: old session is deleted, new session created.
 */
@injectable()
export class RefreshWithTokenService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {
    super(db);
  }

  async execute(
    input: RefreshInput,
    options?: { deviceInfo?: string; ipAddress?: string },
  ): Promise<RefreshResult> {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyToken<RefreshTokenPayload>(input.refreshToken);
    } catch {
      throw new UnauthorizedError({ message: REFRESH_ERROR });
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedError({ message: REFRESH_ERROR });
    }

    const session = await this.sessionRepo.findById(payload.jti);
    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedError({ message: REFRESH_ERROR });
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      throw new UnauthorizedError({ message: REFRESH_ERROR });
    }

    await this.sessionRepo.delete(payload.jti);

    const newSessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionRepo.create({
      id: newSessionId,
      userId: user.id,
      deviceInfo: options?.deviceInfo ?? null,
      ipAddress: options?.ipAddress ?? null,
      expiresAt,
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      permissions: user.permissions,
      tierId: user.tierId,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      permissions: user.permissions,
      tierId: user.tierId,
      jti: newSessionId,
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }
}
