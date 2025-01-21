import { assert, describe, expect, it } from 'vitest';

import { nameSchema } from '~/.server/validation/name-schema';

describe('nameSchema', () => {
  it('should create a basic name schema', () => {
    const schema = nameSchema();

    let result = schema.safeParse('John Doe');
    assert(result.success);
    expect(result.data).toBe('John Doe');

    result = schema.safeParse(123);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Name must be a string.',
        path: [],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = nameSchema();

    const result = schema.safeParse('  John Doe  ');
    assert(result.success);
    expect(result.data).toBe('John Doe');
  });

  it('should validate maxLength', () => {
    const schema = nameSchema({ maxLength: 5 });

    let result = schema.safeParse('John');
    assert(result.success);
    expect(result.data).toBe('John');

    result = schema.safeParse('John Doe');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 5,
        message: 'Name must contain at most 5 characters.',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should validate format (non-digit)', () => {
    const schema = nameSchema();

    let result = schema.safeParse('John Doe');
    assert(result.success);
    expect(result.data).toBe('John Doe');

    result = schema.safeParse('John Doe 123');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Name must not contain any digits.',
        path: [],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = nameSchema({
      errorMessages: {
        required_error: 'Custom required message',
        invalid_type_error: 'Custom type message',
        max_length_error: 'Custom max length message',
        format_error: 'Custom format message',
      },
      maxLength: 5,
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

    result = schema.safeParse('');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Custom required message',
        minimum: 1,
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

    result = schema.safeParse('John Doe');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 5,
        message: 'Custom max length message',
        path: [],
        type: 'string',
      },
    ]);

    result = schema.safeParse('John1');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: [],
        validation: 'regex',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 5;
    const schema = nameSchema({ maxLength });

    const result = schema.safeParse('abcdef');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `Name must contain at most ${maxLength} characters.`,
        path: [],
        type: 'string',
      },
    ]);
  });
});
