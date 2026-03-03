import jwt from 'jsonwebtoken';

import { env } from '@/config/env';

const STATE_EXPIRY = '10m';

export interface OAuthStatePayload {
  provider: string;
  redirectUri: string;
  successRedirect?: string;
  nonce: string;
}

export function createOAuthState(payload: OAuthStatePayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: STATE_EXPIRY,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

export function verifyOAuthState(token: string): OAuthStatePayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as OAuthStatePayload & { exp?: number };
  return {
    provider: decoded.provider,
    redirectUri: decoded.redirectUri,
    successRedirect: decoded.successRedirect,
    nonce: decoded.nonce,
  };
}
