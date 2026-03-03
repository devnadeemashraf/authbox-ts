# Adding a New OAuth Provider

The OAuth flow uses the **Strategy Pattern**: each provider implements `IOAuthProvider`. The core flow never changes.

## Steps to Add GitHub (or any provider)

### 1. Implement the provider

Create `github-oauth.provider.ts`:

```ts
import type { IOAuthProvider, OAuthProfile } from '@/core/interfaces/oauth-provider.interface';
import { env } from '@/config/env';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAIL_URL = 'https://api.github.com/user/emails';

export class GitHubOAuthProvider implements IOAuthProvider {
  readonly name = 'github';

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    });
    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ accessToken: string }> {
    // ... fetch and parse response
  }

  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    // ... fetch user and email, return normalized OAuthProfile
  }
}
```

### 2. Add env vars

In `src/config/env.ts`:

```ts
GITHUB_CLIENT_ID: str({ default: '' }),
GITHUB_CLIENT_SECRET: str({ default: '' }),
```

### 3. Register the provider

In `src/core/di/bindings/auth.bindings.ts`:

```ts
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  registry.register(new GitHubOAuthProvider());
}
```

### 4. Update SocialProviderName (if needed)

In `src/core/interfaces/social-provider.type.ts`, `github` is already included.

---

That's it. No changes to the OAuth service, controller, or routes.
