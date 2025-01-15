import { assert, describe, expect, it } from 'vitest';

import { stringSchema } from '~/.server/validation';

describe('stringSchema', () => {
  it('should create a basic string schema', () => {
    const schema = stringSchema();

    let result = schema.safeParse('test');
    assert(result.success);
    expect(result.data).toBe('test');

    result = schema.safeParse(123);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Expected string, received 123',
        path: [],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = stringSchema();

    const result = schema.safeParse('  test  ');
    assert(result.success);
    expect(result.data).toBe('test');
  });

  it('should not trim whitespace if trim is false', () => {
    const schema = stringSchema({ trim: false });

    const result = schema.safeParse('  test  ');
    assert(result.success);
    expect(result.data).toBe('  test  ');
  });

  it('should validate minLength', () => {
    const schema = stringSchema({ minLength: 3 });

    let result = schema.safeParse('test');
    assert(result.success);
    expect(result.data).toBe('test');

    result = schema.safeParse('te');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: 3,
        message: 'String must contain at least 3 characters',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should validate maxLength', () => {
    const schema = stringSchema({ maxLength: 3 });

    let result = schema.safeParse('tes');
    assert(result.success);
    expect(result.data).toBe('tes');

    result = schema.safeParse('test');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'String must contain at most 3 characters',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should validate format with predefined patterns', () => {
    const digitOnlySchema = stringSchema({ format: 'digit-only' });

    let result = digitOnlySchema.safeParse('123');
    assert(result.success);
    expect(result.data).toBe('123');

    result = digitOnlySchema.safeParse('test');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: [],
        validation: 'regex',
      },
    ]);

    const nonDigitSchema = stringSchema({ format: 'non-digit' });

    result = nonDigitSchema.safeParse('test');
    assert(result.success);
    expect(result.data).toBe('test');

    result = nonDigitSchema.safeParse('123');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: [],
        validation: 'regex',
      },
    ]);

    const alphaOnlySchema = stringSchema({ format: 'alpha-only' });

    result = alphaOnlySchema.safeParse('test');
    assert(result.success);
    expect(result.data).toBe('test');

    result = alphaOnlySchema.safeParse('test1');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: [],
        validation: 'regex',
      },
    ]);

    const alphanumericSchema = stringSchema({ format: 'alphanumeric' });

    result = alphanumericSchema.safeParse('test1');
    assert(result.success);
    expect(result.data).toBe('test1');

    result = alphanumericSchema.safeParse('test!');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: [],
        validation: 'regex',
      },
    ]);
  });

  it('should validate format with custom regex', () => {
    const schema = stringSchema({ format: /^[a-z]+$/ });

    let result = schema.safeParse('test');
    assert(result.success);
    expect(result.data).toBe('test');

    result = schema.safeParse('TEST');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: [],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = stringSchema({
      errorMessages: {
        required_error: 'Custom required message',
        invalid_type_error: 'Custom type message',
        max_length_error: 'Custom max length message',
        min_length_error: 'Custom min length message',
        format_error: 'Custom format message',
      },
      minLength: 2,
      maxLength: 4,
      format: 'alpha-only',
    });

    let result = schema.safeParse(undefined);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: [],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse(null);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: [],
        received: 'null',
      },
    ]);

    result = schema.safeParse(123);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: [],
        received: 'number',
      },
    ]);

    result = schema.safeParse('test1');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 4,
        message: 'Custom max length message',
        path: [],
        type: 'string',
      },
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: [],
        validation: 'regex',
      },
    ]);

    result = schema.safeParse('t');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: 2,
        message: 'Custom min length message',
        path: [],
        type: 'string',
      },
    ]);

    result = schema.safeParse('tests');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 4,
        message: 'Custom max length message',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const minLength = 2;
    const maxLength = 5;
    const schema = stringSchema({ minLength, maxLength });

    let result = schema.safeParse('a');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: minLength,
        message: `String must contain at least ${minLength} characters`,
        path: [],
        type: 'string',
      },
    ]);

    result = schema.safeParse('abcdef');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `String must contain at most ${maxLength} characters`,
        path: [],
        type: 'string',
      },
    ]);
  });
});
