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
        id: 'MCF-0001',
        file: 'routes/protected/multi-channel/search-sin.tsx',
        paths: {
          en: '/en/protected/multi-channel/search-sin',
          fr: '/fr/protege/multi-chaine/search-sin',
        },
      },
      {
        file: 'routes/protected/person-case/layout.tsx',
        children: [
          {
            id: 'PROT-0004',
            file: 'routes/protected/person-case/privacy-statement.tsx',
            paths: {
              en: '/en/protected/person-case/privacy-statement',
              fr: '/fr/protege/cas-personnel/declaration-de-confidentialite',
            },
          },
          {
            id: 'PROT-0005',
            file: 'routes/protected/person-case/primary-docs.tsx',
            paths: {
              en: '/en/protected/person-case/primary-documents',
              fr: '/fr/protege/cas-personnel/documents-primaires',
            },
          },
          {
            id: 'PROT-0006',
            file: 'routes/protected/person-case/request-details.tsx',
            paths: {
              en: '/en/protected/person-case/request-details',
              fr: '/fr/protege/cas-personnel/faire-une-demande',
            },
          },
          {
            id: 'PROT-0007',
            file: 'routes/protected/person-case/current-name.tsx',
            paths: {
              en: '/en/protected/person-case/current-name',
              fr: '/fr/protege/cas-personnel/nom-actuel',
            },
          },
          {
            id: 'PROT-0008',
            file: 'routes/protected/person-case/personal-info.tsx',
            paths: {
              en: '/en/protected/person-case/personal-information',
              fr: '/fr/protege/cas-personnel/informations-personnelles',
            },
          },
          {
            id: 'PROT-0009',
            file: 'routes/protected/person-case/secondary-doc.tsx',
            paths: {
              en: '/en/protected/person-case/secondary-document',
              fr: '/fr/protege/cas-personnel/document-secondaire',
            },
          },
          {
            id: 'PROT-0010',
            file: 'routes/protected/person-case/birth-details.tsx',
            paths: {
              en: '/en/protected/person-case/birth-details',
              fr: '/fr/protege/cas-personnel/details-de-naissance',
            },
          },
          {
            id: 'PROT-0011',
            file: 'routes/protected/person-case/parent-details.tsx',
            paths: {
              en: '/en/protected/person-case/parent-details',
              fr: '/fr/protege/cas-personnel/details-des-parents',
            },
          },
          {
            id: 'PROT-0012',
            file: 'routes/protected/person-case/previous-sin.tsx',
            paths: {
              en: '/en/protected/person-case/previous-sin',
              fr: '/fr/protege/cas-personnel/previous-sin',
            },
          },
          {
            id: 'PROT-0013',
            file: 'routes/protected/person-case/contact-information.tsx',
            paths: {
              en: '/en/protected/person-case/contact-information',
              fr: '/fr/protege/cas-personnel/contact-information',
            },
          },
          {
            id: 'PROT-0014',
            file: 'routes/protected/person-case/review.tsx',
            paths: {
              en: '/en/protected/person-case/review',
              fr: '/fr/protege/cas-personnel/revision',
            },
          },
        ],
      },
      //
      // XState-driven in-person flow (poc)
      //
      {
        file: 'routes/protected/in-person/layout.tsx',
        children: [
          {
            id: 'IPF-0000',
            file: 'routes/protected/in-person/index.tsx',
            paths: {
              en: '/en/protected/in-person',
              fr: '/fr/protege/en-personne',
            },
          },
          {
            id: 'IPF-0001',
            file: 'routes/protected/in-person/privacy-statement.tsx',
            paths: {
              en: '/en/protected/in-person/privacy-statement',
              fr: '/fr/protege/en-personne/declaration-de-confidentialite',
            },
          },
          {
            id: 'IPF-0002',
            file: 'routes/protected/in-person/request-details.tsx',
            paths: {
              en: '/en/protected/in-person/request-details',
              fr: '/fr/protege/en-personne/details-de-la-demande',
            },
          },
          {
            id: 'IPF-0003',
            file: 'routes/protected/in-person/primary-docs.tsx',
            paths: {
              en: '/en/protected/in-person/primary-documents',
              fr: '/fr/protege/en-personne/documents-primaires',
            },
          },
          {
            id: 'IPF-0004',
            file: 'routes/protected/in-person/secondary-docs.tsx',
            paths: {
              en: '/en/protected/in-person/secondary-documents',
              fr: '/fr/protege/en-personne/documents-secondaires',
            },
          },
          {
            id: 'IPF-0005',
            file: 'routes/protected/in-person/name-info.tsx',
            paths: {
              en: '/en/protected/in-person/name-information',
              fr: '/fr/protege/en-personne/informations-nom',
            },
          },
          {
            id: 'IPF-0006',
            file: 'routes/protected/in-person/personal-info.tsx',
            paths: {
              en: '/en/protected/in-person/personal-information',
              fr: '/fr/protege/en-personne/informations-personnelles',
            },
          },
          {
            id: 'IPF-0007',
            file: 'routes/protected/in-person/birth-info.tsx',
            paths: {
              en: '/en/protected/in-person/birth-information',
              fr: '/fr/protege/en-personne/informations-naissance',
            },
          },
          {
            id: 'IPF-0008',
            file: 'routes/protected/in-person/parent-info.tsx',
            paths: {
              en: '/en/protected/in-person/parent-information',
              fr: '/fr/protege/en-personne/informations-parents',
            },
          },
          {
            id: 'IPF-0009',
            file: 'routes/protected/in-person/previous-sin-info.tsx',
            paths: {
              en: '/en/protected/in-person/previous-sin-information',
              fr: '/fr/protege/en-personne/informations-nas-precedent',
            },
          },
          {
            id: 'IPF-0010',
            file: 'routes/protected/in-person/contact-info.tsx',
            paths: {
              en: '/en/protected/in-person/contact-information',
              fr: '/fr/protege/en-personne/coordonnees',
            },
          },
          {
            id: 'IPF-0011',
            file: 'routes/protected/in-person/review.tsx',
            paths: {
              en: '/en/protected/in-person/review',
              fr: '/fr/protege/en-personne/revision',
            },
          },
        ],
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
