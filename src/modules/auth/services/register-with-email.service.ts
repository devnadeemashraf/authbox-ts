import { randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { RegisterInput } from '../schemas/auth.schemas';

import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { ConflictError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import type { PasswordHasher } from '@/core/security/password-hasher';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

const DEFAULT_TIER_ID = 1; // free tier
const DEFAULT_PERMISSIONS = 1; // READ_PROFILE

@injectable()
export class RegisterWithEmailService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Security.PasswordHasher) private readonly passwordHasher: PasswordHasher,
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

    return { user };
  }
}
