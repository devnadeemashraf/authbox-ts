import type { DependencyContainer } from 'tsyringe';

import { registerInfrastructureBindings } from './infrastructure.bindings';

/**
 * Applies all DI bindings to the container. Add new binding modules here as
 * infrastructure grows (cache, mailer, etc.).
 */
export function applyBindings(container: DependencyContainer): void {
  registerInfrastructureBindings(container);
}
