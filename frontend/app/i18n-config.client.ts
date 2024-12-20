import type { i18n, LanguageDetectorModule, Namespace } from 'i18next';
import i18Next from 'i18next';
import I18NextFetchBackend from 'i18next-fetch-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Initializes the global i18next for client-side rendering.
 *
 * @param namespace - The i18n namespace to load.
 * @returns The initialized i18n instance.
 */
export async function initI18next(namespace: Namespace): Promise<i18n> {
  const { BUILD_REVISION, I18NEXT_DEBUG } = globalThis.__appEnvironment;

  // a languge detector that inspects the <html> tag
  const languageDetector = {
    type: 'languageDetector',
    detect: () => document.documentElement.lang,
  } satisfies LanguageDetectorModule;

  await i18Next
    .use(languageDetector)
    .use(initReactI18next)
    .use(I18NextFetchBackend)
    .init({
      debug: I18NEXT_DEBUG,
      ns: namespace,
      fallbackLng: 'en',
      defaultNS: false,
      preload: ['en', 'fr'],
      supportedLngs: ['en', 'fr'],
      backend: { loadPath: `/api/translations?ns={{ns}}&lng={{lng}}&v=${BUILD_REVISION}` },
      interpolation: { escapeValue: false },
    });

  return i18Next;
}
