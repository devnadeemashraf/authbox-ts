import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { Tokens } from '@/core/di/tokens';
import { ConflictError, NotFoundError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import type { UserCache } from '@/infrastructure/cache/user-cache';

/** Allowed fields for PATCH /me. Extend as needed (e.g. email with verification). */
export interface UpdateMeInput {
  username?: string | null;
}

/**
 * Updates the current user's profile. Username must be unique, 3–30 chars, alphanumeric + underscore.
 * Invalidates user cache on update.
 */
@injectable()
export class UpdateMeService {
  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
  ) {}

  async execute(userId: string, input: UpdateMeInput): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: 'User not found' });
    }

    if (input.username !== undefined) {
      const normalized = input.username === null ? null : input.username.trim().toLowerCase();
      if (normalized !== null && normalized.length > 0) {
        const existing = await this.userRepo.findByUsername(normalized);
        if (existing && existing.id !== userId) {
          throw new ConflictError({ message: 'Username already taken' });
        }
      }
      await this.userRepo.update(userId, { username: normalized });
    }

    await this.userCache.invalidateUser(userId, user.email);

    const updated = await this.userRepo.findById(userId);
    if (!updated) throw new NotFoundError({ message: 'User not found' });
    return updated;
  }
}
