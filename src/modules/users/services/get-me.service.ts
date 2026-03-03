import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { Tokens } from '@/core/di/tokens';
import { NotFoundError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';

/**
 * Fetches the current user by id. Used for GET /me.
 */
@injectable()
export class GetMeService {
  constructor(@inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: 'User not found' });
    }
    return user;
  }
}
