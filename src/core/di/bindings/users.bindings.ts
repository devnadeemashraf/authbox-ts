import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { UserRepository } from '@/modules/users/repositories/user.repository';

/**
 * Registers users-module dependencies with the container.
 */
export function registerUsersBindings(container: DependencyContainer): void {
  container.register(Tokens.Users.UserRepository, { useClass: UserRepository });
}
