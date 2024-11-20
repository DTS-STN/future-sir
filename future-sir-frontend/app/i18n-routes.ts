type I18nPaths = Record<Language, string>;
type ExtractI18nRouteFile<T> = T extends I18nPageRoute ? T['file'] : never;
type ExtractI18nRouteFiles<T, Filter = void> = T extends I18nLayoutRoute
  ? ExtractI18nRouteFiles<T['children'][number], Filter>
  : ExtractI18nRouteFile<T>;

export type I18nRoute = I18nLayoutRoute | I18nPageRoute;
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
export type I18nPageRoute = { file: string; paths: I18nPaths };
export type I18nRouteFile = ExtractI18nRouteFiles<(typeof i18nRoutes)[number]>;

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

/**
 * Bilingual routes are declared in an I18nRoute[] object so the
 * filenames can be extracted and strongly typed as I18nPageRouteId
 *
 * These routes exist in a separate module from routes.ts so they can
 * be imported into clientside code without triggering side effects.
 */
export const i18nRoutes = [
  {
    file: 'routes/protected/layout.tsx',
    children: [
      {
        file: 'routes/protected/index.tsx',
        paths: { en: '/en/protected', fr: '/fr/protected' },
      },
    ],
  },
  {
    file: 'routes/public/layout.tsx',
    children: [
      {
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      },
    ],
  },
  //
  // dev-only routes
  //
  {
    file: 'routes/dev/error.tsx',
    paths: { en: '/en/error', fr: '/fr/error' },
  },
] as const satisfies I18nRoute[];
