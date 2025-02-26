import { matchPath } from 'react-router';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nPageRoute, I18nRoute, I18nRouteFile } from '~/i18n-routes';
import { isI18nLayoutRoute, isI18nPageRoute } from '~/i18n-routes';

/**
 * Recursively searches for a route matching the given file within a structure of I18nRoutes.
 *
 * @param file - The file name of the route to search for.
 * @param routes - The array of I18nRoutes to search within.
 * @returns The I18nPageRoute that matches the given file name, or undefined if no route is found.
 */
export function findRouteByFile(file: string, routes: I18nRoute[]): I18nPageRoute | undefined {
  for (const route of routes) {
    if (isI18nLayoutRoute(route)) {
      const matchingChildRoute = findRouteByFile(file, route.children);

      if (matchingChildRoute) {
        return matchingChildRoute;
      }
    }

    if (isI18nPageRoute(route) && route.file === file) {
      return route;
    }
  }
}

/**
 * Recursively searches for a route matching the given pathname within a structure of I18nRoutes.
 *
 * @param pathname - The pathname of the route to search for.
 * @param routes - The array of I18nRoutes to search within.
 * @returns The I18nPageRoute that matches the given pathname, or undefined if no route is found.
 */
export function findRouteByPath(pathname: string, routes: I18nRoute[]): I18nPageRoute | undefined {
  const normalizedPathname = normalizePath(pathname);

  for (const route of routes) {
    if (isI18nLayoutRoute(route)) {
      const matchingChildRoute = findRouteByPath(pathname, route.children);
      if (matchingChildRoute) return matchingChildRoute;
    }

    if (isI18nPageRoute(route)) {
      const enMatches = matchPath(normalizePath(route.paths.en), normalizedPathname);
      const frMatches = matchPath(normalizePath(route.paths.fr), normalizedPathname);
      if (enMatches || frMatches) return route;
    }
  }
}

/**
 * Recursively searches for a route matching the given file within a structure of I18nRoutes.
 *
 * @param i18nRouteFile - The file name of the route to search for.
 * @param routes - The array of I18nRoutes to search within.
 * @returns The I18nPageRoute that matches the given file name.
 * @throws An error if no route is found for the given file name.
 */
export function getRouteByFile(i18nRouteFile: I18nRouteFile, routes: I18nRoute[]): I18nPageRoute {
  const route = findRouteByFile(i18nRouteFile, routes);

  if (route === undefined) {
    throw new AppError(`No route found for ${i18nRouteFile} (this should never happen)`, ErrorCodes.ROUTE_NOT_FOUND);
  }

  return route;
}

/**
 * Recursively searches for a route matching the given pathname within a structure of I18nRoutes.
 *
 * @param pathname - The pathname of the route to search for.
 * @param routes - The array of I18nRoutes to search within.
 * @returns The I18nPageRoute that matches the given file name.
 * @throws An error if no route is found for the given file name.
 */
export function getRouteByPath(pathname: string, routes: I18nRoute[]): I18nPageRoute {
  const route = findRouteByPath(pathname, routes);

  if (route === undefined) {
    throw new AppError(`No route found for ${pathname} (this should never happen)`, ErrorCodes.ROUTE_NOT_FOUND);
  }

  return route;
}

/**
 * Normalize a pathname by removing any trailing slashes.
 * @param pathname - The pathname to normalize.
 * @returns The normalized pathname.
 */
function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '');
}
