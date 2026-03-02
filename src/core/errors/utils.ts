import { AppError } from './app-error';
import type { SanitizedErrorResponse } from './types';

const GENERIC_INTERNAL_MESSAGE = 'Internal server error';

/**
 * Checks if the value is an AppError instance.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Builds a sanitized response for clients. Never exposes sensitive data.
 * - AppError: uses toJSON (stack only in dev)
 * - 5xx in production: generic message
 * - Unknown errors: generic message, full details logged server-side
 */
export function sanitizeForClient(error: unknown, requestId?: string): SanitizedErrorResponse {
  if (isAppError(error)) {
    const json = error.toJSON();
    return {
      statusCode: json.statusCode,
      errorCode: json.errorCode,
      message:
        json.statusCode >= 500 && process.env.NODE_ENV === 'production'
          ? GENERIC_INTERNAL_MESSAGE
          : json.message,
      requestId: requestId ?? json.requestId,
      details: json.details,
      stack: json.stack,
    };
  }

  return {
    statusCode: 500,
    errorCode: 'INTERNAL_ERROR',
    message: GENERIC_INTERNAL_MESSAGE,
    requestId,
    stack:
      process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
  };
}
