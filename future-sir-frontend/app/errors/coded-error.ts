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

  public readonly code: string;
  public readonly correlationId: string;
  public readonly message?: string;

  public constructor({ code = 'UNC-0000', correlationId = crypto.randomUUID(), message }: Partial<CodedErrorProps> = {}) {
    this.code = code;
    this.correlationId = correlationId;
    this.message = message;

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
