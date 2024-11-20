import type { I18nLayoutRoute, I18nPageRoute, I18nRoute, I18nRouteFile } from '~/i18n-routes';

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
    throw new Error(`No route found for ${i18nRouteFile} (this should never happen)`);
  }

  return route;
}

/**
 * Type guard to determine if a route is an I18nLayoutRoute.
 */
export function isI18nLayoutRoute(obj: unknown): obj is I18nLayoutRoute {
  return obj !== null && typeof obj === 'object' && 'file' in obj && 'children' in obj;
}

/**
 * Type guard to determine if a route is an I18nPageRoute.
 */
export function isI18nPageRoute(obj: unknown): obj is I18nPageRoute {
  return obj !== null && typeof obj === 'object' && 'file' in obj && 'paths' in obj;
}
