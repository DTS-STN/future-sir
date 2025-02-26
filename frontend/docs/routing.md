# Internationalization (i18n) routing in Future SIR

## Overview

This document provides an overview of how internationalization (i18n) routing is
implemented in Future SIR. The application supports bilingual routes (English
and French) and uses a structured approach to manage these routes.

## Route definitions

Internationalized routes are defined in the `app/i18n-routes.ts` file. This file
contains an array of route objects, each representing either a layout route or a
page route.

### Layout route

A layout route contains other routes as children. It is represented by the
`I18nLayoutRoute` type:

```ts
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
```

### Page route

A page route has a unique id and specific paths for different languages. It is
represented by the `I18nPageRoute` type:

```ts
export type I18nPageRoute = { id: string; file: string; paths: I18nPaths };
```

## Example

Here is an example of how routes are defined:

```ts
export const i18nRoutes = [
  {
    file: 'routes/layout.tsx',
    children: [
      {
        id: 'ROUTE-0001',
        file: 'routes/index.tsx',
        paths: { en: '/en', fr: '/fr' },
      },
    ],
  },
];
```

# Route configuration in React Router

The `app/routes.ts` file imports and converts the i18n route definitions into a
format that can be used by React Router.

The reason for keeping the i18 routes in a separate `i18n-routes.ts` file,
instead of including it in the React Router `routes.ts` file, is to allow
importing of the i18n routes when building links and redirects via the route id.

### i18nRoute → RouteConfigEntry conversion function

The `toRouteConfigEntries()` function in `routes.ts` recursively converts an
array of `I18nRoute` objects into an array of `RouteConfigEntry` objects that
can be used by React Router.

## i18n redirects

The `i18nRedirect()` function in `app/.server/utils/route-utils.ts` generates a
redirect response based on the provided route file, resource, and some optional
parameters. This makes it possible to redirect to the correct url for the
current language.

## Other utility functions

Several utility functions are used to manage i18n routing:

- `getLanguage()`: returns the language from the given request, URL, or path.
- `findRouteByFile()`: recursively searches for a route matching the given file within a structure of i18n routes.
- `findRouteByPath()`: recursively searches for a route matching the given pathname within a structure of i18n routes.
- `getRouteByFile()`: recursively searches for a route matching the given file within a structure of i18n routes and throws an error if no route is found.
- `getRouteByPath()`: recursively searches for a route matching the given pathname within a structure of i18n routes and throws an error if no route is found.

## Language switching

The application provides a `<LanguageSwitcher>` component to facilitate
switching between languages. This component is typically used in the navigation
bar or other prominent locations to allow users to toggle between English and
French. During a language toggle, the url search params and path params are
retained.

### Implementation

The `<LanguageSwitcher>` component uses the `useLanguage()` hook to determine the
current language and its alternate language. It then generates a link to the
same route in the alternate language.

### `useLanguage()` hook

The `useLanguage()` hook is responsible for determining the current language and
providing the alternate language. It returns an object with `currentLanguage`
and `altLanguage` properties.
