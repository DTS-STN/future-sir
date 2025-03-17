/*
 *
 * This file defines the structure and types for internationalized (i18n) routes.
 * It provides a way to represent routes with different paths for different languages.
 *
 * The `i18nRoutes` constant holds the configuration for these routes, which are then
 * transformed into react-router `RouteConfigEntry` objects in `routes.ts`. This
 * separation allows the i18n route definitions to be imported and used in client-side
 * code when generating links.
 *
 */

/**
 * Represents a record of paths for different languages.
 * Key: Language code (e.g., 'en', 'fr').
 * Value: A path for that language (ex: /en/about or /fr/a-propos).
 */
type I18nPaths = Record<Language, string>;

/**
 * A utility typpe that extracts the file path from an I18nPageRoute type.
 * @template T - The type to extract the file from.
 */
type ExtractI18nRouteFile<T> = T extends I18nPageRoute ? T['file'] : never;

/**
 * A utility type that recursively extracts all file paths from an array of I18nRoute objects.
 * @template T - The type of the I18nRoute array.
 */
type ExtractI18nRouteFiles<T> = T extends I18nLayoutRoute
  ? ExtractI18nRouteFiles<T['children'][number]>
  : ExtractI18nRouteFile<T>;

/**
 * Represents a route that can be either a layout route or a page route.
 */
export type I18nRoute = I18nLayoutRoute | I18nPageRoute;

/**
 * Represents a layout route, which contains other routes as children.
 * @property file - The file path for the layout component.
 * @property children - An array of child I18nRoute objects.
 */
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };

/**
 * Represents a page route, which has specific paths for different languages.
 * @property id - A unique identifier for the route.
 * @property file - The file path for the page component.
 * @property paths - An I18nPaths object containing paths for different languages.
 */
export type I18nPageRoute = { id: string; file: string; paths: I18nPaths };

/**
 * Represents all file paths used in the i18n routes.
 */
export type I18nRouteFile = ExtractI18nRouteFiles<(typeof i18nRoutes)[number]>;

/**
 * Type guard to determine if a route is an I18nLayoutRoute.
 * @param obj - The object to check.
 * @returns `true` if the object is an I18nLayoutRoute, `false` otherwise.
 */
export function isI18nLayoutRoute(obj: unknown): obj is I18nLayoutRoute {
  return obj !== null && typeof obj === 'object' && 'file' in obj && 'children' in obj;
}

/**
 * Type guard to determine if a route is an I18nPageRoute.
 * @param obj - The object to check.
 * @returns `true` if the object is an I18nPageRoute, `false` otherwise.
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
  //
  // Protected routes (ie: authentication required)
  //
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
      {
        id: 'PROT-0003',
        file: 'routes/protected/request.tsx',
        paths: { en: '/en/protected/request', fr: '/fr/protege/requete' },
      },
      {
        file: 'routes/protected/multi-channel/layout.tsx',
        children: [
          {
            id: 'MCF-0001',
            file: 'routes/protected/multi-channel/pid-verification.tsx',
            paths: {
              en: '/en/protected/multi-channel/pid-verification',
              fr: '/fr/protege/multi-chaine/pid-verification',
            },
          },
          {
            id: 'MCF-0002',
            file: 'routes/protected/multi-channel/search-sin.tsx',
            paths: {
              en: '/en/protected/multi-channel/search-sin',
              fr: '/fr/protege/multi-chaine/search-sin',
            },
          },
          {
            id: 'MCF-0003',
            file: 'routes/protected/multi-channel/finalize-request.tsx',
            paths: {
              en: '/en/protected/multi-channel/finalize-request',
              fr: '/fr/protege/multi-chaine/finalize-request',
            },
          },
          {
            id: 'MCF-0004',
            file: 'routes/protected/multi-channel/send-validation.tsx',
            paths: {
              en: '/en/protected/multi-channel/send-validation',
              fr: '/fr/protege/multi-chaine/send-validation',
            },
          },
        ],
      },
      {
        file: 'routes/protected/person-case/layout.tsx',
        children: [
          {
            id: 'INP-0000',
            file: 'routes/protected/person-case/abandon.tsx',
            paths: {
              en: '/en/protected/person-case/abandon',
              fr: '/fr/protege/cas-personnel/abandonner',
            },
          },
          {
            id: 'INP-0001',
            file: 'routes/protected/person-case/privacy-statement.tsx',
            paths: {
              en: '/en/protected/person-case/privacy-statement',
              fr: '/fr/protege/cas-personnel/declaration-de-confidentialite',
            },
          },
          {
            id: 'INP-0002',
            file: 'routes/protected/person-case/primary-docs.tsx',
            paths: {
              en: '/en/protected/person-case/primary-documents',
              fr: '/fr/protege/cas-personnel/documents-primaires',
            },
          },
          {
            id: 'INP-0003',
            file: 'routes/protected/person-case/request-details.tsx',
            paths: {
              en: '/en/protected/person-case/request-details',
              fr: '/fr/protege/cas-personnel/faire-une-demande',
            },
          },
          {
            id: 'INP-0004',
            file: 'routes/protected/person-case/current-name.tsx',
            paths: {
              en: '/en/protected/person-case/current-name',
              fr: '/fr/protege/cas-personnel/nom-actuel',
            },
          },
          {
            id: 'INP-0005',
            file: 'routes/protected/person-case/personal-info.tsx',
            paths: {
              en: '/en/protected/person-case/personal-information',
              fr: '/fr/protege/cas-personnel/informations-personnelles',
            },
          },
          {
            id: 'INP-0006',
            file: 'routes/protected/person-case/secondary-doc.tsx',
            paths: {
              en: '/en/protected/person-case/secondary-document',
              fr: '/fr/protege/cas-personnel/document-secondaire',
            },
          },
          {
            id: 'INP-0007',
            file: 'routes/protected/person-case/birth-details.tsx',
            paths: {
              en: '/en/protected/person-case/birth-details',
              fr: '/fr/protege/cas-personnel/details-de-naissance',
            },
          },
          {
            id: 'INP-0008',
            file: 'routes/protected/person-case/parent-details.tsx',
            paths: {
              en: '/en/protected/person-case/parent-details',
              fr: '/fr/protege/cas-personnel/details-des-parents',
            },
          },
          {
            id: 'INP-0009',
            file: 'routes/protected/person-case/previous-sin.tsx',
            paths: {
              en: '/en/protected/person-case/previous-sin',
              fr: '/fr/protege/cas-personnel/previous-sin',
            },
          },
          {
            id: 'INP-0010',
            file: 'routes/protected/person-case/contact-information.tsx',
            paths: {
              en: '/en/protected/person-case/contact-information',
              fr: '/fr/protege/cas-personnel/contact-information',
            },
          },
          {
            id: 'INP-0011',
            file: 'routes/protected/person-case/review.tsx',
            paths: {
              en: '/en/protected/person-case/review',
              fr: '/fr/protege/cas-personnel/revision',
            },
          },
        ],
      },
      {
        id: 'PROT-0016',
        file: 'routes/protected/multi-channel/sin-confirmation.tsx',
        paths: {
          en: '/en/protected/multi-channel/sin-confirmation',
          fr: '/fr/protege/multi-canal/confirmation-de-nas',
        },
      },
    ],
  },
  //
  // Publicly accessable routes (ie: no authentication required)
  //
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
