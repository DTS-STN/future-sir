import type { ResourceKey } from 'i18next';

/**
 * Normalizes validation error messages into a single i18next `ResourceKey`.
 *
 * Valibot validation errors are typically arrays of strings, but i18next
 * expects a single `ResourceKey`. This function extracts a key from the array
 * and effectively casts it as a `ResourceKey`, allowing the result to be safely
 * used with i18next while maintaining TypeScript compatibility.
 *
 * - If `value` is a single `ResourceKey` (ie: `string`), it is returned unchanged.
 * - If `value` is an array, the element at `index` (defaulting to `0`) is returned.
 * - If `value` is `undefined`, the function returns `undefined`.
 *
 * @param value - A `ResourceKey` (ie: `string`) or an array of `ResourceKey` values (typically from Valibot).
 * @param index - The position of the key to extract from an array (defaults to the first element).
 * @returns A single `ResourceKey` or `undefined` if no valid value is provided.
 */
export function extractValidationKey<T extends ResourceKey>(
  value: T | [T, ...T[]] | undefined,
  index?: number,
): ResourceKey | undefined {
  return Array.isArray(value) ? value.at(index ?? 0) : value;
}

/**
 * Preprocesses validation input.
 *
 * This function takes a record and returns a new record with empty string
 * values replaced with undefined. This is useful for handling optional
 * environment variables that may not be set.
 *
 * @param data - The record to be preprocessed.
 * @returns A new record with empty string values replaced with undefined.
 */
export function preprocess<K extends string | number | symbol, T>(data: Record<K, T>): Record<K, T | undefined> {
  const processedEntries = Object.entries(data) //
    .map(([key, val]) => [key, val === '' ? undefined : val]);

  return Object.fromEntries(processedEntries);
}
