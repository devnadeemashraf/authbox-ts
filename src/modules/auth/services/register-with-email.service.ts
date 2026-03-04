import { randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { RegisterInput } from '../schemas/auth.schemas';
import type { QueueWelcomeEmailService } from './queue-welcome-email.service';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { ConflictError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import type { PasswordHasher } from '@/core/security/password-hasher';
import { Permissions } from '@/core/security/permissions';
import type { UserCache } from '@/infrastructure/cache/user-cache';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const DEFAULT_TIER_ID = 1; // free tier id in database
const DEFAULT_PERMISSIONS = Permissions.UPDATE_PROFILE | Permissions.UPLOAD_AVATAR;

@injectable()
export class RegisterWithEmailService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @inject(Tokens.Auth.QueueWelcomeEmailService)
    private readonly queueWelcomeEmail: QueueWelcomeEmailService,
  ) {
    super(db);
  }

  async execute(input: RegisterInput): Promise<{ user: User }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError({ message: 'Email already registered' });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepo.create({
      id: randomUUID(),
      email: input.email.toLowerCase(),
      username: null,
      passwordHash,
      isEmailVerified: false,
      permissions: DEFAULT_PERMISSIONS,
      tierId: DEFAULT_TIER_ID,
    });

    await this.userCache.set(user);
    await this.queueWelcomeEmail.execute(user.email);

    return { user };
  }
}
