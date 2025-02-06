import { describe, expect, it } from 'vitest';

import { boolToString } from '~/utils/boolean-utils';

describe('boolToString', () => {
  it('should return "true" when the input is true', () => {
    expect(boolToString(true)).toBe('true');
  });

  it('should return "false" when the input is false', () => {
    expect(boolToString(false)).toBe('false');
  });
});
