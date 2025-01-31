import { useEffect, useSyncExternalStore } from 'react';

import { useLocation, useNavigate } from 'react-router';

import { randomString } from '~/utils/string-utils';

export const SEARCH_PARAM_KEY = 'tid';
export const SESSION_STORAGE_KEY = 'tab-id';

/**
 * Generates a random tab identifier in the format `xx-0000`.
 * This id will uniquely identify different tabs within the same browser instance.
 */
function generateRandomId(): string {
  const prefix = randomString(2, 'abcdefghijklmnopqrstuvwxyz');
  const suffix = randomString(4, '0123456789');
  return `${prefix}-${suffix}`;
}

/**
 * Retrieves the current tab id from session storage or generates a new one if not found.
 * Ensures the tab id persists across page reloads within the same tab.
 */
function getSnapshot(sessionStorageKey: string): string {
  const id = window.sessionStorage.getItem(sessionStorageKey) ?? generateRandomId();
  window.sessionStorage.setItem(sessionStorageKey, id); // store the id to persist it across reloads
  return id;
}

/**
 * Subscribes to `storage` events to detect changes in session storage.
 * If the tab id in session storage changes (e.g., via tampering),
 * it triggers a re-render by calling the provided callback.
 */
function subscribe(sessionStorageKey: string, callback: () => void): () => void {
  const handler = ({ key }: StorageEvent): void => {
    if (key === sessionStorageKey) {
      callback(); // trigger a state update only if the session storage key changes
    }
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

type Options = {
  /**
   * Whether to automatically update the URL with the tab id as a query parameter.
   * Defaults to `true`.
   */
  navigate?: false;
  /**
   * The query parameter key used for storing the tab id in the URL.
   * Defaults to `'tid'`.
   */
  searchParamKey?: string;
  /**
   * The session storage key used for persisting the tab id.
   * Defaults to `'tab-id'`.
   */
  sessionStorageKey?: string;
};

/**
 * React hook that provides a unique, persistent identifier for the current browser tab.
 *
 * - The id persists across page reloads but resets when the tab is closed.
 * - If `navigate` is enabled (default: `true`), the hook ensures the id is present in the URL.
 * - The id is stored in `sessionStorage`, ensuring it remains unique per tab.
 * - Uses `useSyncExternalStore` to listen for changes in session storage and re-render accordingly.
 *
 * @param options Configuration options for customizing behavior.
 * @returns The unique tab id for the current browser tab, or `undefined` on first render.
 */
export function useTabId(options?: Options): string | undefined {
  const {
    navigate = true, //
    searchParamKey = SEARCH_PARAM_KEY,
    sessionStorageKey = SESSION_STORAGE_KEY,
  } = options ?? {};

  const { search } = useLocation();
  const navigateFn = useNavigate();

  const searchParamId = new URLSearchParams(search).get(searchParamKey);

  // fetch the current tab id from session storage
  // this will often be undefined on first access
  const id = useSyncExternalStore(
    (callback) => subscribe(sessionStorageKey, callback),
    () => getSnapshot(sessionStorageKey),
    () => searchParamId ?? undefined,
  );

  useEffect(() => {
    if (navigate) {
      if (id !== undefined && id !== searchParamId) {
        // if the tab id in session storage doesn't match the URL, update the URL
        const urlSearchParams = new URLSearchParams(search);
        urlSearchParams.set(searchParamKey, id);
        void navigateFn({ search: urlSearchParams.toString() }, { replace: true });
      }
    }
  }, [id, navigate, search]);

  return id;
}
