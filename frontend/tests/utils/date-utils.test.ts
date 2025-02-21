import { describe, expect, it, vi } from 'vitest';

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
    it('should return [true] for a date that is in the past', () => {
      vi.setSystemTime(new Date('2000-01-01'));
      expect(isPastInTimezone('UTC', new Date('1900-01-01'))).toEqual(true);
    });

    it('should return [false] for a date that is in the future', () => {
      vi.setSystemTime(new Date('2000-01-01'));
      expect(isPastInTimezone('UTC', new Date('2100-01-01'))).toEqual(false);
    });

    it('should return [false] for a date that is equal to the current date', () => {
      vi.setSystemTime(new Date('2000-01-01'));
      expect(isPastInTimezone('UTC', new Date('2000-01-01'))).toEqual(false);
    });
  });

  describe('isTodayInTimezone', () => {
    it('should return [false] for a date that is in the past', () => {
      vi.setSystemTime(new Date('2000-01-01'));
      expect(isTodayInTimezone('Canada/Eastern', new Date('1900-01-01'))).toEqual(false);
    });

    it('should return [false] for a date that is in the future', () => {
      vi.setSystemTime(new Date('2000-01-01'));
      expect(isTodayInTimezone('Canada/Eastern', new Date('2100-01-01'))).toEqual(false);
    });

    it('should return [true] for a date that is equal to the current date', () => {
      vi.setSystemTime(new Date('2000-01-01T05:00:00Z'));
      expect(isTodayInTimezone('Canada/Eastern', new Date('2000-01-01'))).toEqual(true);
    });

    it('should return [true] for a date that is within 24 hours of the current date', () => {
      vi.setSystemTime(new Date('2000-01-01T12:34:56Z'));
      expect(isTodayInTimezone('Canada/Eastern', new Date('2000-01-01'))).toEqual(true);
    });
  });

  describe('getStartOfDayInTimezone', () => {
    it('should return the start of the day in the specified timezone', () => {
      expect(getStartOfDayInTimezone('Canada/Eastern', '2000-01-01')) //
        .toEqual(new Date('2000-01-01T05:00:00.000Z'));
    });
  });
});
