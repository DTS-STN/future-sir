import type { RouteConfigEntry } from '@react-router/dev/routes';
import { index, layout, route } from '@react-router/dev/routes';

// important: we cannot use aliased imports (~/) here 🤷
import type { I18nPageRoute, I18nRoute } from './i18n-routes';
import { i18nRoutes } from './i18n-routes';
import { isI18nPageRoute } from './utils';

/**
 * Generates an array of route config entries for different languages
 * based on a given file and i18n paths.
 *
 * @param i18nPageRoute - The i18n route to generate the route config entry from.
 * @returns An array of route config entries.
 */
function i18nPageRoutes(i18nPageRoute: I18nPageRoute): RouteConfigEntry[] {
  return Object.entries(i18nPageRoute.paths).map(([language, path]) => {
    return route(path, i18nPageRoute.file, { id: path });
  });
}

/**
 * Recursive function that converts an I18nRoute[] to a RouteConfigEntry[]
 * that can be used by React Router.
 *
 * @param routes - The array of i18n route definitions.
 * @returns An array of React Router route configuration entries.
 */
export function toRouteConfigEntries(routes: I18nRoute[]): RouteConfigEntry[] {
  return routes.flatMap((route) => {
    return isI18nPageRoute(route)
      ? i18nPageRoutes(route) //
      : layout(route.file, toRouteConfigEntries(route.children));
  });
}

export default [
  index('routes/index.tsx'),
  route('*', 'routes/not-found.tsx'),

  // API routes
  route('/api/readyz', 'routes/api/readyz.ts'),

  // i18n routes
  ...toRouteConfigEntries(i18nRoutes),
] satisfies RouteConfigEntry[];
