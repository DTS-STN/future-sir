/**
 * Generate a random string using the provided characters, or alphanumeric characters if none are provided.
 */
export function randomString(len: number, allowedChars = '0123456789abcdefghijklmnopqrstuvwxyz') {
  const toRandomChar = () => allowedChars[Math.floor(Math.random() * allowedChars.length)];
  return Array(len).fill(undefined).map(toRandomChar).join('');
}

/**
 * @param value - The whole number percentage (i.e. multiplied by 100) to be formatted
 * @param locale - The Canadian locale to be used for formatting
 * @returns - The number formatted as a percentage in the givenlocale
 */
export function formatPercent(value: number, locale: Language): string {
  return Intl.NumberFormat(`${locale}-CA`, { style: 'percent' }).format(value / 100);
}

/**
 * Pads a number with zeros to the left to reach the specified length.
 * If the value is not a number or its length is greater than or equal to maxLength, it returns the value as a string.
 * @param value - The number to pad.
 * @param maxLength - The maximum length of the resulting string.
 * @returns The padded string or the value as a string if it's not a number or its length is already greater than or equal to maxLength.
 */
export function padWithZero(value: number, maxLength: number): string {
  if (Number.isNaN(value)) return value.toString();
  if (value.toString().length >= maxLength) return value.toString();
  return value.toString().padStart(maxLength, '0');
}

/**
 * Returns undefined for empty strings, whitespace, or undefined values.
 * Otherwise, it returns the original string if it's not empty.
 * @param str - The string to check, which may be undefined.
 * @returns The original string or undefined.
 */
export function trimToUndefined(str: string | undefined): string | undefined {
  return Number(str?.trim().length) > 0 ? str : undefined;
}
