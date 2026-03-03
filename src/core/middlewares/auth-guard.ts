import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '@/core/errors/client-errors';
import type { AccessTokenPayload } from '@/core/security/jwt';
import { verifyToken } from '@/core/security/jwt';

/**
 * Auth context attached to req.user after successful JWT verification.
 * Permissions and tierId come from the token payload (no DB lookup).
 */
export interface AuthUser {
  id: string;
  email: string;
  permissions: number;
  tierId: number;
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
 * authGuard middleware: verifies JWT, attaches req.user, optionally checks permission.
 *
 * - Without permission: any valid access token passes.
 * - With permission: requires (user.permissions & permission) !== 0; else 403 Forbidden.
 *
 * @param permission - Optional bitmask from Permissions; enforces O(1) permission check.
 */
export function authGuard(permission?: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
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

    if (payload.type !== 'access') {
      next(new UnauthorizedError({ message: 'Invalid token type' }));
      return;
    }

    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      permissions: payload.permissions,
      tierId: payload.tierId,
    };
    (req as AuthenticatedRequest).user = user;

    if (permission !== undefined && (user.permissions & permission) === 0) {
      next(new ForbiddenError({ message: 'Insufficient permissions' }));
      return;
    }

    next();
  };
}
