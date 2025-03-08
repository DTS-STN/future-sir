import type { RouteModule } from 'react-router';

import type { Namespace, ResourceKey } from 'i18next';

/**
 * Returns the i81n namespace required by the given routes by examining the route's i18nNamespace handle property.
 * @see https://reactrouter.com/start/framework/route-module#handle
 */
export function getI18nNamespace(routes?: RouteModule[]): Namespace {
  const i18nNamespace = routes?.flatMap((route) => route.handle?.i18nNamespace ?? []);
  return Array.from(new Set(i18nNamespace));
}

/**
 * Returns the language from the given request, URL, or path.
 *
 * @param resource - The request, URL, or path to extract the language from.
 * @returns The language code (`en` or `fr`), or `undefined` if the language cannot be determined.
 */
export function getLanguage(resource: Request | URL | string): Language | undefined {
  switch (true) {
    case resource instanceof Request: {
      return getLanguageFromPath(new URL(resource.url).pathname);
    }

    case resource instanceof URL: {
      return getLanguageFromPath(resource.pathname);
    }

    default: {
      return getLanguageFromPath(resource);
    }
  }
}

/**
 * Returns the alternate language for the given input language.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function getAltLanguage(language: string): Language | undefined {
  switch (language) {
    case 'en': {
      return 'fr';
    }

    case 'fr': {
      return 'en';
    }

    default: {
      return undefined;
    }
  }
}

function getLanguageFromPath(pathname: string): Language | undefined {
  switch (true) {
    case pathname === '/en' || pathname.startsWith('/en/'): {
      return 'en';
    }

    case pathname === '/fr' || pathname.startsWith('/fr/'): {
      return 'fr';
    }

    default: {
      return undefined;
    }
  }
}

/**
 * Retrieves a `ResourceKey` from a given value, handling both single values and arrays.
 *
 * This function serves two purposes:
 *
 * 1. **Extracting a `ResourceKey`** – If given an array, it selects an element at the specified index.
 * 2. **Ensuring type compatibility with `i18next`** – Valibot returns plain strings when validation fails,
 *    which does not match the expected `ResourceKey` type in i18next. By returning a `ResourceKey`,
 *    this function effectively casts the input as a valid `ResourceKey`, preventing TypeScript errors.
 *
 * @param value - A single `ResourceKey` or an array of `ResourceKey` values.
 * @param index - The index to select from the array (defaults to the first element).
 * @returns A `ResourceKey` from the input or `undefined` if the value is not provided.
 */
export function getSingleKey<T extends ResourceKey>(value: T | [T, ...T[]] | undefined, index = 0): ResourceKey | undefined {
  return Array.isArray(value) ? value.at(index) : value;
}
