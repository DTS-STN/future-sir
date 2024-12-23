import type { i18n, Namespace, TFunction } from 'i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { serverEnvironment } from '~/.server/environment';
import { i18nResources } from '~/.server/locales';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getLanguage } from '~/utils/i18n-utils';

/**
 * Gets a fixed translation function for a given language and namespace.
 *
 * @param languageOrRequest - The language code or Request object to get the language from.
 * @param namespace - The namespace to get the translation function for.
 * @returns A translation function for the given language and namespace.
 */
export async function getFixedT<NS extends Namespace>(
  languageOrRequest: Language | Request,
  namespace: NS,
): Promise<TFunction<NS>> {
  const isRequest = languageOrRequest instanceof Request;

  const language = isRequest //
    ? getLanguage(new URL(languageOrRequest.url))
    : languageOrRequest;

  if (language === undefined) {
    throw new AppError('No language found in request', ErrorCodes.NO_LANGUAGE_FOUND);
  }

  const i18n = await initI18next(language);
  return i18n.getFixedT(language, namespace);
}

/**
 * Creates and initializes an i18next instance for server-side rendering.
 */
export async function initI18next(language?: Language): Promise<i18n> {
  const { I18NEXT_DEBUG: debug } = serverEnvironment;

  const i18n = createInstance() //
    .use(initReactI18next);

  await i18n.init({
    debug: debug,
    defaultNS: false,
    fallbackLng: 'en',
    lng: language,
    preload: ['en', 'fr'],
    supportedLngs: ['en', 'fr'],
    ns: ['gcweb', 'protected', 'public'],
    resources: i18nResources,
    interpolation: { escapeValue: false },
  });

  return i18n;
}
