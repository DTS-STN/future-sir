type I18nPaths = Record<Language, string>;
type ExtractI18nRouteFile<T> = T extends I18nPageRoute ? T['file'] : never;
type ExtractI18nRouteFiles<T, Filter = void> = T extends I18nLayoutRoute
  ? ExtractI18nRouteFiles<T['children'][number], Filter>
  : ExtractI18nRouteFile<T>;

export type I18nRoute = I18nLayoutRoute | I18nPageRoute;
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
export type I18nPageRoute = { id: string; file: string; paths: I18nPaths };
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
        id: 'PROT-0001',
        file: 'routes/protected/index.tsx',
        paths: { en: '/en/protected', fr: '/fr/protege' },
      },
      {
        id: 'PROT-0002',
        file: 'routes/protected/admin.tsx',
        paths: { en: '/en/protected/admin', fr: '/fr/protege/admin' },
      },
    ],
  },
  {
    file: 'routes/public/layout.tsx',
    children: [
      {
        id: 'PUBL-0001',
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      },
    ],
  },
] as const satisfies I18nRoute[];
