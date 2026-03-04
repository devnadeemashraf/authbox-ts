import { signAccessToken, signRefreshToken } from '@/core/security/jwt';

export const AUTH_BASE = '/api/v1/auth';

/** Valid access token for protected routes. Auth guard only checks JWT validity. */
export function validAccessToken(overrides?: { sub?: string; jti?: string }): string {
  return signAccessToken({
    sub: overrides?.sub ?? 'user-123',
    email: 'test@example.com',
    permissions: 1,
    tierId: 1,
    jti: overrides?.jti ?? 'session-456',
  });
}

/** Valid refresh token for logout/refresh flows. */
export function validRefreshToken(): string {
  return signRefreshToken({
    sub: 'user-123',
    email: 'test@example.com',
    permissions: 1,
    tierId: 1,
    jti: 'session-456',
  });
}
