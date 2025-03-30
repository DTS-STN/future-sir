import { describe, expect, it } from 'vitest';

import { extractValidationKey, preprocess } from '~/utils/validation-utils';

describe('validationUtils', () => {
  describe('extractValidationKey', () => {
    it('should return the single key if a single key is provided', () => {
      expect(extractValidationKey('key')).toBe('key');
    });

    it('should return the first key if an array of keys is provided', () => {
      expect(extractValidationKey(['key1', 'key2'])).toBe('key1');
    });

    it('should return the key at the specified index if an array of keys and an index are provided', () => {
      expect(extractValidationKey(['key1', 'key2', 'key3'], 1)).toBe('key2');
      expect(extractValidationKey(['key1', 'key2', 'key3'], 2)).toBe('key3');
    });

    it('should return undefined if no value is provided', () => {
      expect(extractValidationKey(undefined)).toBeUndefined();
    });

    it('should return undefined if index is out of bounds', () => {
      expect(extractValidationKey(['key1', 'key2'], 5)).toBeUndefined();
      expect(extractValidationKey(['key1', 'key2'], -1)).toBe('key2');
    });
  });

  describe('preprocess', () => {
    it('should replace empty strings with undefined', () => {
      const input = { a: '', b: 'b', c: 123 };
      const expected = { a: undefined, b: 'b', c: 123 };
      const result = preprocess(input);
      expect(result).toEqual(expected);
    });

    it('should handle empty input', () => {
      const input = {};
      const expected = {};
      const result = preprocess(input);
      expect(result).toEqual(expected);
    });
  });
});
