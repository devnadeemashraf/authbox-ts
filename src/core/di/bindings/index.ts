import type { DependencyContainer } from 'tsyringe';

import { registerAuthBindings } from './auth.bindings';
import { registerInfrastructureBindings } from './infrastructure.bindings';
import { registerSecurityBindings } from './security.bindings';
import { registerUsersBindings } from './users.bindings';

/**
 * Applies all DI bindings to the container. Add new binding modules here as
 * infrastructure grows (cache, mailer, etc.).
 */
export function applyBindings(container: DependencyContainer): void {
  registerInfrastructureBindings(container);
  registerSecurityBindings(container);
  registerUsersBindings(container);
  registerAuthBindings(container);
}
