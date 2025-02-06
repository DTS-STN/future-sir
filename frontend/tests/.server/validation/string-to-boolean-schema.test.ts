import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';

describe('stringToBooleanSchema', () => {
  it('should parse "true" as true', () => {
    const schema = stringToBooleanSchema();
    const result = v.safeParse(schema, 'true');
    assert(result.success === true);
    expect(result.output).toBe(true);
  });

  it('should parse a string with spaces', () => {
    const schema = stringToBooleanSchema();
    const result = v.safeParse(schema, ' true ');
    assert(result.success === true);
    expect(result.output).toBe(true);
  });

  it('should parse "false" as false', () => {
    const schema = stringToBooleanSchema();
    const result = v.safeParse(schema, 'false');
    assert(result.success === true);
    expect(result.output).toBe(false);
  });

  it('should fail to parse an invalid boolean string', () => {
    const schema = stringToBooleanSchema();
    const result = v.safeParse(schema, 'invalid');
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: ['Invalid type: Expected ("true" | "false") but received "invalid"'],
    });
  });

  it('should fail to parse an empty string', () => {
    const schema = stringToBooleanSchema();
    const result = v.safeParse(schema, '');
    assert(result.success === false);
    expect(v.flatten(result.issues)).toEqual({
      root: ['Invalid length: Expected !0 but received 0'],
    });
  });
});
