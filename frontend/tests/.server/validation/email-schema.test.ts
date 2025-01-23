import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { emailAddressSchema } from '~/.server/validation/email-address-schema';

describe.each([
  [undefined], //
  ['en' as const],
  ['fr' as const],
])("emailAddressSchema with '%s' lang", (lang) => {
  it('should create a basic email address schema', () => {
    const schema = v.object({ emailAddress: emailAddressSchema() });

    let result = v.safeParse(schema, { emailAddress: 'test@example.com' }, { lang });
    assert(result.success);
    expect(result.output).toStrictEqual({ emailAddress: 'test@example.com' });

    result = v.safeParse(schema, { emailAddress: 'test' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [lang === 'fr' ? "Le format de l'adresse courriel est invalide." : 'Email address format is invalid.'],
    });

    result = v.safeParse(schema, { emailAddress: '123' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [lang === 'fr' ? "Le format de l'adresse courriel est invalide." : 'Email address format is invalid.'],
    });
  });

  it('should trim whitespace by default', () => {
    const schema = v.object({ emailAddress: emailAddressSchema() });

    const result = v.safeParse(schema, { emailAddress: '  test@example.com  ' }, { lang });
    assert(result.success);
    expect(result.output).toStrictEqual({ emailAddress: 'test@example.com' });
  });

  it('should validate maxLength', () => {
    const schema = v.object({ emailAddress: emailAddressSchema({ maxLength: 14 }) });

    let result = v.safeParse(schema, { emailAddress: 'test@test.com' }, { lang }); // Short, valid email
    assert(result.success);
    expect(result.output).toStrictEqual({ emailAddress: 'test@test.com' });

    result = v.safeParse(schema, { emailAddress: 'test@example.com' }, { lang }); // Normal length, will be trimmed and fail
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [
        lang === 'fr'
          ? "L'adresse courriel doit contenir au maximum 14 caractère(s)."
          : 'Email address must contain at most 14 character(s).',
      ],
    });
  });

  it('should validate format (valid email)', () => {
    const schema = v.object({ emailAddress: emailAddressSchema() });

    let result = v.safeParse(schema, { emailAddress: 'test@example.com' }, { lang });
    assert(result.success);
    expect(result.output).toStrictEqual({ emailAddress: 'test@example.com' });

    result = v.safeParse(schema, { emailAddress: 'test' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [lang === 'fr' ? "Le format de l'adresse courriel est invalide." : 'Email address format is invalid.'],
    });
  });

  it('should validate against a maximum of 254 characters, even if maxLength is higher', () => {
    const longEmail = 'a'.repeat(64) + '@' + generateDomainName(189); // 254 characters
    const tooLongEmail = 'b'.repeat(64) + '@' + generateDomainName(190); // 255 characters

    const schema = v.object({ emailAddress: emailAddressSchema({ maxLength: 300 }) });

    let result = v.safeParse(schema, { emailAddress: longEmail }, { lang });
    assert(result.success);
    expect(result.output).toStrictEqual({ emailAddress: longEmail });

    result = v.safeParse(schema, { emailAddress: tooLongEmail }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [
        lang === 'fr'
          ? "L'adresse courriel doit contenir au maximum 254 caractère(s)."
          : 'Email address must contain at most 254 character(s).', //
        lang === 'fr' ? "Le format de l'adresse courriel est invalide." : 'Email address format is invalid.',
      ],
    });
  });

  it('should use custom error messages', () => {
    const schema = v.object(
      {
        emailAddress: emailAddressSchema({
          errorMessages: {
            required_error: 'Custom required message',
            max_length_error: 'Custom max length message',
            format_error: 'Custom format message',
          },
          maxLength: 10,
        }),
      },
      'test',
    );

    let result = v.safeParse(schema, { emailAddress: undefined }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: ['Custom required message'],
    });

    result = v.safeParse(schema, { emailAddress: '' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [
        'Custom required message', //
        'Custom format message',
      ],
    });

    result = v.safeParse(schema, { emailAddress: null }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: ['Custom required message'],
    });

    result = v.safeParse(schema, { emailAddress: 123 }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: ['Custom required message'],
    });

    result = v.safeParse(schema, { emailAddress: 'test@example.com' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: ['Custom max length message'],
    });

    result = v.safeParse(schema, { emailAddress: 'test' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: ['Custom format message'],
    });
  });

  it('should correctly replace {{maximum}} in error messages', () => {
    const maxLength = 10;
    const schema = v.object({ emailAddress: emailAddressSchema({ maxLength }) });

    const result = v.safeParse(schema, { emailAddress: 'test@example.com' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      emailAddress: [
        lang === 'fr'
          ? "L'adresse courriel doit contenir au maximum 10 caractère(s)."
          : 'Email address must contain at most 10 character(s).',
      ],
    });
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
