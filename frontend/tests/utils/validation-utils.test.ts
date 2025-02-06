import { describe, expect, it } from 'vitest';

import * as validationUtils from '~/utils/validation-utils';

describe('validationUtils', () => {
  describe('preprocess', () => {
    it('should replace empty strings with undefined', () => {
      const input = { a: '', b: 'b', c: 123 };
      const expected = { a: undefined, b: 'b', c: 123 };
      const result = validationUtils.preprocess(input);
      expect(result).toEqual(expected);
    });

    it('should handle empty input', () => {
      const input = {};
      const expected = {};
      const result = validationUtils.preprocess(input);
      expect(result).toEqual(expected);
    });
  });
});
