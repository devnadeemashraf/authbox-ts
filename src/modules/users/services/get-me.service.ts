import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { Tokens } from '@/core/di/tokens';
import { NotFoundError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import type { UserCache } from '@/infrastructure/cache/user-cache';

/**
 * Fetches the current user by id. Used for GET /me. Uses cache when available.
 */
@injectable()
export class GetMeService {
  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
  ) {}

  async execute(userId: string): Promise<User> {
    let user = await this.userCache.getById(userId);
    if (!user) {
      user = await this.userRepo.findById(userId);
      if (user) await this.userCache.set(user);
    }
    if (!user) {
      throw new NotFoundError({ message: 'User not found' });
    }
    return user;
  }
}
