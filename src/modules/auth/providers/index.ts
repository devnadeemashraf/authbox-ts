/**
 * OAuth providers. Each implements IOAuthProvider.
 *
 * To add a new provider (e.g. GitHub):
 * 1. Create github-oauth.provider.ts implementing IOAuthProvider
 * 2. Register in auth.bindings.ts: registry.register(new GitHubOAuthProvider())
 * 3. Add env vars (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) in env.ts
 */
export { GoogleOAuthProvider } from './google-oauth.provider';
export { OAuthProviderRegistry } from './oauth-provider.registry';
