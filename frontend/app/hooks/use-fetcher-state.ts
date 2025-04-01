import type { Fetcher } from 'react-router';

/**
 * Represents the state of a fetcher, indicating whether a submission is in progress
 * and the associated action (if available).
 */
type FetcherState =
  | {
      submitting: false;
      action: undefined;
    }
  | {
      submitting: true;
      action: string | undefined;
    };

/**
 * Determines the current fetcher state based on its status.
 *
 * @param fetcher - The fetcher object from react-router.
 * @param actionKey - The key used to retrieve the action from formData (default: 'action').
 * @returns The current fetcher state, indicating if a submission is in progress
 *          and the action being submitted (if available).
 */
export function useFetcherState(fetcher: Fetcher, actionKey = 'action'): FetcherState {
  return fetcher.state === 'idle'
    ? {
        submitting: false,
        action: undefined,
      }
    : {
        submitting: true,
        action: fetcher.formData?.get(actionKey)?.toString(),
      };
}
