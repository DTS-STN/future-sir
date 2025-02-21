import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';

import { Redacted } from '~/.server/utils/security-utils';

describe('Redacted', () => {
  describe('constructor', () => {
    it('can be constructed with factory function call', () => {
      expect(Redacted.make('secret')).toBeDefined();
    });

    it('can be constructed with new keyword', () => {
      expect(new Redacted('secret')).toBeDefined();
    });
  });

  describe('toJSON', () => {
    it('should return <redacted> when JSON.stringify() is used', () => {
      expect(
        JSON.stringify({
          secret: new Redacted('secret'),
          nested: { secret: new Redacted('secret') },
        }),
      ).toEqual('{"secret":"<redacted>","nested":{"secret":"<redacted>"}}');
    });
  });

  describe('toString', () => {
    it('should return <redacted> when toString() is called', () => {
      expect(new Redacted('secret').toString()).toEqual('<redacted>');
    });

    it('should return <redacted> when string interpolation is used', () => {
      expect(`value is ${new Redacted('secret')}`).toEqual('value is <redacted>');
    });
  });

  describe('value', () => {
    it('should return the original value when value() is called', () => {
      const original = { sensitive: 'data' };
      expect(new Redacted(original).value()).toEqual(original);
    });
  });

  describe('customInspectSymbol', () => {
    it('should return <redacted> when util.inspect() is called', () => {
      expect(inspect(new Redacted('secret'))).toEqual('<redacted>');
    });
  });
});
