import 'react-router';

import type { Request } from 'express';
import type { Namespace } from 'i18next';

import type { ClientEnvironment, ServerEnvironment } from '~/.server/express/environment';
import type { GetLoggerFunction } from '~/.server/express/logging';

declare module 'react-router' {
  interface AppLoadContext {
    csrfToken: string;
    environment: {
      client: ClientEnvironment;
      server: ServerEnvironment;
    };
    logFactory: {
      getLogger: GetLoggerFunction;
    };
    nonce: string;
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
  interface RouteModules extends Record<string, RouteModule | undefined> {}
}

export {};
