import type { Span, Tracer } from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import * as InstrumentationUtils from '~/.server/utils/instrumentation-utils';
import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';

vi.mock('@opentelemetry/api');

describe('InstrumentationUtils', () => {
  describe('handleSpanException', () => {
    it('should record a CodedError in the span', () => {
      const mockSpan = mock<Span>();
      const error = new CodedError('test error message', ErrorCodes.TEST_ERROR_CODE);

      InstrumentationUtils.handleSpanException(error, mockSpan);

      expect(mockSpan.recordException).toHaveBeenCalledWith({
        name: error.name,
        message: error.msg,
        code: error.errorCode,
        stack: error.stack,
      });

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.msg,
      });
    });

    it('should record a regular error in the span', () => {
      const mockSpan = mock<Span>();
      const error = new Error('regular error');

      InstrumentationUtils.handleSpanException(error, mockSpan);

      expect(mockSpan.recordException).toHaveBeenCalledWith({
        name: error.name,
        message: error.message,
        code: undefined,
        stack: error.stack,
      });

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    });

    it('should not record a Response error in the span', () => {
      const mockSpan = mock<Span>();
      const error = new Response(null, { status: 500 });

      InstrumentationUtils.handleSpanException(error, mockSpan);

      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
    });

    it('should return the original error', () => {
      const mockSpan = mock<Span>();
      const error = new CodedError('Something went wrong');

      const returnedError = InstrumentationUtils.handleSpanException(error, mockSpan);

      expect(returnedError).toEqual(error);
    });
  });

  describe('withSpan', () => {
    it('should create and end a span', async () => {
      const mockSpan = mock<Span>();
      const mockTracer = mock<Tracer>({ startSpan: vi.fn().mockReturnValue(mockSpan) });
      vi.mocked(trace.getTracer).mockReturnValue(mockTracer);

      await InstrumentationUtils.withSpan('test span', () => {});

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test span');
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should execute the given function', async () => {
      const mockSpan = mock<Span>();
      const mockTracer = mock<Tracer>({ startSpan: vi.fn().mockReturnValue(mockSpan) });
      vi.mocked(trace.getTracer).mockReturnValue(mockTracer);
      const mockFn = vi.fn().mockResolvedValue('test');

      const result = await InstrumentationUtils.withSpan('test span', mockFn);

      expect(mockFn).toHaveBeenCalledWith(mockSpan);
      expect(result).toEqual('test');
    });

    it('handles exceptions correctly', async () => {
      const mockSpan = mock<Span>();

      const mockTracer = mock<Tracer>({
        startSpan: vi.fn().mockReturnValue(mockSpan),
      });

      vi.mocked(trace.getTracer).mockReturnValue(mockTracer);

      const error = new Error('test error');
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(InstrumentationUtils.withSpan('test span', mockFn)).rejects.toThrow(error);

      expect(mockSpan.recordException).toHaveBeenCalledWith({
        name: error.name,
        message: error.message,
        code: undefined,
        stack: error.stack,
      });

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      expect(mockSpan.end).toHaveBeenCalled();
    });
  });
});
