import { describe, expect, it } from 'vitest';

import { isValidTimeZone } from '~/utils/date-utils';

describe('date-utils', () => {
  describe('isValidTimeZone', () => {
    const invalidTimeZones = [
      '', //
      'Canada',
      'Canada/Los_Angeles',
      'MyTimeZone!!',
    ];

    const validTimeZones = [
      'Canada/Atlantic',
      'Canada/Central',
      'Canada/Mountain',
      'Canada/Newfoundland',
      'Canada/Pacific',
      'UTC',
    ];

    it.each(invalidTimeZones)('should return [false] for invalid time zone [%s]', (timeZone) => {
      expect(isValidTimeZone(timeZone)).toEqual(false);
    });

    it.each(validTimeZones)('should return [true] for valid time zone [%s]', (timeZone) => {
      expect(isValidTimeZone(timeZone)).toEqual(true);
    });
  });
});
