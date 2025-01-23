import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { lastNameSchema } from '~/.server/validation/last-name-schema';

describe.each([
  [undefined], //
  ['en' as const],
  ['fr' as const],
])("lastNameSchema with '%s' lang", (lang) => {
  it('should create a basic last name schema', () => {
    const schema = v.object({ lastName: lastNameSchema() });

    let result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Smith');

    result = v.safeParse(schema, { lastName: 123 }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: [lang === 'fr' ? 'Le nom de famille est requis.' : 'Last name is required.'],
    });
  });

  it('should trim whitespace by default', () => {
    const schema = v.object({ lastName: lastNameSchema() });

    const result = v.safeParse(schema, { lastName: '  Smith  ' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Smith');
  });

  it('should validate maxLength', () => {
    const schema = v.object({ lastName: lastNameSchema({ maxLength: 3 }) });

    let result = v.safeParse(schema, { lastName: 'Doe' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Doe');

    result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: [
        lang === 'fr'
          ? 'Le nom de famille doit contenir au maximum 3 caractère(s).'
          : 'Last name must contain at most 3 character(s).',
      ],
    });
  });

  it('should validate format (non-digit)', () => {
    const schema = v.object({ lastName: lastNameSchema() });

    let result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Smith');

    result = v.safeParse(schema, { lastName: 'Smith1' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: [
        lang === 'fr' ? 'Le nom de famille ne doit contenir aucun chiffre.' : 'Last name must not contain any digits.',
      ],
    });
  });

  it('should use custom error messages', () => {
    const schema = v.object({
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

    let result = v.safeParse(schema, { lastName: undefined }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom required message'],
    });

    result = v.safeParse(schema, { lastName: '' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom required message', 'Custom format message'],
    });

    result = v.safeParse(schema, { lastName: null }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom required message'],
    });

    result = v.safeParse(schema, { lastName: 123 }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom required message'],
    });

    result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom max length message'],
    });

    result = v.safeParse(schema, { lastName: 'Do3' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: ['Custom format message'],
    });
  });

  it('should correctly replace {{length}} in error messages', () => {
    const maxLength = 3;
    const schema = v.object({ lastName: lastNameSchema({ maxLength }) });

    const result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(!result.success);
    expect(v.flatten(result.issues).nested).toStrictEqual({
      lastName: [
        lang === 'fr'
          ? 'Le nom de famille doit contenir au maximum 3 caractère(s).'
          : 'Last name must contain at most 3 character(s).',
      ],
    });
  });

  it('should allow the lastName field to be optional', () => {
    const schema = v.object({ lastName: v.optional(lastNameSchema()) });

    let result = v.safeParse(schema, {}, { lang });
    assert(result.success);
    expect(result.output.lastName).toBeUndefined();

    result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Smith');
  });

  it('should allow the lastName field to be nullable', () => {
    const schema = v.object({ lastName: v.nullable(lastNameSchema()) });

    let result = v.safeParse(schema, { lastName: null }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBeNull();

    result = v.safeParse(schema, { lastName: 'Smith' }, { lang });
    assert(result.success);
    expect(result.output.lastName).toBe('Smith');
  });
});
