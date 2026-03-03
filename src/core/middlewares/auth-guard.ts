import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/core/errors/client-errors';

/**
 * Stub auth guard middleware. Returns 401 for all requests.
 * Will be replaced with JWT verification in a later commit.
 */
export function authGuard(_req: Request, _res: Response, next: NextFunction): void {
  next(new UnauthorizedError({ message: 'Authentication required' }));
}
