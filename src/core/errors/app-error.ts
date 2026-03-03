import type { ErrorCodeValue, HttpStatusCode } from './types';

import { env } from '@/config/env';

/**
 * Base error class for the application. All domain errors should extend this.
 * Provides traceability (requestId, timestamp) and sanitization for client responses.
 */
export class AppError extends Error {
  readonly statusCode: HttpStatusCode;
  readonly errorCode: ErrorCodeValue;
  readonly requestId?: string;
  readonly timestamp: string;
  readonly details?: Record<string, unknown>;

  constructor(options: {
    message: string;
    statusCode: HttpStatusCode;
    errorCode: ErrorCodeValue;
    requestId?: string;
    details?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(options.message, { cause: options.cause });
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.requestId = options.requestId;
    this.timestamp = new Date().toISOString();
    this.details = options.details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  /** Serialize for client response – never exposes stack in production */
  toJSON() {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      requestId: this.requestId,
      details: this.details,
      stack: env.NODE_ENV !== 'production' ? this.stack : undefined,
    };
  }
}
