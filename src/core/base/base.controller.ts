import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/core/errors/client-errors';
import type { AuthenticatedRequest } from '@/core/middlewares/auth-guard';

export type { AuthenticatedRequest };

/**
 * Base class for all controllers.
 * Provides asyncHandler to eliminate try/catch boilerplate and getUserId helper.
 *
 * Subclasses should:
 * - Extend BaseController
 * - Use this.asyncHandler() to wrap all route handlers
 * - Use this.getUserId(req) in authenticated routes to get the current user's ID
 */
export class BaseController {
  /**
   * Wraps an async route handler so errors are forwarded to the global error handler.
   * Eliminates the need for try/catch in every controller method.
   *
   * @example
   * router.get('/me', authGuard, controller.asyncHandler(controller.getMe));
   */
  protected asyncHandler(
    fn: (req: Request, res: Response) => Promise<void>,
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req, res, next) => {
      fn(req, res).catch(next);
    };
  }

  /**
   * Extracts the authenticated user's ID from the request.
   * Must be used only after authGuard middleware has run.
   *
   * @throws UnauthorizedError when req.user is missing
   */
  protected getUserId(req: Request): string {
    const user = (req as AuthenticatedRequest).user;
    if (!user?.id) {
      throw new UnauthorizedError({ message: 'Authentication required' });
    }
    return user.id;
  }
}
