import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { emailAddressSchema } from '~/.server/validation/email-address-schema';

describe('emailAddressSchema', () => {
  it('should create a basic email address schema', () => {
    const schema = z.object({ emailAddress: emailAddressSchema() });

    let result = schema.safeParse({ emailAddress: 'test@example.com' });
    assert(result.success);
    expect(result.data).toStrictEqual({ emailAddress: 'test@example.com' });

    result = schema.safeParse({ emailAddress: 'test' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: ['emailAddress'],
      },
    ]);

    result = schema.safeParse({ emailAddress: '123' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: ['emailAddress'],
      },
    ]);
  });

  it('should trim whitespace by default', () => {
    const schema = z.object({ emailAddress: emailAddressSchema() });

    const result = schema.safeParse({ emailAddress: '  test@example.com  ' });
    assert(result.success);
    expect(result.data).toStrictEqual({ emailAddress: 'test@example.com' });
  });

  it('should validate maxLength', () => {
    const schema = z.object({ emailAddress: emailAddressSchema({ maxLength: 14 }) });

    let result = schema.safeParse({ emailAddress: 'test@test.com' }); // Short, valid email
    assert(result.success);
    expect(result.data).toStrictEqual({ emailAddress: 'test@test.com' });

    result = schema.safeParse({ emailAddress: 'test@example.com' }); // Normal length, will be trimmed and fail
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 14,
        message: 'Email address must be less than or equal to 14 characters.',
        path: ['emailAddress'],
        type: 'string',
      },
    ]);
  });

  it('should validate format (valid email)', () => {
    const schema = z.object({ emailAddress: emailAddressSchema() });

    let result = schema.safeParse({ emailAddress: 'test@example.com' });
    assert(result.success);
    expect(result.data).toStrictEqual({ emailAddress: 'test@example.com' });

    result = schema.safeParse({ emailAddress: 'test' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: ['emailAddress'],
      },
    ]);
  });

  it('should validate against a maximum of 254 characters, even if maxLength is higher', () => {
    const longEmail = 'a'.repeat(64) + '@' + generateDomainName(189); // 254 characters
    const tooLongEmail = 'b'.repeat(64) + '@' + generateDomainName(190); // 255 characters

    const schema = z.object({ emailAddress: emailAddressSchema({ maxLength: 300 }) });

    let result = schema.safeParse({ emailAddress: longEmail });
    assert(result.success);
    expect(result.data).toStrictEqual({ emailAddress: longEmail });

    result = schema.safeParse({ emailAddress: tooLongEmail });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 254,
        message: 'Email address must be less than or equal to 254 characters.',
        path: ['emailAddress'],
        type: 'string',
      },
      {
        code: 'custom',
        fatal: true,
        message: 'Email address format is invalid.',
        path: ['emailAddress'],
      },
    ]);
  });

  it('should use custom error messages', () => {
    const schema = z.object({
      emailAddress: emailAddressSchema({
        errorMessages: {
          required_error: 'Custom required message',
          invalid_type_error: 'Custom type message',
          max_length_error: 'Custom max length message',
          format_error: 'Custom format message',
        },
        maxLength: 10,
      }),
    });

    let result = schema.safeParse({});
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom required message',
        path: ['emailAddress'],
        received: 'undefined',
      },
    ]);

    result = schema.safeParse({ emailAddress: '' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Custom required message',
        minimum: 1,
        path: ['emailAddress'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ emailAddress: null });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['emailAddress'],
        received: 'null',
      },
    ]);

    result = schema.safeParse({ emailAddress: 123 });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Custom type message',
        path: ['emailAddress'],
        received: 'number',
      },
    ]);

    result = schema.safeParse({ emailAddress: 'test@example.com' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 10,
        message: 'Custom max length message',
        path: ['emailAddress'],
        type: 'string',
      },
    ]);

    result = schema.safeParse({ emailAddress: 'test' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Custom format message',
        path: ['emailAddress'],
      },
    ]);
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 10;
    const schema = z.object({ emailAddress: emailAddressSchema({ maxLength }) });

    const result = schema.safeParse({ emailAddress: 'test@example.com' });
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: maxLength,
        message: `Email address must be less than or equal to ${maxLength} characters.`,
        path: ['emailAddress'],
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
