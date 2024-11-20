import type { Span } from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';

import { isCodedError } from '~/errors/coded-error';

export const DEFAULT_TRACER_NAME = 'future-sir';

/**
 * Records an exception in the given span.
 * If the error is a coded error, it will include the code in the exception.
 *
 * @returns The original error.
 */
export function handleSpanException(error: unknown, span?: Span) {
  if (!isResponse(error)) {
    span?.setAttribute('correlationId', getCorrelationId(error) ?? 'N/A');

    span?.recordException({
      name: getName(error),
      message: getMessage(error),
      code: getCode(error),
      stack: getStack(error),
    });

    span?.setStatus({
      code: SpanStatusCode.ERROR,
      message: getMessage(error),
    });
  }

  return error;
}

/**
 * Wraps the given function in a span.
 * If an error occurs, it will be recorded in the span.
 * Route errors are excluded from span recording.
 */
export async function withSpan<T>(
  spanName: string,
  fn: (span: Span) => Promise<T> | T,
  tracerName = DEFAULT_TRACER_NAME,
): Promise<T> {
  const tracer = trace.getTracer(tracerName);
  const span = tracer.startSpan(spanName);

  try {
    return await fn(span);
  } catch (error) {
    throw handleSpanException(error, span);
  } finally {
    span.end();
  }
}

function getCode(error: unknown): string | undefined {
  if (isCodedError(error)) {
    return error.code;
  }
}

function getCorrelationId(error: unknown): string | undefined {
  if (isCodedError(error)) {
    return error.correlationId;
  }
}

function getMessage(error: unknown): string | undefined {
  if (isError(error)) {
    return error.message;
  }

  if (isCodedError(error)) {
    return error.msg;
  }
}

function getName(error: unknown): string {
  if (isError(error) || isCodedError(error)) {
    return error.name;
  }

  return String(error);
}

function getStack(error: unknown): string | undefined {
  if (isError(error) || isCodedError(error)) {
    return error.stack;
  }
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function isResponse(error: unknown): error is Response {
  return error instanceof Response;
}
