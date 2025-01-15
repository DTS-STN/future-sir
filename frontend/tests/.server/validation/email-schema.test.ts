import { assert, describe, expect, it } from 'vitest';

import { emailAddressSchema } from '~/.server/validation/email-address-schema';

describe('emailAddressSchema', () => {
  it('should create a basic email address schema', () => {
    const schema = emailAddressSchema();

    let result = schema.safeParse('test@example.com');
    assert(result.success);
    expect(result.data).toBe('test@example.com');

    result = schema.safeParse('test');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: [],
      },
    ]);

    result = schema.safeParse('123');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: [],
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = emailAddressSchema();

    const result = schema.safeParse('  test@example.com  ');
    assert(result.success);
    expect(result.data).toBe('test@example.com');
  });

  it('should validate maxLength', () => {
    const schema = emailAddressSchema({ maxLength: 14 });

    let result = schema.safeParse('test@test.com'); // Short, valid email
    assert(result.success);
    expect(result.data).toBe('test@test.com');

    result = schema.safeParse('test@example.com'); // Normal length, will be trimmed and fail
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 14,
        message: 'Email address must be less than or equal to 14 characters.',
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should validate format (valid email)', () => {
    const schema = emailAddressSchema();

    let result = schema.safeParse('test@example.com');
    assert(result.success);
    expect(result.data).toBe('test@example.com');

    result = schema.safeParse('test');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: [],
      },
    ]);
  });

  it('should validate against a maximum of 254 characters, even if maxLength is higher', () => {
    const longEmail = 'a'.repeat(64) + '@' + generateDomainName(189); // 254 characters
    const tooLongEmail = 'b'.repeat(64) + '@' + generateDomainName(190); // 255 characters

    const schema = emailAddressSchema({ maxLength: 300 });

    let result = schema.safeParse(longEmail);
    assert(result.success);
    expect(result.data).toBe(longEmail);

    result = schema.safeParse(tooLongEmail);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 254,
        message: 'Email address must be less than or equal to 254 characters.',
        path: [],
        type: 'string',
      },
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: [],
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = emailAddressSchema({
      errorMessages: {
        required_error: 'Custom required message',
        invalid_type_error: 'Custom type message',
        max_length_error: 'Custom max length message',
        format_error: 'Custom format message',
      },
      maxLength: 10,
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

    result = schema.safeParse('test@example.com');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 10,
        message: 'Custom max length message',
        path: [],
        type: 'string',
      },
    ]);

    result = schema.safeParse('test');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Custom format message',
        path: [],
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 10;
    const schema = emailAddressSchema({ maxLength });

    const result = schema.safeParse('test@example.com');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `Email address must be less than or equal to ${maxLength} characters.`,
        path: [],
        type: 'string',
      },
    ]);
  });

  function generateDomainName(maxLength: number) {
    const getRandomPart = () => Math.random().toString(36).substring(2, 7);
    let domain = '';

    while (domain.length + 4 < maxLength) {
      // Leave space for ".com"
      domain += (domain ? '.' : '') + getRandomPart();
    }

    // Trim to ensure the domain name is exactly maxLength including ".com"
    return domain.substring(0, maxLength - 4) + '.com';
  }
});
