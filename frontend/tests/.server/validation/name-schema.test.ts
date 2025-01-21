import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { nameSchema } from '~/.server/validation/name-schema';

describe('nameSchema', () => {
  it('should create a basic name schema', () => {
    const schema = z.object({ name: nameSchema() });

    let result = schema.safeParse({ name: 'John Doe' });
    assert(result.success);
    expect(result.data.name).toBe('John Doe');

    result = schema.safeParse({ name: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Name must be a string.',
        path: ['name'],
        received: 'number',
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = z.object({ name: nameSchema() });

    const result = schema.safeParse({ name: '  John Doe  ' });
    assert(result.success);
    expect(result.data.name).toBe('John Doe');
  });

  it('should validate maxLength', () => {
    const schema = z.object({ name: nameSchema({ maxLength: 5 }) });

    let result = schema.safeParse({ name: 'John' });
    assert(result.success);
    expect(result.data.name).toBe('John');

    result = schema.safeParse({ name: 'John Doe' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 5,
        message: 'Name must contain at most 5 characters.',
        path: ['name'],
        type: 'string',
      },
    ]);
  });

  it('should validate format (non-digit)', () => {
    const schema = z.object({ name: nameSchema() });

    let result = schema.safeParse({ name: 'John Doe' });
    assert(result.success);
    expect(result.data.name).toBe('John Doe');

    result = schema.safeParse({ name: 'John Doe 123' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Name must not contain any digits.',
        path: ['name'],
        validation: 'regex',
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = z.object({
      name: nameSchema({
        errorMessages: {
          required_error: 'Custom required message',
          invalid_type_error: 'Custom type message',
          max_length_error: 'Custom max length message',
          format_error: 'Custom format message',
        },
        maxLength: 5,
      }),
    });

    let result = schema.safeParse({ name: undefined });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: ['name'],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse({ name: '' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Custom required message',
        minimum: 1,
        path: ['name'],
        type: 'string',
      },
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['name'],
        validation: 'regex',
      },
    ]);

    result = schema.safeParse({ name: null });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['name'],
        received: 'null',
      },
    ]);

    result = schema.safeParse({ name: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['name'],
        received: 'number',
      },
    ]);

    result = schema.safeParse({ name: 'John Doe' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 5,
        message: 'Custom max length message',
        path: ['name'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ name: 'John1' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_string',
        message: 'Custom format message',
        path: ['name'],
        validation: 'regex',
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 5;
    const schema = z.object({ name: nameSchema({ maxLength }) });

    const result = schema.safeParse({ name: 'abcdef' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `Name must contain at most ${maxLength} characters.`,
        path: ['name'],
        type: 'string',
      },
    ]);
  });

  it('should allow the name field to be optional', () => {
    const schema = z.object({ name: nameSchema().optional() });

    let result = schema.safeParse({});
    assert(result.success);
    expect(result.data.name).toBeUndefined();

    result = schema.safeParse({ name: 'John Doe' });
    assert(result.success);
    expect(result.data.name).toBe('John Doe');
  });

  it('should allow the name field to be nullable', () => {
    const schema = z.object({ name: nameSchema().nullable() });

    let result = schema.safeParse({ name: null });
    assert(result.success);
    expect(result.data.name).toBeNull();

    result = schema.safeParse({ name: 'John Doe' });
    assert(result.success);
    expect(result.data.name).toBe('John Doe');
  });
});
