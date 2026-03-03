/**
 * Auth-module tokens (repositories, services, controllers).
 * Keeps bindings explicit and swappable for tests.
 */
export const AuthTokens = {
  SessionRepository: Symbol('authbox.auth.SessionRepository'),
  SocialProviderRepository: Symbol('authbox.auth.SocialProviderRepository'),
  TierEnforcementService: Symbol('authbox.auth.TierEnforcementService'),
  LoginWithEmailService: Symbol('authbox.auth.LoginWithEmailService'),
  RegisterWithEmailService: Symbol('authbox.auth.RegisterWithEmailService'),
  LogoutWithRefreshService: Symbol('authbox.auth.LogoutWithRefreshService'),
  RefreshWithTokenService: Symbol('authbox.auth.RefreshWithTokenService'),
  OAuthProviderRegistry: Symbol('authbox.auth.OAuthProviderRegistry'),
  OAuthService: Symbol('authbox.auth.OAuthService'),
} as const;
