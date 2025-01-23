import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { firstNameSchema } from '~/.server/validation/first-name-schema';

describe.each([
  [undefined], //
  ['en' as const],
  ['fr' as const],
])("firstNameSchema with '%s' lang", (lang) => {
  it('should create a basic first name schema', () => {
    const schema = v.object({ firstName: firstNameSchema() });

    let result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('John');

    result = v.safeParse(schema, { firstName: 123 }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: [lang === 'fr' ? 'Le prénom est requis.' : 'First name is required.'],
    });
  });

  it('should trim whitespace by default', () => {
    const schema = v.object({ firstName: firstNameSchema() });

    const result = v.safeParse(schema, { firstName: '  John  ' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('John');
  });

  it('should validate maxLength', () => {
    const schema = v.object({ firstName: firstNameSchema({ maxLength: 3 }) });

    let result = v.safeParse(schema, { firstName: 'Joe' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('Joe');

    result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: [
        lang === 'fr'
          ? 'Le prénom doit contenir au maximum 3 caractère(s).'
          : 'First name must contain at most 3 character(s).',
      ],
    });
  });

  it('should validate format (non-digit)', () => {
    const schema = v.object({ firstName: firstNameSchema() });

    let result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('John');

    result = v.safeParse(schema, { firstName: 'John1' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: [lang === 'fr' ? 'Le prénom ne doit contenir aucun chiffre.' : 'First name must not contain any digits.'],
    });
  });

  it('should use custom error messages', () => {
    const schema = v.object({
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

    let result = v.safeParse(schema, { firstName: undefined }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom required message'],
    });

    result = v.safeParse(schema, { firstName: '' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom required message', 'Custom format message'],
    });

    result = v.safeParse(schema, { firstName: null }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom required message'],
    });

    result = v.safeParse(schema, { firstName: 123 }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom required message'],
    });

    result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom max length message'],
    });

    result = v.safeParse(schema, { firstName: 'Jo1' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: ['Custom format message'],
    });
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 3;
    const schema = v.object({ firstName: firstNameSchema({ maxLength }) });

    const result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      firstName: [
        lang === 'fr'
          ? 'Le prénom doit contenir au maximum 3 caractère(s).'
          : 'First name must contain at most 3 character(s).',
      ],
    });
  });

  it('should allow the firstName field to be optional', () => {
    const schema = v.object({ firstName: v.optional(firstNameSchema()) });

    let result = v.safeParse(schema, {}, { lang });
    assert(result.success);
    expect(result.output.firstName).toBeUndefined();

    result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('John');
  });

  it('should allow the firstName field to be nullable', () => {
    const schema = v.object({ firstName: v.nullable(firstNameSchema()) });

    let result = v.safeParse(schema, { firstName: null }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBeNull();

    result = v.safeParse(schema, { firstName: 'John' }, { lang });
    assert(result.success);
    expect(result.output.firstName).toBe('John');
  });
});
