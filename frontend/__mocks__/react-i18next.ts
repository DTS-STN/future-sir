import { vi } from 'vitest';

/**
 * Transforms a key and optional options into a string representation.
 *
 * @param key - The key to be transformed.
 * @param options - An optional object containing additional parameters to include in the transformation.
 * @returns - A stringified representation of the key and options if options are provided; otherwise, the key itself.
 *
 * @example
 * // without options
 * tFunction('session-timeout');
 * // Returns: 'session-timeout'
 *
 * @example
 * // with options
 * tFunction('session-timeout', { timeout: 300 });
 * // Returns: '{"key":"session-timeout","options":{"timeout":300}}'
 */
function tFunction(key: string, options?: Record<string, unknown>) {
  return options ? JSON.stringify({ key, options }) : key;
}

/**
 * The vitest automock for react-i18next's useTranslation() hook.
 */
export const useTranslation = vi.fn(() => ({
  i18n: { getFixedT: () => tFunction },
  t: tFunction,
}));
