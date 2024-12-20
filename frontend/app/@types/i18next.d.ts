import 'i18next';

import type { enI18nResources, frI18nResources } from '~/.server/locales';

/**
 * Augment the `i18next` namespace with our custom resource type definitions.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    // prettier-ignore
    resources: {
      gcweb: (typeof enI18nResources)['gcweb'] & (typeof frI18nResources)['gcweb'];
      protected: (typeof enI18nResources)['protected'] & (typeof frI18nResources)['protected'];
      public: (typeof enI18nResources)['public'] & (typeof frI18nResources)['public'];
    };
  }
}

export {};
