/**
 * Converts a `true` or `false` Boolean literal to its corresponding string literal.
 *
 * @param value - A Boolean literal (`true` or `false`).
 * @returns A string literal `"true"` if the input is `true`, or `"false"` if the input is `false`.
 */

// Overload for when the input is explicitly `true`
export function boolToString(value: true): 'true';

// Overload for when the input is explicitly `false`
export function boolToString(value: false): 'false';

/**
 * Generic function implementation for converting any Boolean to a string.
 */
export function boolToString(value: boolean): 'true' | 'false' {
  // Return "true" for true, "false" for false
  return value ? 'true' : 'false';
}
