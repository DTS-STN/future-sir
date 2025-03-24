import 'react-router';

import type { Namespace } from 'i18next';

declare module 'react-router' {
  interface AppLoadContext {
    nonce: string;
    session: AppSession;
  }

  interface Future {
    // TODO ::: GjB ::: remove once middleware becomes stable
    // see https://reactrouter.com/changelog#middleware-unstable
    unstable_middleware: true;
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
   * Override the default React Router RouteModules
   * to include the new RouteModule type.
   */
  interface RouteModules extends Record<string, RouteModule | undefined> {}
}

export {};
