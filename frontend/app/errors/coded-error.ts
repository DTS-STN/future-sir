import type { ErrorCode } from '~/errors/error-codes';
import { ErrorCodes } from '~/errors/error-codes';
import { randomString } from '~/utils/string-utils';

// prettier-ignore
export type HttpStatusCode =
  | 100 | 101 | 102 | 103
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export type CodedErrorOpts = {
  correlationId?: string;
  statusCode?: HttpStatusCode;
};

/**
 * A generic, top-level error that all application errors should extend.
 * This class *does not* extend Error because React Router will sanitize all Errors when sending them to the client.
 */
export class CodedError {
  public readonly name = 'CodedError';

  public readonly errorCode: ErrorCode;
  public readonly correlationId: string;
  public readonly stack?: string;
  public readonly statusCode: HttpStatusCode;

  // note: this is intentionally named `msg` instead
  // of `message` to workaround an issue with winston
  // always logging this as the log message when a
  // message is supplied to `log.error(message, error)`
  public readonly msg: string;

  public constructor(msg: string, errorCode: ErrorCode = ErrorCodes.UNCAUGHT_ERROR, opts?: CodedErrorOpts) {
    this.errorCode = errorCode;
    this.msg = msg;

    this.correlationId = opts?.correlationId ?? generateCorrelationId();
    this.statusCode = opts?.statusCode ?? 500;

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
