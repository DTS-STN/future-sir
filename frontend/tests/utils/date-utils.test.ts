import { describe, expect, it } from 'vitest';

import { isValidTimeZone } from '~/utils/date-utils';

describe('date-utils', () => {
  describe('isValidTimeZone', () => {
    it('should return true for valid timezones', () => {
      expect(isValidTimeZone('UTC')).toEqual(true);
      expect(isValidTimeZone('Canada/Newfoundland')).toEqual(true);
      expect(isValidTimeZone('Canada/Atlantic')).toEqual(true);
      expect(isValidTimeZone('Canada/Central')).toEqual(true);
      expect(isValidTimeZone('Canada/Mountain')).toEqual(true);
      expect(isValidTimeZone('Canada/Pacific')).toEqual(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimeZone('')).toEqual(false);
      expect(isValidTimeZone('Canada')).toEqual(false);
      expect(isValidTimeZone('MyTimezone!')).toEqual(false);
      expect(isValidTimeZone('Canada/Los_Angeles')).toEqual(false);
    });
  });
});
