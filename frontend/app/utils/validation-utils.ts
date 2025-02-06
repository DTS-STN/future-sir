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
