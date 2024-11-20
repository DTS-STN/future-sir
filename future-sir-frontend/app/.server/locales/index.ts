import gcwebEn from './gcweb-en.json';
import gcwebFr from './gcweb-fr.json';
import protectedEn from './protected-en.json';
import protectedFr from './protected-fr.json';
import publicEn from './public-en.json';
import publicFr from './public-fr.json';

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
