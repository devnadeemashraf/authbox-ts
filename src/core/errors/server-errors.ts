import { AppError } from './app-error';
import { ErrorCode, HttpStatus } from './types';

type ServerErrorOptions = {
  message: string;
  requestId?: string;
  cause?: Error;
};

/**
 * 500 – Internal server error. Use for unexpected failures.
 * Message is sanitized in production (generic "Internal server error").
 */
export class InternalError extends AppError {
  constructor(options: ServerErrorOptions) {
    super({
      ...options,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_ERROR,
    });
  }
}
