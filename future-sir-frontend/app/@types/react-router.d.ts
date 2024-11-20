import 'react-router';

import type { Request } from 'express';
import type { Namespace } from 'i18next';

/**
 * Augment the `react-router` namespace with our custom route handle type definitions.
 */
declare module 'react-router' {
  interface AppLoadContext {
    session: Request['session'];
  }

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
