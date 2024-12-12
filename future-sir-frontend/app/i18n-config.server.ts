import type { i18n, Namespace, TFunction } from 'i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import gcwebEn from '~/../public/locales/gcweb-en.json';
import gcwebFr from '~/../public/locales/gcweb-fr.json';
import protectedEn from '~/../public/locales/protected-en.json';
import protectedFr from '~/../public/locales/protected-fr.json';
import publicEn from '~/../public/locales/public-en.json';
import publicFr from '~/../public/locales/public-fr.json';
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
    throw new Error('No language found in request');
  }

  const i18n = await initI18next();
  return i18n.getFixedT(language, namespace);
}

/**
 * Creates and initializes an i18next instance for server-side rendering.
 */
export async function initI18next(): Promise<i18n> {
  const { I18NEXT_DEBUG: debug } = globalThis.__appEnvironment;

  const i18n = createInstance() //
    .use(initReactI18next);

  await i18n.init({
    debug: debug,
    defaultNS: false,
    fallbackLng: 'en',
    preload: ['en', 'fr'],
    supportedLngs: ['en', 'fr'],
    ns: ['gcweb', 'protected', 'public'],
    resources: {
      en: {
        gcweb: gcwebEn,
        protected: protectedEn,
        public: publicEn,
      },
      fr: {
        gcweb: gcwebFr,
        protected: protectedFr,
        public: publicFr,
      },
    },
    interpolation: { escapeValue: false },
  });

  return i18n;
}
