import { Redacted } from 'effect';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import * as ValidationUtils from '~/utils/validation-utils';

describe('ValidationUtils', () => {
  describe('asBoolean', () => {
    it('should parse "true" to true', () => {
      const schema = z.string();
      const result = ValidationUtils.asBoolean(schema).parse('true');
      expect(result).toEqual(true);
    });

    it('should parse "True" to true', () => {
      const schema = z.string();
      const result = ValidationUtils.asBoolean(schema).parse('True');
      expect(result).toEqual(true);
    });

    it('should parse "false" to false', () => {
      const schema = z.string();
      const result = ValidationUtils.asBoolean(schema).parse('false');
      expect(result).toEqual(false);
    });

    it('should parse "" to false', () => {
      const schema = z.string();
      const result = ValidationUtils.asBoolean(schema).parse('');
      expect(result).toEqual(false);
    });
  });

  describe('asNumber', () => {
    it('should parse a string to a number', () => {
      const schema = z.string();
      const result = ValidationUtils.asNumber(schema).parse('123');
      expect(result).toEqual(123);
    });

    it('should throw an error for invalid input', () => {
      const schema = z.string();
      expect(() => ValidationUtils.asNumber(schema).parse('invalid')).toThrow();
    });
  });

  describe('isIn', () => {
    it('should return true if the value is in the record', () => {
      const record = { a: 1, b: 2 };
      const result = ValidationUtils.isIn(record)('a');
      expect(result).toEqual(true);
    });

    it('should return false if the value is not in the record', () => {
      const record = { a: 1, b: 2 };
      const result = ValidationUtils.isIn(record)('c');
      expect(result).toEqual(false);
    });
  });

  describe('preprocess', () => {
    it('should replace empty strings with undefined', () => {
      const input = { a: '', b: 'b', c: 123 };
      const expected = { a: undefined, b: 'b', c: 123 };
      const result = ValidationUtils.preprocess(input);
      expect(result).toEqual(expected);
    });

    it('should handle empty input', () => {
      const input = {};
      const expected = {};
      const result = ValidationUtils.preprocess(input);
      expect(result).toEqual(expected);
    });
  });

  describe('redact', () => {
    it('should redact a string', () => {
      const schema = z.string();
      const result = ValidationUtils.redact(schema).parse('secret');
      expect(result.toString()).toEqual('<redacted>');
      expect(Redacted.value(result)).toEqual('secret');
    });

    it('should redact a number', () => {
      const schema = z.number();
      const result = ValidationUtils.redact(schema).parse(123);
      expect(result.toString()).toEqual('<redacted>');
      expect(Redacted.value(result)).toEqual(123);
    });
  });
});
