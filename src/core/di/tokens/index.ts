import { AuthTokens } from './auth.tokens';
import { FilesTokens } from './files.tokens';
import { InfrastructureTokens } from './infrastructure.tokens';
import { SecurityTokens } from './security.tokens';
import { SubscriptionsTokens } from './subscriptions.tokens';
import { UsersTokens } from './users.tokens';

/**
 * Aggregated tokens by layer. Add new token modules and merge here as the app grows.
 */
export const Tokens = {
  Infrastructure: InfrastructureTokens,
  Security: SecurityTokens,
  Auth: AuthTokens,
  Users: UsersTokens,
  Files: FilesTokens,
  Subscriptions: SubscriptionsTokens,
} as const;
