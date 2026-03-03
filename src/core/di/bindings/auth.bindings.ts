import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { env } from '@/config/env';
import { GoogleOAuthProvider } from '@/modules/auth/providers/google-oauth.provider';
import { OAuthProviderRegistry } from '@/modules/auth/providers/oauth-provider.registry';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { SocialProviderRepository } from '@/modules/auth/repositories/social-provider.repository';
import { LoginWithEmailService } from '@/modules/auth/services/login-with-email.service';
import { LogoutWithRefreshService } from '@/modules/auth/services/logout-with-refresh.service';
import { OAuthService } from '@/modules/auth/services/oauth.service';
import { RefreshWithTokenService } from '@/modules/auth/services/refresh-with-token.service';
import { RegisterWithEmailService } from '@/modules/auth/services/register-with-email.service';
import { TierEnforcementService } from '@/modules/auth/services/tier-enforcement.service';

/**
 * Registers auth-module dependencies with the container.
 */
export function registerAuthBindings(container: DependencyContainer): void {
  container.register(Tokens.Auth.SessionRepository, { useClass: SessionRepository });
  container.register(Tokens.Auth.SocialProviderRepository, { useClass: SocialProviderRepository });
  container.register(Tokens.Auth.TierEnforcementService, { useClass: TierEnforcementService });
  container.register(Tokens.Auth.LoginWithEmailService, { useClass: LoginWithEmailService });
  container.register(Tokens.Auth.RegisterWithEmailService, { useClass: RegisterWithEmailService });
  container.register(Tokens.Auth.LogoutWithRefreshService, { useClass: LogoutWithRefreshService });
  container.register(Tokens.Auth.RefreshWithTokenService, { useClass: RefreshWithTokenService });

  container.register(Tokens.Auth.OAuthProviderRegistry, {
    useFactory: () => {
      const registry = new OAuthProviderRegistry();
      if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
        registry.register(new GoogleOAuthProvider());
      }
      return registry;
    },
  });
  container.register(Tokens.Auth.OAuthService, { useClass: OAuthService });
}
