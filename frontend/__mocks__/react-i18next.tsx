import type { JSX } from 'react';

import type { TransProps } from 'react-i18next';
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
function tFunction(key?: string | string[], options?: Record<string, unknown>): string | undefined {
  const i18nKey = Array.isArray(key) ? key.join('.') : key;
  return options ? JSON.stringify({ key: i18nKey, options }) : i18nKey;
}

/**
 * Mock implementation for the `<Trans>` component.
 *
 * The `children` and `components` props are intentionally destructured and removed from rendering
 * to prevent circular JSON references when calling `tFunction()`.
 *
 * @param props - The props for the `<Trans>` component.
 * @returns  - A JSX element containing the i18nKey and various props.
 */
export const Trans = vi.fn(({ children, components, i18nKey, ...rest }: TransProps<string>): JSX.Element => {
  return <>{tFunction(i18nKey, rest)}</>;
});

/**
 * The vitest automock for react-i18next's useTranslation() hook.
 */
export const useTranslation = vi.fn(() => ({
  i18n: { getFixedT: () => tFunction },
  t: tFunction,
}));
