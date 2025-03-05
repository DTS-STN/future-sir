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

/**
 * Formats an apartment/suite number with the address
 * TODO ::: GjB ::: I think this should be moved into the <Address> component
 */
function formatAddressLine(addressLine1: string | undefined, addressLine2: string | undefined): string | undefined {
  if (!addressLine1?.trim()) return addressLine2;
  if (!addressLine2?.trim()) return addressLine1;

  // check if addressLine2 is a simple alphanumeric suite number
  const isSuiteNumber = /^[a-z\d]+$/i.test(addressLine2.trim());

  return isSuiteNumber
    ? `${addressLine2.trim()}-${addressLine1.trim()}` //
    : `${addressLine1.trim()} ${addressLine2.trim()}`;
}

/**
 * TODO ::: GjB ::: I think this should be moved into the <Address> component
 */
type Address = {
  /**
   * Street name and house number
   */
  addressLine1?: string;
  /**
   * City name
   */
  city?: string;
  /**
   * Country name
   */
  country: string;
  /**
   * Province or state code
   */
  provinceState?: string;
  /**
   * Postal or ZIP code (optional)
   */
  postalZipCode?: string;
  /**
   * Apartment, suite, or unit number
   */
  addressLine2?: string;
};

/**
 * Formats an address string based on the provided arguments.
 * TODO ::: GjB ::: I think this should be moved into the <Address> component
 *
 * @param address - the address to be formatted
 * @param format - the format to use, where:
 *   - `standard`: The standard address format, with the address line, city, province/state, postal/zip code, and country.
 *   - `alternative`: An alternative address format, with the address line, city, province/state, postal/zip code, and country on separate lines.
 * @returns Formatted address string
 *
 * @example
 * ``` typescript
 * formatAddress({
 *   addressLine1: '123 Main St',
 *   addressLine2: 'Apt 4B',
 *   city: 'Anytown',
 *   provinceState: 'ON',
 *   postalZipCode: 'A1A 1A1',
 *   country: 'Canada',
 * });
 *
 * // Apt 4B-123 Main St
 * // Anytown ON  A1A 1A1
 * // Canada
 * ```
 * @example
 * ``` typescript
 * formatAddress({
 *   addressLine1: '456 Oak Ave',
 *   city: 'Springfield',
 *   postalZipCode: 'A1A 1A1',
 *   country: 'Canada',
 * });
 *
 * // 456 Oak Ave
 * // Springfield A1A 1A1
 * // Canada
 * ```
 * @example
 * ``` typescript
 * formatAddress({
 *   format: 'alternative',
 *   addressLine1: '789 Pine Ln',
 *   city: 'London',
 *   country: 'UK',
 * });
 *
 * // 789 Pine Ln
 * // London
 * // UK
 * ```
 */
export function formatAddress(address: Address, format?: 'standard' | 'alternative'): string {
  const { addressLine1, addressLine2, city, provinceState, postalZipCode, country } = address;

  const lines =
    format === 'alternative'
      ? [
          formatAddressLine(addressLine1, addressLine2),
          [city, provinceState].filter(Boolean).join(', '),
          postalZipCode,
          country,
        ]
      : [
          formatAddressLine(addressLine1, addressLine2),
          [city, provinceState, postalZipCode].filter(Boolean).join(' '),
          country,
        ];

  return lines
    .map((line) => line?.trim())
    .filter(Boolean)
    .join('\n');
}
