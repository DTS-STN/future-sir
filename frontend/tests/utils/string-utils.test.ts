import { describe, expect, it } from 'vitest';

import { formatAddress, randomString } from '~/utils/string-utils';

describe('string-utils', () => {
  describe('randomString', () => {
    it('should generate a random string of specified length with the correct default character set', () => {
      const str = randomString(128);
      expect(str.length).toEqual(128);
      expect(str).toMatch(/[0-9a-z]+/);
    });

    it('should generate a random string of specified length with the correct specific character set', () => {
      const str = randomString(128, 'Future SIR');
      expect(str.length).toEqual(128);
      expect(str).toMatch(/[Future SIR]+/);
    });
  });

  describe('formatAddress', () => {
    it('should format a standard address with all fields', () => {
      const result = formatAddress({
        addressLine1: 'Apt 4B',
        addressLine2: '123 Main St',
        city: 'Anytown',
        provinceState: 'ON',
        postalZipCode: 'A1A 1A1',
        country: 'Canada',
      });

      expect(result).toEqual('Apt 4B 123 Main St\nAnytown ON  A1A 1A1\nCanada');
    });

    it('should format a standard address without addressLine2', () => {
      const result = formatAddress({
        addressLine1: '123 Main St',
        city: 'Anytown',
        provinceState: 'ON',
        postalZipCode: 'A1A 1A1',
        country: 'Canada',
      });

      expect(result).toEqual('123 Main St\nAnytown ON  A1A 1A1\nCanada');
    });

    it('should format a standard address with all fields, simple addressLine2', () => {
      const result = formatAddress({
        addressLine1: '123 Main St',
        addressLine2: '4B',
        city: 'Anytown',
        provinceState: 'ON',
        postalZipCode: 'A1A 1A1',
        country: 'Canada',
      });

      expect(result).toEqual('4B-123 Main St\nAnytown ON  A1A 1A1\nCanada');
    });

    it('should format a standard address without provinceState and postalZipCode', () => {
      const result = formatAddress({
        addressLine1: '789 Pine Ln',
        city: 'London',
        country: 'UK',
      });

      expect(result).toEqual('789 Pine Ln\nLondon\nUK');
    });

    it('should format an alternative address with all fields', () => {
      const result = formatAddress(
        {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'Anytown',
          provinceState: 'ON',
          postalZipCode: 'A1A 1A1',
          country: 'Canada',
        },
        'alternative',
      );

      expect(result).toEqual('123 Main St Apt 4B\nAnytown, ON\nA1A 1A1\nCanada');
    });

    it('should format an alternative address without provinceState and postalZipCode', () => {
      const result = formatAddress(
        {
          addressLine1: '789 Pine Ln',
          city: 'London',
          country: 'UK',
        },
        'alternative',
      );

      expect(result).toEqual('789 Pine Ln\nLondon\nUK');
    });

    it('should handle empty addressLine1 and addressLine2', () => {
      const result = formatAddress({
        city: 'London',
        country: 'UK',
      });

      expect(result).toEqual('London\nUK');
    });

    it('should handle empty addressLine1, addressLine2, and city', () => {
      const result = formatAddress({
        country: 'UK',
      });

      expect(result).toEqual('UK');
    });

    it('should handle empty provinceState', () => {
      const result = formatAddress({
        addressLine1: '123 Main St',
        city: 'Anytown',
        postalZipCode: 'A1A 1A1',
        country: 'Canada',
      });

      expect(result).toEqual('123 Main St\nAnytown  A1A 1A1\nCanada');
    });

    it('should format a standard address with complex suite name', () => {
      const result = formatAddress({
        addressLine1: '123 Main St',
        addressLine2: 'Suite 4B',
        city: 'Anytown',
        provinceState: 'ON',
        postalZipCode: 'A1A 1A1',
        country: 'Canada',
      });

      expect(result).toEqual('123 Main St Suite 4B\nAnytown ON  A1A 1A1\nCanada');
    });
  });
});
