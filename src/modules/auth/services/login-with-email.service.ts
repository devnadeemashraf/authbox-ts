import { randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';
import type { LoginInput } from '../schemas/auth.schemas';
import type { TierEnforcementService } from './tier-enforcement.service';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { UnauthorizedError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import { signAccessToken, signRefreshToken } from '@/core/security/jwt';
import type { PasswordHasher } from '@/core/security/password-hasher';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const INVALID_CREDENTIALS = 'Invalid email or password';

export interface LoginResult {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

@injectable()
export class LoginWithEmailService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @inject(Tokens.Auth.TierEnforcementService)
    private readonly tierEnforcement: TierEnforcementService,
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

    const valid = await this.passwordHasher.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError({ message: INVALID_CREDENTIALS });
    }

    await this.tierEnforcement.enforceSessionLimit(user);

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
      jti: sessionId,
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
