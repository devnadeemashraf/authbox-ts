import crypto from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attaches a requestId to every request for traceability.
 * Uses x-request-id from client if present, otherwise generates a UUID.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers[REQUEST_ID_HEADER] as string) || crypto.randomUUID();
  res.locals.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
