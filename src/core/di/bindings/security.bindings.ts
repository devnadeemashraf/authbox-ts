import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { PasswordHasher } from '@/core/security/password-hasher';

/**
 * Registers security dependencies (hashing, etc.) with the container.
 */
export function registerSecurityBindings(container: DependencyContainer): void {
  container.register(Tokens.Security.PasswordHasher, { useClass: PasswordHasher });
}
