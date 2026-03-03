import { env } from '@/config/env';
import type { IOAuthProvider, OAuthProfile } from '@/core/interfaces/oauth-provider.interface';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const SCOPES = ['openid', 'email', 'profile'];

export class GoogleOAuthProvider implements IOAuthProvider {
  readonly name = 'google';

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ accessToken: string }> {
    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google token exchange failed: ${err}`);
    }

    const data = (await res.json()) as { access_token: string };
    return { accessToken: data.access_token };
  }

  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Google userinfo failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      id: string;
      email?: string;
      verified_email?: boolean;
      name?: string;
    };

    return {
      providerId: data.id,
      email: data.email ?? '',
      emailVerified: Boolean(data.verified_email),
      name: data.name ?? null,
    };
  }
}
