import gcwebEn from '~/.server/locales/gcweb-en.json';
import gcwebFr from '~/.server/locales/gcweb-fr.json';
import protectedEn from '~/.server/locales/protected-en.json';
import protectedFr from '~/.server/locales/protected-fr.json';
import publicEn from '~/.server/locales/public-en.json';
import publicFr from '~/.server/locales/public-fr.json';

export const enI18nResources = {
  gcweb: gcwebEn,
  protected: protectedEn,
  public: publicEn,
} as const;

export const frI18nResources = {
  gcweb: gcwebFr,
  protected: protectedFr,
  public: publicFr,
} as const;

export const i18nResources = {
  en: enI18nResources,
  fr: frI18nResources,
} as const;
