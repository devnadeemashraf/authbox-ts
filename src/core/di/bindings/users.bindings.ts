import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { UserRepository } from '@/modules/users/repositories/user.repository';
import { GetMeService } from '@/modules/users/services/get-me.service';
import { UpdateMeService } from '@/modules/users/services/update-me.service';

/**
 * Registers users-module dependencies with the container.
 */
export function registerUsersBindings(container: DependencyContainer): void {
  container.register(Tokens.Users.UserRepository, { useClass: UserRepository });
  container.register(Tokens.Users.GetMeService, { useClass: GetMeService });
  container.register(Tokens.Users.UpdateMeService, { useClass: UpdateMeService });
}
