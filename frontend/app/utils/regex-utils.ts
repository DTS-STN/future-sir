/**
 * Regular expression patterns.
 * @readonly
 */
export const REGEX_PATTERNS = {
  ALPHA_ONLY: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  DIGIT_ONLY: /^\d+$/,
  NON_DIGIT: /^\D+$/,
} as const satisfies Record<string, RegExp>;
