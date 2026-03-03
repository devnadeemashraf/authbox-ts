import jwt from 'jsonwebtoken';

import { env } from '@/config/env';

const ACCESS_EXPIRY = '15m';

export interface TokenPayload {
  sub: string; // userId
  email: string;
  permissions: number;
  tierId: number;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
  jti: string; // session id
}

const signOptions: jwt.SignOptions = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' } as AccessTokenPayload, env.JWT_SECRET, {
    ...signOptions,
    expiresIn: ACCESS_EXPIRY,
  });
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type'>,
  expiresIn: string = env.JWT_EXPIRY,
): string {
  const options: jwt.SignOptions = {
    ...signOptions,
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    jwtid: payload.jti,
  };
  return jwt.sign({ ...payload, type: 'refresh' } as RefreshTokenPayload, env.JWT_SECRET, options);
}

export function verifyToken<T extends TokenPayload>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as T;
}
