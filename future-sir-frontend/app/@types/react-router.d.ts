import 'react-router';

import type { Request } from 'express';
import type { Namespace } from 'i18next';

import type { ClientEnvironment, ServerEnvironment } from '~/.server/environment';
import type { GetLoggerFunction } from '~/.server/logging';

declare module 'react-router' {
  interface AppLoadContext {
    clientEnvironment: ClientEnvironment;
    logFactory: { getLogger: GetLoggerFunction };
    nonce: string;
    session: Request['session'];
    serverEnvironment: ServerEnvironment;
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
