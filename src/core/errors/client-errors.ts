import { AppError } from './app-error';
import { ErrorCode, HttpStatus } from './types';

type ClientErrorOptions = {
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
  cause?: Error;
};

/**
 * 400 – Client sent invalid or malformed request
 */
export class BadRequestError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.BAD_REQUEST,
    });
  }
}

/**
 * 401 – Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: ErrorCode.UNAUTHORIZED,
    });
  }
}

/**
 * 403 – Authenticated but not authorized for this action
 */
export class ForbiddenError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: ErrorCode.FORBIDDEN,
    });
  }
}

/**
 * 404 – Resource not found. Domain errors (e.g. UserNotFoundError) extend this.
 */
export class NotFoundError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: ErrorCode.NOT_FOUND,
    });
  }
}

/**
 * 409 – Conflict (e.g. duplicate email, version mismatch)
 */
export class ConflictError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.CONFLICT,
      errorCode: ErrorCode.CONFLICT,
    });
  }
}

/**
 * 422 – Validation failed (schema, business rules)
 */
export class ValidationError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: ErrorCode.VALIDATION_FAILED,
    });
  }
}

/**
 * 503 – Service temporarily unavailable (e.g. file uploads disabled)
 */
export class ServiceUnavailableError extends AppError {
  constructor(options: ClientErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      errorCode: ErrorCode.SERVICE_UNAVAILABLE,
    });
  }
}
