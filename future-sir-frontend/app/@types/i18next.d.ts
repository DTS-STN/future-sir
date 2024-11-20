import 'i18next';

import type gcwebEn from '~/../public/locales/gcweb-en.json';
import type gcwebFr from '~/../public/locales/gcweb-fr.json';
import type protectedEn from '~/../public/locales/protected-en.json';
import type protectedFr from '~/../public/locales/protected-fr.json';
import type publicEn from '~/../public/locales/public-en.json';
import type publicFr from '~/../public/locales/public-fr.json';

/**
 * Augment the `i18next` namespace with our custom resource type definitions.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    // prettier-ignore
    resources: {
      gcweb: typeof gcwebEn & typeof gcwebFr;
      protected: typeof protectedEn & typeof protectedFr;
      public: typeof publicEn & typeof publicFr;
    };
  }
}

export {};
