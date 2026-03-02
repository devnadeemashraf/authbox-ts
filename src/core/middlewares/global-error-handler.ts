import type { NextFunction, Request, Response } from 'express';

import { isAppError, sanitizeForClient } from '@/core/errors/utils';
import { logger } from '@/core/logger';
import { error } from '@/core/response';

/**
 * Global error handler. Must be registered last (after all routes).
 * - Logs every error with full traceability (requestId, stack, context)
 * - Sends sanitized response to clients (no sensitive data in production)
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = res.locals?.requestId as string | undefined;

  const trace = {
    requestId,
    path: req.path,
    method: req.method,
    statusCode: isAppError(err) ? err.statusCode : 500,
    errorCode: isAppError(err) ? err.errorCode : 'INTERNAL_ERROR',
  };

  if (isAppError(err) && err.statusCode < 500) {
    logger.warn({ ...trace, err }, err.message);
  } else {
    logger.error(
      { ...trace, err, stack: err instanceof Error ? err.stack : undefined },
      err instanceof Error ? err.message : 'Unknown error',
    );
  }

  const payload = sanitizeForClient(err, requestId);

  if (!res.headersSent) {
    error(res, payload);
  }
}
