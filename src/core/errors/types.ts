/**
 * HTTP status codes and error codes for type-safe error handling.
 * Use these when throwing to ensure consistent API responses.
 */
export const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Client-safe error payload sent in API responses */
export interface SanitizedErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  requestId?: string;
  /** Field-level validation errors (e.g. Zod output) */
  details?: Record<string, unknown>;
  /** Stack trace – only in development */
  stack?: string;
}
