import type { ErrorCode } from '~/errors/error-codes';
import { ErrorCodes } from '~/errors/error-codes';
import { randomString } from '~/utils/string-utils';

export type CodedErrorProps = {
  readonly code: string;
  readonly correlationId: string;
  readonly message?: string;
};

/**
 * A generic, top-level error that all application errors should extend.
 * This class *does not* extend Error because React Router will sanitize all Errors when sending them to the client.
 */
export class CodedError {
  public readonly name = 'CodedError';

  public readonly code: ErrorCode;
  public readonly correlationId: string;
  public readonly stack?: string;

  // note: this is intentionally named `msg` instead
  // of `message` to workaround an issue with winston
  // always logging this as the log message when a
  // message is supplied to `log.error(message, error)`
  public readonly msg?: string;

  public constructor(msg?: string, code: ErrorCode = ErrorCodes.UNCAUGHT_ERROR, correlationId = generateCorrelationId()) {
    this.code = code;
    this.correlationId = correlationId;
    this.msg = msg;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Type guard to check if an error is a CodedError.
 *
 * Note: this function does not use `instanceof` because the type
 *       information is lost when shipped to the client
 */
export function isCodedError(error: unknown): error is CodedError {
  return error instanceof Object && 'name' in error && error.name === 'CodedError';
}

/**
 * Generates a random correlation ID.
 */
function generateCorrelationId() {
  const prefix = randomString(2).toUpperCase();
  const suffix = randomString(6).toUpperCase();
  return `${prefix}-${suffix}`;
}
