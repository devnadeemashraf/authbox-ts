/**
 * Normalized profile returned by any OAuth provider.
 * Lives in Shared Kernel so auth and provider implementations share the contract.
 */
export interface OAuthProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
}

/**
 * OAuth provider contract (Strategy Pattern).
 * Implement this interface to add a new provider—no changes to core OAuth flow.
 */
export interface IOAuthProvider {
  readonly name: string;

  /**
   * Builds the authorization URL for the OAuth consent screen.
   * @param state - CSRF token; must be verified on callback
   * @param redirectUri - Must match the URI registered with the provider
   */
  getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchanges the authorization code for access (and optionally refresh) tokens.
   */
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ accessToken: string }>;

  /**
   * Fetches the user profile from the provider using the access token.
   */
  getUserProfile(accessToken: string): Promise<OAuthProfile>;
}
