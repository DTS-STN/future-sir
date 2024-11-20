import type { RouteModules } from 'react-router';

import type { ClientEnvironment, ServerEnvironment } from '~/.server/express/environment.js';

/* eslint-disable no-var */

declare global {
  /**
   * The application's supported languages: English and French.
   */
  type Language = 'en' | 'fr';

  /**
   * Add the client-side environment to the window global namespace.
   */
  interface Window {
    __appEnvironment: ClientEnvironment;
  }

  /**
   * Add the server-side environment to the global namespace.
   */
  var __appEnvironment: ServerEnvironment;

  /**
   * React Router adds the route modules to global
   * scope, but doesn't declare them anywhere.
   */
  var __reactRouterRouteModules: RouteModules;
}

export {};
