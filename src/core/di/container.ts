import { container } from 'tsyringe';

import { applyBindings } from './bindings';

import { logger } from '@/core/logger';

/**
 * Bootstraps the DI container: applies all bindings so that injectables
 * can resolve their dependencies. Call once during server startup.
 */
export function bootstrapDI(): void {
  applyBindings(container);
  logger.info('DI container bootstrapped');
}

export { container };
