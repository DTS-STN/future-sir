import { describe, expect, it } from 'vitest';

import { getStartOfDayInTimezone, isPastInTimezone, isTodayInTimezone, isValidTimeZone } from '~/utils/date-utils';

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

  describe('isPastInTimezone', () => {
    const validTimeZone = 'Canada/Eastern';

    const validDates = ['2025-02-19', '2005-05-20', '1950-10-20'];

    const invalidDates = ['2176-02-19', '5678-05-20', '9850-10-20'];

    it.each(invalidDates)('should return [false] for invalid isPastInTimezone [%s]', (date) => {
      expect(isPastInTimezone(validTimeZone, date)).toEqual(false);
    });

    it.each(validDates)('should return [true] for valid isPastInTimezone [%s]', (date) => {
      expect(isPastInTimezone(validTimeZone, date)).toEqual(true);
    });
  });

  describe('isTodayInTimezone', () => {
    const validTimeZone = 'Canada/Eastern';

    const invalidDates = ['2005-05-20', '1950-10-20', '5678-05-20'];

    it.each(invalidDates)('should return [false] for invalid isTodayInTimezone [%s]', (date) => {
      expect(isTodayInTimezone(validTimeZone, date)).toEqual(false);
    });
  });

  describe('getStartOfDayInTimezone', () => {
    it('should return the start of the day in the specified timezone', () => {
      expect(getStartOfDayInTimezone('Canada/Eastern', '2000-01-01')) //
        .toEqual(new Date('2000-01-01T05:00:00.000Z'));
    });
  });
});
