import type { i18n, LanguageDetectorModule, Namespace } from 'i18next';
import i18Next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Initializes the global i18next for client-side rendering.
 *
 * @param namespace - The i18n namespace to load.
 * @returns The initialized i18n instance.
 */
export async function initI18next(namespace: Namespace): Promise<i18n> {
  // a languge detector that inspects the <html> tag
  const languageDetector = {
    type: 'languageDetector',
    detect: () => document.documentElement.lang,
  } satisfies LanguageDetectorModule;

  await i18Next
    .use(languageDetector)
    .use(initReactI18next)
    .use(I18NextHttpBackend)
    .init({
      ns: namespace, // TODO :: GjB :: is this needed?
      fallbackLng: 'en',
      defaultNS: false,
      preload: ['en', 'fr'],
      supportedLngs: ['en', 'fr'],
      backend: { loadPath: '/locales/{{ns}}-{{lng}}.json' },
      react: { useSuspense: false },
      interpolation: { escapeValue: false },
    });

  return i18Next;
}
