import type { RouteModule } from 'react-router';

import { describe, expect, it } from 'vitest';

import { getAltLanguage, getI18nNamespace, getLanguage, getSingleKey } from '~/utils/i18n-utils';

describe('i18n-utils', () => {
  describe('getI18nNamespace', () => {
    it('should return an empty namespace if no routes are provided', () => {
      expect(getI18nNamespace()).toEqual([]);
    });

    it('should return a unique namespace', () => {
      const routes: RouteModule[] = [
        { handle: { i18nNamespace: ['common', 'home'] } },
        { handle: { i18nNamespace: ['common', 'about'] } },
      ] as unknown as RouteModule[];

      expect(getI18nNamespace(routes)).toEqual(['common', 'home', 'about']);
    });

    it('should handle undefined i18nNamespace', () => {
      const routes: RouteModule[] = [
        { handle: { i18nNamespace: undefined } },
        { handle: undefined },
      ] as unknown as RouteModule[];

      expect(getI18nNamespace(routes)).toEqual([]);
    });
  });

  describe('getLanguage', () => {
    it.each([
      { input: 'http://example.com/en', expected: 'en' },
      { input: 'http://example.com/en/some-route', expected: 'en' },
      { input: 'http://example.com/fr', expected: 'fr' },
      { input: 'http://example.com/fr/some-route', expected: 'fr' },
      { input: 'http://example.com/some-route', expected: undefined },
    ])('should return $expected for request $input', ({ input, expected }) => {
      expect(getLanguage(new Request(input))).toEqual(expected);
    });

    it.each([
      { input: 'http://example.com/en', expected: 'en' },
      { input: 'http://example.com/en/some-route', expected: 'en' },
      { input: 'http://example.com/fr', expected: 'fr' },
      { input: 'http://example.com/fr/some-route', expected: 'fr' },
      { input: 'http://example.com/some-route', expected: undefined },
    ])('should return $expected for URL $input', ({ input, expected }) => {
      expect(getLanguage(new URL(input))).toEqual(expected);
    });

    it.each([
      { input: '/en', expected: 'en' },
      { input: '/en/some-route', expected: 'en' },
      { input: '/fr', expected: 'fr' },
      { input: '/fr/some-route', expected: 'fr' },
      { input: '/some-route', expected: undefined },
    ])('should return $expected for string $input', ({ input, expected }) => {
      expect(getLanguage(input)).toEqual(expected);
    });
  });

  describe('getAltLanguage', () => {
    it('should return the correct alternate language', () => {
      expect(getAltLanguage('en')).toEqual('fr');
      expect(getAltLanguage('fr')).toEqual('en');
      expect(getAltLanguage('es')).toBeUndefined();
    });
  });

  describe('getSingleKey', () => {
    it('should return the single key if a single key is provided', () => {
      expect(getSingleKey('key')).toBe('key');
    });

    it('should return the first key if an array of keys is provided', () => {
      expect(getSingleKey(['key1', 'key2'])).toBe('key1');
    });

    it('should return the key at the specified index if an array of keys and an index are provided', () => {
      expect(getSingleKey(['key1', 'key2', 'key3'], 1)).toBe('key2');
      expect(getSingleKey(['key1', 'key2', 'key3'], 2)).toBe('key3');
    });

    it('should return undefined if no value is provided', () => {
      expect(getSingleKey(undefined)).toBeUndefined();
    });

    it('should return undefined if index is out of bounds', () => {
      expect(getSingleKey(['key1', 'key2'], 5)).toBeUndefined();
      expect(getSingleKey(['key1', 'key2'], -1)).toBe('key2');
    });
  });
});
