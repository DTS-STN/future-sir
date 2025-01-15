import { assert, describe, expect, it } from 'vitest';

import { firstNameSchema } from '~/.server/validation/first-name-schema';

describe('firstNameSchema', () => {
  it('should create a basic first name schema', () => {
    const schema = firstNameSchema();

    let result = schema.safeParse('John');
    assert(result.success);
    expect(result.data).toBe('John');

    result = schema.safeParse(123);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'First name must be a string.',
        path: [],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = firstNameSchema();

    const result = schema.safeParse('  John  ');
    assert(result.success);
    expect(result.data).toBe('John');
  });

  it('should validate maxLength', () => {
    const schema = firstNameSchema({ maxLength: 3 });

    let result = schema.safeParse('Joe');
    assert(result.success);
    expect(result.data).toBe('Joe');

    result = schema.safeParse('John');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'First name must contain at most 3 characters.',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should validate format (non-digit)', () => {
    const schema = firstNameSchema();

    let result = schema.safeParse('John');
    assert(result.success);
    expect(result.data).toBe('John');

    result = schema.safeParse('John1');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'First name must not contain any digits.',
        path: [],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = firstNameSchema({
      errorMessages: {
        required_error: 'Custom required message',
        invalid_type_error: 'Custom type message',
        max_length_error: 'Custom max length message',
        format_error: 'Custom format message',
      },
      maxLength: 3,
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

    result = schema.safeParse('John');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'Custom max length message',
        path: [],
        type: 'string',
      },
    ]);

    result = schema.safeParse('Jo1');
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
    const maxLength = 3;
    const schema = firstNameSchema({ maxLength });

    const result = schema.safeParse('John');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `First name must contain at most ${maxLength} characters.`,
        path: [],
        type: 'string',
      },
    ]);
  });
});
