import type { Params } from 'react-router';
import { generatePath, redirect } from 'react-router';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

/**
 * Generate an i18n redirect response. Sets the status code and the `location` header. Defaults to "302 Found".
 *
 * @param i18nRouteFile - The file name of the route to redirect to.
 * @param resource - The request, URL, or path to extract the language from.
 * @param params - Values for any parameters that are required in the URL.
 */
export function i18nRedirect(
  i18nRouteFile: I18nRouteFile,
  resource: Request | URL | string,
  opts: { params?: Params; init?: number | ResponseInit } = {},
): Response {
  const language = getLanguage(resource);

  if (language === undefined) {
    throw new AppError('No language found in request', ErrorCodes.NO_LANGUAGE_FOUND);
  }

  const route = getRouteByFile(i18nRouteFile, i18nRoutes);
  const pathname = generatePath(route.paths[language], opts.params);

  return redirect(pathname, opts.init);
}
