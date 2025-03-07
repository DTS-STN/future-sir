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
 * Retrieves a ResourceKey from a list of strings.
 * @param stringList - A list of strings, where each string may represent a Resource key.
 * @param index - An optional index to select a specific element (defaults to the first element).
 * @returns A ResourceKey from the string list, or undefined if no key is found.
 */
export function getSingleKey(
  stringList: [string, ...string[]] | undefined,
  index: number | undefined = 0,
): ResourceKey | undefined {
  return stringList?.at(index);
}
