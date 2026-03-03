import type { IOAuthProvider } from '@/core/interfaces/oauth-provider.interface';

/**
 * Provider Registry (Factory Pattern).
 * Registers OAuth providers by name; core OAuth flow never knows concrete implementations.
 *
 * To add a new provider:
 * 1. Implement IOAuthProvider
 * 2. Register in auth.bindings: registry.register('github', new GitHubOAuthProvider(...))
 */
export class OAuthProviderRegistry {
  private readonly providers = new Map<string, IOAuthProvider>();

  register(provider: IOAuthProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): IOAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`OAuth provider not found: ${name}`);
    }
    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}
