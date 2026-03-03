import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from './auth-guard';

import { ForbiddenError, UnauthorizedError } from '@/core/errors/client-errors';

/**
 * requirePermission middleware: enforces that the authenticated user has the given permission.
 *
 * Single responsibility: authorization only (permission check).
 * Must be used after authGuard; req.user must already be set.
 *
 * Uses O(1) bitmask check: (user.permissions & permission) !== 0
 *
 * @param permission - Bitmask from Permissions (e.g. Permissions.MANAGE_USERS)
 */
export function requirePermission(permission: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      next(new UnauthorizedError({ message: 'Authentication required' }));
      return;
    }

    if ((user.permissions & permission) === 0) {
      next(new ForbiddenError({ message: 'Insufficient permissions' }));
      return;
    }

    next();
  };
}
