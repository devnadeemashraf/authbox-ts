import { InfrastructureTokens } from './infrastructure.tokens';

/**
 * Aggregated tokens by layer. Add new token modules and merge here as the app grows.
 */
export const Tokens = {
  Infrastructure: InfrastructureTokens,

  // --- Future layers (add as needed)
  // Auth: AuthTokens,
  // Users: UserTokens,
} as const;
