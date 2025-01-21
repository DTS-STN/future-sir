import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { lastNameSchema } from '~/.server/validation/last-name-schema';

describe('lastNameSchema', () => {
  it('should create a basic last name schema', () => {
    const schema = z.object({ lastName: lastNameSchema() });

    let result = schema.safeParse({ lastName: 'Smith' });
    assert(result.success);
    expect(result.data.lastName).toBe('Smith');

    result = schema.safeParse({ lastName: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Last name must be a string.',
        path: ['lastName'],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = z.object({ lastName: lastNameSchema() });

    const result = schema.safeParse({ lastName: '  Smith  ' });
    assert(result.success);
    expect(result.data.lastName).toBe('Smith');
  });

  it('should validate maxLength', () => {
    const schema = z.object({ lastName: lastNameSchema({ maxLength: 3 }) });

    let result = schema.safeParse({ lastName: 'Doe' });
    assert(result.success);
    expect(result.data.lastName).toBe('Doe');

    result = schema.safeParse({ lastName: 'Smith' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'Last name must contain at most 3 characters.',
        path: ['lastName'],
        type: 'string',
      },
    ]);
  });

  it('should validate format (non-digit)', () => {
    const schema = z.object({ lastName: lastNameSchema() });

    let result = schema.safeParse({ lastName: 'Smith' });
    assert(result.success);
    expect(result.data.lastName).toBe('Smith');

    result = schema.safeParse({ lastName: 'Smith1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Last name must not contain any digits.',
        path: ['lastName'],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = z.object({
      lastName: lastNameSchema({
        errorMessages: {
          required_error: 'Custom required message',
          invalid_type_error: 'Custom type message',
          max_length_error: 'Custom max length message',
          format_error: 'Custom format message',
        },
        maxLength: 3,
      }),
    });

    let result = schema.safeParse({ lastName: undefined });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: ['lastName'],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse({ lastName: '' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Custom required message',
        minimum: 1,
        path: ['lastName'],
        type: 'string',
      },
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['lastName'],
        validation: 'regex',
      },
    ]);

    result = schema.safeParse({ lastName: null });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['lastName'],
        received: 'null',
      },
    ]);

    result = schema.safeParse({ lastName: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['lastName'],
        received: 'number',
      },
    ]);

    result = schema.safeParse({ lastName: 'Smith' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 3,
        message: 'Custom max length message',
        path: ['lastName'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ lastName: 'Do3' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['lastName'],
        validation: 'regex',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 3;
    const schema = z.object({ lastName: lastNameSchema({ maxLength }) });

    const result = schema.safeParse({ lastName: 'Smith' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `Last name must contain at most ${maxLength} characters.`,
        path: ['lastName'],
        type: 'string',
      },
    ]);
  });

  it('should allow the lastName field to be optional', () => {
    const schema = z.object({ lastName: lastNameSchema().optional() });

    let result = schema.safeParse({});
    assert(result.success);
    expect(result.data.lastName).toBeUndefined();

    result = schema.safeParse({ lastName: 'Smith' });
    assert(result.success);
    expect(result.data.lastName).toBe('Smith');
  });

  it('should allow the lastName field to be nullable', () => {
    const schema = z.object({ lastName: lastNameSchema().nullable() });

    let result = schema.safeParse({ lastName: null });
    assert(result.success);
    expect(result.data.lastName).toBeNull();

    result = schema.safeParse({ lastName: 'Smith' });
    assert(result.success);
    expect(result.data.lastName).toBe('Smith');
  });
});
