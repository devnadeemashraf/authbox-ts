import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/core/errors/client-errors';
import type { AccessTokenPayload } from '@/core/security/jwt';
import { verifyToken } from '@/core/security/jwt';

/**
 * Auth context attached to req.user after successful JWT verification.
 * Permissions and tierId come from the token payload (no DB lookup).
 * jti is the session id for the current access token (used for isCurrent in session list).
 */
export interface AuthUser {
  id: string;
  email: string;
  permissions: number;
  tierId: number;
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Extracts the access token from the Authorization header.
 * Expects format: "Authorization: Bearer <token>"
 */
function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith(BEARER_PREFIX)) {
    return null;
  }
  return auth.slice(BEARER_PREFIX.length).trim() || null;
}

/**
 * authGuard middleware: verifies JWT and attaches req.user.
 *
 * Single responsibility: authentication only (identity verification).
 * For authorization (permission checks), use requirePermission after authGuard.
 */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next(new UnauthorizedError({ message: 'Authentication required' }));
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyToken<AccessTokenPayload>(token);
  } catch {
    next(new UnauthorizedError({ message: 'Invalid or expired token' }));
    return;
  }

  if (payload.type !== 'access' || !payload.jti) {
    next(new UnauthorizedError({ message: 'Invalid token type' }));
    return;
  }

  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    permissions: payload.permissions,
    tierId: payload.tierId,
    jti: payload.jti,
  };
  (req as AuthenticatedRequest).user = user;
  next();
}
