import type { Params } from 'react-router';
import { generatePath, redirect } from 'react-router';

import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Generate an i18n redirect response. Sets the status code and the `location` header. Defaults to "302 Found".
 *
 * This function constructs a redirect URL based on the provided route file, resource (used to determine the language),
 * and optional path parameters and search parameters.
 *
 * @param i18nRouteFile - The i18n route file, from i18n-routes.ts.
 * @param resource - The request, URL, or path from which to extract the language.
 * @param opts - An optional object containing configuration for the redirect.
 * @param opts.init - Optional initialization options for the `Response` object. See https://reactrouter.com/start/framework/navigating#redirect
 * @param opts.params - Optional path parameters.  Used to populate dynamic segments in the route path (e.g., `/:id` in a route definition). Should be an object where keys are the parameter names and values are their corresponding values.
 * @param opts.search - Optional search parameters (query string parameters).
 * @throws {AppError} If no language can be determined from the `resource` or if the provided `i18nRouteFile` is invalid.
 * @returns A `Response` object configured for redirection.
 */
export function i18nRedirect(
  i18nRouteFile: I18nRouteFile,
  resource: Request | URL | string,
  opts?: {
    init?: number | ResponseInit;
    params?: Params;
    search?: URLSearchParams;
  },
): Response {
  const { init, params, search } = opts ?? {};
  const language = getLanguage(resource);

  if (language === undefined) {
    throw new AppError('No language found in request', ErrorCodes.NO_LANGUAGE_FOUND);
  }

  const i18nPageRoute = getRouteByFile(i18nRouteFile, i18nRoutes);
  const path = generatePath(i18nPageRoute.paths[language], params);
  const url = search ? `${path}?${search.toString()}` : path;

  log.debug('Generating redirect response; url=[%s]', url);
  return redirect(url, init);
}
