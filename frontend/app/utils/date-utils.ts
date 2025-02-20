import { padWithZero } from '~/utils/string-utils';

/**
 * Parses a date string in the format "YYYY-MM-DD" and returns an object with the parsed components.
 * @param date The date string to parse.
 * @returns An object containing the parsed components (year, month, day). Returns an empty object if parsing fails or if the date does not exist.
 */
export function extractDateParts(date: string): { year?: string; month?: string; day?: string } {
  const [yearStr, monthStr, dayStr] = date.split('-');

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return {};
  if (!dateExists(year, month - 1, day)) return {};

  return {
    year: padWithZero(year, 4),
    month: padWithZero(month, 2),
    day: padWithZero(day, 2),
  };
}

/**
 * Validates a date (year, month, day) if it exist.
 * @param year - The year as number to validate.
 * @param month - The month as number to validate.
 * @param day - The day as number to validate.
 * @returns A boolean - true if the date exists or false if the date does not exist.
 */
export function dateExists(year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

/**
 * Retrieve an array of months based on the provided locale and format.
 * @param locale - The locale to use for formatting the months.
 * @param format - The format for displaying the months.
 * @returns An array containing objects with month index and formatted month text.
 */
export function getLocalizedMonths(
  locale: string,
  format: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' | undefined = 'long',
): { index: number; text: string }[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: format, timeZone: 'UTC' });

  return Array.from({ length: 12 }, (_, i) => ({
    index: i + 1, // month index (1-based)
    text: formatter.format(Date.UTC(0, i, 1)), // formatted month name
  }));
}

/**
 * Checks if a given string is a valid time zone.
 *
 * see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 *
 * @param timeZone - The time zone string to validate.
 * @returns `true` if the time zone is valid, `false` if it is not
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
  } catch {
    return false;
  }

  return true;
}
