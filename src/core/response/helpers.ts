import type { Response } from 'express';

import { SuccessStatus } from './types';

import type { SanitizedErrorResponse } from '@/core/errors/types';
import { HttpStatus } from '@/core/errors/types';

/**
 * 200 OK – Service returned data successfully
 */
export function ok<T>(res: Response, data: T): Response {
  return res.status(SuccessStatus.OK).json({ success: true, data });
}

/**
 * 201 Created – Resource created (e.g. POST register, create)
 */
export function created<T>(res: Response, data: T): Response {
  return res.status(SuccessStatus.CREATED).json({ success: true, data });
}

/**
 * 204 No Content – Success with no body (e.g. DELETE, some updates)
 */
export function noContent(res: Response): Response {
  return res.status(SuccessStatus.NO_CONTENT).send();
}

/**
 * 200 OK with meta – Paginated or augmented responses
 */
export function okWithMeta<T, M extends Record<string, unknown>>(
  res: Response,
  data: T,
  meta: M,
): Response {
  return res.status(SuccessStatus.OK).json({ success: true, data, meta });
}

/**
 * 404 Not Found – No matching route. Use for catch-all.
 */
export function notFound(res: Response, requestId?: string): Response {
  return res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    error: {
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'NOT_FOUND',
      message: 'Not Found',
      requestId,
    },
  });
}

/**
 * Send error response – used by global error handler for consistent envelope.
 */
export function error(res: Response, payload: SanitizedErrorResponse): Response {
  return res.status(payload.statusCode).json({ success: false, error: payload });
}
