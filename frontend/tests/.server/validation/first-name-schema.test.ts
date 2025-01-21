import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { firstNameSchema } from '~/.server/validation/first-name-schema';

describe('firstNameSchema', () => {
  it('should create a basic first name schema', () => {
    const schema = z.object({ firstName: firstNameSchema() });

    let result = schema.safeParse({ firstName: 'John' });
    assert(result.success);
    expect(result.data.firstName).toBe('John');

    result = schema.safeParse({ firstName: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'First name must be a string.',
        path: ['firstName'],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = z.object({ firstName: firstNameSchema() });

    const result = schema.safeParse({ firstName: '  John  ' });
    assert(result.success);
    expect(result.data.firstName).toBe('John');
  });

  it('should validate maxLength', () => {
    const schema = z.object({ firstName: firstNameSchema({ maxLength: 3 }) });

    let result = schema.safeParse({ firstName: 'Joe' });
    assert(result.success);
    expect(result.data.firstName).toBe('Joe');

    result = schema.safeParse({ firstName: 'John' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'First name must contain at most 3 characters.',
        path: ['firstName'],
        type: 'string',
      },
    ]);
  });

  it('should validate format (non-digit)', () => {
    const schema = z.object({ firstName: firstNameSchema() });

    let result = schema.safeParse({ firstName: 'John' });
    assert(result.success);
    expect(result.data.firstName).toBe('John');

    result = schema.safeParse({ firstName: 'John1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'First name must not contain any digits.',
        path: ['firstName'],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = z.object({
      firstName: firstNameSchema({
        errorMessages: {
          required_error: 'Custom required message',
          invalid_type_error: 'Custom type message',
          max_length_error: 'Custom max length message',
          format_error: 'Custom format message',
        },
        maxLength: 3,
      }),
    });

    let result = schema.safeParse({ firstName: undefined });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: ['firstName'],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse({ firstName: '' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Custom required message',
        minimum: 1,
        path: ['firstName'],
        type: 'string',
      },
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['firstName'],
        validation: 'regex',
      },
    ]);

    result = schema.safeParse({ firstName: null });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['firstName'],
        received: 'null',
      },
    ]);

    result = schema.safeParse({ firstName: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['firstName'],
        received: 'number',
      },
    ]);

    result = schema.safeParse({ firstName: 'John' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'Custom max length message',
        path: ['firstName'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ firstName: 'Jo1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['firstName'],
        validation: 'regex',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 3;
    const schema = z.object({ firstName: firstNameSchema({ maxLength }) });

    const result = schema.safeParse({ firstName: 'John' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `First name must contain at most ${maxLength} characters.`,
        path: ['firstName'],
        type: 'string',
      },
    ]);
  });

  it('should allow the firstName field to be optional', () => {
    const schema = z.object({ firstName: firstNameSchema().optional() });

    let result = schema.safeParse({});
    assert(result.success);
    expect(result.data.firstName).toBeUndefined();

    result = schema.safeParse({ firstName: 'John' });
    assert(result.success);
    expect(result.data.firstName).toBe('John');
  });

  it('should allow the firstName field to be nullable', () => {
    const schema = z.object({ firstName: firstNameSchema().nullable() });

    let result = schema.safeParse({ firstName: null });
    assert(result.success);
    expect(result.data.firstName).toBeNull();

    result = schema.safeParse({ firstName: 'John' });
    assert(result.success);
    expect(result.data.firstName).toBe('John');
  });
});
