import { randomUUID } from 'node:crypto';

import * as argon2 from 'argon2';
import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { SessionRepository } from '../repositories/session.repository';
import type { LoginInput } from '../schemas/auth.schemas';

import { BaseService } from '@/core/base';
import { TIER_BY_ID } from '@/core/config/tiers.config';
import { Tokens } from '@/core/di/tokens';
import { ForbiddenError, UnauthorizedError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import { signAccessToken, signRefreshToken } from '@/core/security/jwt';
import { UserRepository } from '@/modules/users/repositories/user.repository';

const INVALID_CREDENTIALS = 'Invalid email or password';

export interface LoginResult {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

@injectable()
export class LoginWithEmailService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(UserRepository) private readonly userRepo: UserRepository,
    @inject(SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {
    super(db);
  }

  async execute(
    input: LoginInput,
    options?: { deviceInfo?: string; ipAddress?: string },
  ): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError({ message: INVALID_CREDENTIALS });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError({ message: INVALID_CREDENTIALS });
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError({ message: INVALID_CREDENTIALS });
    }

    const tier = TIER_BY_ID[user.tierId] ?? TIER_BY_ID[1];
    const maxSessions = tier.features.auth.maxSessions;
    const activeCount = await this.sessionRepo.countActiveByUserId(user.id);

    if (activeCount >= maxSessions) {
      throw new ForbiddenError({
        message: `Maximum ${maxSessions} active session(s) allowed. Please revoke one before logging in.`,
      });
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessionRepo.create({
      id: sessionId,
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
      jti: sessionId,
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }
}
