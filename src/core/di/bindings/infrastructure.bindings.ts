import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { getDb } from '@/infrastructure/database/db.client';

/**
 * Registers infrastructure dependencies (DB, Redis, etc.) with the container.
 */
export function registerInfrastructureBindings(container: DependencyContainer): void {
  container.register(Tokens.Infrastructure.Database, { useValue: getDb() });
}
