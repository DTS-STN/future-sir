import 'react-router';

import type { Namespace } from 'i18next';

declare module 'react-router' {
  /**
   * Route handles should export an i18n namespace, if necessary.
   */
  interface RouteHandle {
    i18nNamespace?: Namespace;
  }

  /**
   * A route module exports an optional RouteHandle.
   */
  interface RouteModule {
    handle?: RouteHandle;
  }

  /**
   * Override the default remix RouteModules
   * to include the new RouteModule type.
   */
  interface RouteModules {
    [routeId: string]: RouteModule | undefined;
  }
}

export {};
