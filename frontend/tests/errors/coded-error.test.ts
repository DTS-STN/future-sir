import { describe, expect, it, vi } from 'vitest';

import { CodedError, isCodedError } from '~/errors/coded-error';
import { randomString } from '~/utils/string-utils';

vi.mock('~/utils/string-utils');

describe('CodedError', () => {
  it('should create a CodedError with default values', () => {
    vi.mocked(randomString).mockReturnValueOnce('AB');
    vi.mocked(randomString).mockReturnValueOnce('123456');

    const error = new CodedError();
    expect(error.code).toEqual('UNC-0000');
    expect(error.correlationId).toEqual('AB-123456');
    expect(error.msg).toBeUndefined();
    expect(error.stack).toBeDefined();
  });

  it('should create a CodedError with custom values', () => {
    const message = 'Something went wrong';
    const code = 'CUS-0001';
    const correlationId = 'ABC-123456';

    const error = new CodedError(message, code, correlationId);

    expect(error.code).toEqual(code);
    expect(error.correlationId).toEqual(correlationId);
    expect(error.msg).toEqual(message);
    expect(error.stack).toBeDefined();
  });
});

describe('isCodedError', () => {
  it('should return true for a CodedError', () => {
    vi.mocked(randomString).mockReturnValueOnce('AB');
    vi.mocked(randomString).mockReturnValueOnce('123456');

    expect(isCodedError(new CodedError())).toEqual(true);
  });

  it('should return false for a regular Error', () => {
    expect(isCodedError(new Error())).toEqual(false);
  });

  it('should return false for a non-object', () => {
    expect(isCodedError(null)).toEqual(false);
    expect(isCodedError(undefined)).toEqual(false);
    expect(isCodedError('string')).toEqual(false);
    expect(isCodedError(123)).toEqual(false);
  });

  it('should return false for an object without a name property', () => {
    expect(isCodedError({})).toEqual(false);
  });

  it('should return false for an object with a different name property', () => {
    expect(isCodedError({ name: 'OtherError' })).toEqual(false);
  });
});
