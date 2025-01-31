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
      {
        id: 'PROT-0003',
        file: 'routes/protected/request.tsx',
        paths: { en: '/en/protected/request', fr: '/fr/protege/requete' },
      },
      {
        id: 'PROT-0004',
        file: 'routes/protected/person-case/first-name.tsx',
        paths: { en: '/en/protected/person-case/first-name', fr: '/fr/protege/person-case/first-name' },
      },
      {
        id: 'PROT-0005',
        file: 'routes/protected/person-case/last-name.tsx',
        paths: { en: '/en/protected/person-case/last-name', fr: '/fr/protege/person-case/last-name' },
      },
      {
        id: 'PROT-0006',
        file: 'routes/protected/person-case/privacy-statement.tsx',
        paths: { en: '/en/protected/person-case/privacy-statement', fr: '/fr/protege/person-case/privacy-statement' },
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
              en: '/en/protected/in-person/primary-docsuments',
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
