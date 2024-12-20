import type { RouteModules } from 'react-router';

import type { ClientEnvironment } from '~/.server/environment';

/* eslint-disable no-var */

declare global {
  /**
   * The application's supported languages: English and French.
   */
  type Language = 'en' | 'fr';

  /**
   * Add the client-side environment to the global namespace.
   */
  var __appEnvironment: ClientEnvironment;

  /**
   * React Router adds the route modules to global
   * scope, but doesn't declare them anywhere.
   */
  var __reactRouterRouteModules: RouteModules;
}

export {};
