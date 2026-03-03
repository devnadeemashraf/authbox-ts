import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { env } from '@/config/env';
import { GoogleOAuthProvider } from '@/modules/auth/providers/google-oauth.provider';
import { OAuthProviderRegistry } from '@/modules/auth/providers/oauth-provider.registry';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { SocialProviderRepository } from '@/modules/auth/repositories/social-provider.repository';
import { VerificationTokenRepository } from '@/modules/auth/repositories/verification-token.repository';
import { ListSessionsService } from '@/modules/auth/services/list-sessions.service';
import { LoginWithEmailService } from '@/modules/auth/services/login-with-email.service';
import { LogoutWithRefreshService } from '@/modules/auth/services/logout-with-refresh.service';
import { OAuthService } from '@/modules/auth/services/oauth.service';
import { QueueWelcomeEmailService } from '@/modules/auth/services/queue-welcome-email.service';
import { RefreshWithTokenService } from '@/modules/auth/services/refresh-with-token.service';
import { RegisterWithEmailService } from '@/modules/auth/services/register-with-email.service';
import { ResetPasswordService } from '@/modules/auth/services/reset-password.service';
import { RevokeAllSessionsService } from '@/modules/auth/services/revoke-all-sessions.service';
import { RevokeSessionService } from '@/modules/auth/services/revoke-session.service';
import { SendPasswordResetOtpService } from '@/modules/auth/services/send-password-reset-otp.service';
import { SendVerificationOtpService } from '@/modules/auth/services/send-verification-otp.service';
import { TierEnforcementService } from '@/modules/auth/services/tier-enforcement.service';
import { VerifyEmailOtpService } from '@/modules/auth/services/verify-email-otp.service';
import { VerifyPasswordResetOtpService } from '@/modules/auth/services/verify-password-reset-otp.service';

/**
 * Registers auth-module dependencies with the container.
 */
export function registerAuthBindings(container: DependencyContainer): void {
  container.register(Tokens.Auth.SessionRepository, { useClass: SessionRepository });
  container.register(Tokens.Auth.VerificationTokenRepository, {
    useClass: VerificationTokenRepository,
  });
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
  container.register(Tokens.Auth.SendVerificationOtpService, {
    useClass: SendVerificationOtpService,
  });
  container.register(Tokens.Auth.VerifyEmailOtpService, { useClass: VerifyEmailOtpService });
  container.register(Tokens.Auth.QueueWelcomeEmailService, {
    useClass: QueueWelcomeEmailService,
  });
  container.register(Tokens.Auth.SendPasswordResetOtpService, {
    useClass: SendPasswordResetOtpService,
  });
  container.register(Tokens.Auth.VerifyPasswordResetOtpService, {
    useClass: VerifyPasswordResetOtpService,
  });
  container.register(Tokens.Auth.ResetPasswordService, { useClass: ResetPasswordService });
  container.register(Tokens.Auth.ListSessionsService, { useClass: ListSessionsService });
  container.register(Tokens.Auth.RevokeSessionService, { useClass: RevokeSessionService });
  container.register(Tokens.Auth.RevokeAllSessionsService, {
    useClass: RevokeAllSessionsService,
  });
}
