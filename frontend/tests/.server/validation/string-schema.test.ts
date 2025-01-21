import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { stringSchema } from '~/.server/validation';

describe('stringSchema', () => {
  it('should create a basic string schema', () => {
    const schema = z.object({ field: stringSchema() });

    let result = schema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');

    result = schema.safeParse({ field: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Expected string, received 123',
        path: ['field'],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = z.object({ field: stringSchema() });

    const result = schema.safeParse({ field: '  test  ' });
    assert(result.success);
    expect(result.data.field).toBe('test');
  });

  it('should not trim whitespace if trim is false', () => {
    const schema = z.object({ field: stringSchema({ trim: false }) });

    const result = schema.safeParse({ field: '  test  ' });
    assert(result.success);
    expect(result.data.field).toBe('  test  ');
  });

  it('should validate minLength', () => {
    const schema = z.object({ field: stringSchema({ minLength: 3 }) });

    let result = schema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');

    result = schema.safeParse({ field: 'te' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: 3,
        message: 'String must contain at least 3 characters',
        path: ['field'],
        type: 'string',
      },
    ]);
  });

  it('should validate maxLength', () => {
    const schema = z.object({ field: stringSchema({ maxLength: 3 }) });

    let result = schema.safeParse({ field: 'tes' });
    assert(result.success);
    expect(result.data.field).toBe('tes');

    result = schema.safeParse({ field: 'test' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'String must contain at most 3 characters',
        path: ['field'],
        type: 'string',
      },
    ]);
  });

  it('should validate format with predefined patterns', () => {
    const digitOnlySchema = z.object({ field: stringSchema({ format: 'digit-only' }) });

    let result = digitOnlySchema.safeParse({ field: '123' });
    assert(result.success);
    expect(result.data.field).toBe('123');

    result = digitOnlySchema.safeParse({ field: 'test' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: ['field'],
        validation: 'regex',
      },
    ]);

    const nonDigitSchema = z.object({ field: stringSchema({ format: 'non-digit' }) });

    result = nonDigitSchema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');

    result = nonDigitSchema.safeParse({ field: '123' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: ['field'],
        validation: 'regex',
      },
    ]);

    const alphaOnlySchema = z.object({ field: stringSchema({ format: 'alpha-only' }) });

    result = alphaOnlySchema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');

    result = alphaOnlySchema.safeParse({ field: 'test1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: ['field'],
        validation: 'regex',
      },
    ]);

    const alphanumericSchema = z.object({ field: stringSchema({ format: 'alphanumeric' }) });

    result = alphanumericSchema.safeParse({ field: 'test1' });
    assert(result.success);
    expect(result.data.field).toBe('test1');

    result = alphanumericSchema.safeParse({ field: 'test!' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: ['field'],
        validation: 'regex',
      },
    ]);
  });

  it('should validate format with custom regex', () => {
    const schema = z.object({ field: stringSchema({ format: /^[a-z]+$/ }) });

    let result = schema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');

    result = schema.safeParse({ field: 'TEST' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Invalid format',
        path: ['field'],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = z.object({
      field: stringSchema({
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
      }),
    });

    let result = schema.safeParse({ field: undefined });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: ['field'],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse({ field: null });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['field'],
        received: 'null',
      },
    ]);

    result = schema.safeParse({ field: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['field'],
        received: 'number',
      },
    ]);

    result = schema.safeParse({ field: 'test1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 4,
        message: 'Custom max length message',
        path: ['field'],
        type: 'string',
      },
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['field'],
        validation: 'regex',
      },
    ]);

    result = schema.safeParse({ field: 't' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: 2,
        message: 'Custom min length message',
        path: ['field'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ field: 'tests' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 4,
        message: 'Custom max length message',
        path: ['field'],
        type: 'string',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const minLength = 2;
    const maxLength = 5;
    const schema = z.object({ field: stringSchema({ minLength, maxLength }) });

    let result = schema.safeParse({ field: 'a' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        minimum: minLength,
        message: `String must contain at least ${minLength} characters`,
        path: ['field'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ field: 'abcdef' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `String must contain at most ${maxLength} characters`,
        path: ['field'],
        type: 'string',
      },
    ]);
  });

  it('should allow the field to be optional', () => {
    const schema = z.object({ field: stringSchema().optional() });

    let result = schema.safeParse({});
    assert(result.success);
    expect(result.data.field).toBeUndefined();

    result = schema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');
  });

  it('should allow the field to be nullable', () => {
    const schema = z.object({ field: stringSchema().nullable() });

    let result = schema.safeParse({ field: null });
    assert(result.success);
    expect(result.data.field).toBeNull();

    result = schema.safeParse({ field: 'test' });
    assert(result.success);
    expect(result.data.field).toBe('test');
  });
});
