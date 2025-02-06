import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';

describe('stringToIntegerSchema', () => {
  it('should parse a valid integer string', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, '123');
    assert(result.success === true);
    expect(result.output).toBe(123);
  });

  it('should parse a string with spaces', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, ' 123 ');
    assert(result.success === true);
    expect(result.output).toBe(123);
  });

  it('should fail to parse a non-integer string', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, 'abc');
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: ['Invalid integer: Received NaN'],
    });
  });

  it('should fail to parse an empty string', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, '');
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: ['Invalid length: Expected !0 but received 0'],
    });
  });

  it('should fail to parse a string with special characters', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, '123$');
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: ['Invalid integer: Received NaN'],
    });
  });

  it('should fail to parse a string with special characters', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, Math.PI.toString());
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: [`Invalid integer: Received ${Math.PI}`],
    });
  });

  it('should fail to parse a non string', () => {
    const schema = stringToIntegerSchema();
    const result = v.safeParse(schema, Math.PI);
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: [`Invalid type: Expected string but received ${Math.PI}`],
    });
  });
});
