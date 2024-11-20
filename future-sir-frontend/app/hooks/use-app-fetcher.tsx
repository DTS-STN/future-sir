import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { useFetcher, useRouteLoaderData } from 'react-router';

import type { loader } from '~/root';

type UseAppFetcherParams = Parameters<typeof useFetcher>;

type AppFetcher = ReturnType<typeof useFetcher>;
type AppFetcherForm = ReturnType<typeof useFetcher>['Form'];
type AppFetcherSubmitFunction = ReturnType<typeof useFetcher>['submit'];

export function useAppFetcher<T>(params: UseAppFetcherParams = []): AppFetcher {
  const fetcher = useFetcher<T>(...params);
  const rootLoaderData = useRouteLoaderData<typeof loader>('root');
  const csrfToken = rootLoaderData?.csrfToken ?? '';

  /**
   * A wrapper around useFetcher()'s submit function that adds the CSRF token to the target parameter.
   */
  const appFetcherSubmitFunction: AppFetcherSubmitFunction = (target, options) => {
    if (target instanceof FormData) {
      target.set('_csrf', csrfToken);
    }

    if (target instanceof URLSearchParams) {
      target.set('_csrf', csrfToken);
    }

    if (target instanceof HTMLFormElement) {
      const formData = new FormData(target);
      formData.set('_csrf', csrfToken);
      return fetcher.submit(formData, options);
    }

    if (typeof target === 'object' && target !== null) {
      return fetcher.submit({ ...target, _csrf: csrfToken }, options);
    }

    return fetcher.submit(target, options);
  };

  /**
   * A wrapper around useFetcher()'s Form component that adds the CSRF token as a hidden input.
   */
  const AppFetcherForm = forwardRef<ElementRef<AppFetcherForm>, ComponentProps<AppFetcherForm>>(
    ({ children, ...props }, ref) => {
      return (
        <fetcher.Form method="POST" ref={ref} {...props}>
          <input type="hidden" name="_csrf" value={csrfToken} />
          {children}
        </fetcher.Form>
      );
    },
  );

  AppFetcherForm.displayName = 'FetcherForm';

  return { ...fetcher, submit: appFetcherSubmitFunction, Form: AppFetcherForm };
}
