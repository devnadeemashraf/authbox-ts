import { randomUUID } from 'node:crypto';

import type { User } from '@/core/interfaces/user.types';

type UserFactoryOverrides = Partial<Omit<User, 'createdAt' | 'updatedAt'>> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Builds a User object for tests. Override any field via the overrides param.
 * Each call generates fresh UUIDs for id, email, and username.
 *
 * @example
 * const user = UserFactory.build({ email: 'test@example.com' });
 * const verifiedUser = UserFactory.build({ isEmailVerified: true });
 */
export const UserFactory = {
  build(overrides: UserFactoryOverrides = {}): User {
    const id = randomUUID();
    const suffix = id.slice(0, 8);
    const defaults: User = {
      id,
      email: `user-${suffix}@example.com`,
      username: `user_${suffix}`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$...',
      isEmailVerified: false,
      permissions: 1,
      tierId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { ...defaults, ...overrides };
  },
};
