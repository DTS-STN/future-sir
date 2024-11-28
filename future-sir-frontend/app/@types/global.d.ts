import type { RouteModules } from 'react-router';

import type { ClientEnvironment, ServerEnvironment } from '~/../server/environment.server.mjs';

/* eslint-disable no-var */

declare global {
  /**
   * The application's supported languages: English and French.
   */
  type Language = 'en' | 'fr';

  /**
   * A simple logger interface.
   */
  interface Logger {
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  }

  /**
   * Add the client-side environment to the window global namespace.
   */
  interface Window {
    environment: ClientEnvironment;
  }

  /**
   * LogFactory global class is initialized in:
   *
   * - express.server.mjs (serverside)
   * - entry.client.tsx (clientside)
   */
  var LogFactory: {
    getLogger: (category: string) => Logger;
  };

  /**
   * Add the server-side environment to globalThis.
   */
  var environment: ServerEnvironment;

  /**
   * React Router adds the route modules to global
   * scope, but doesn't declare them anywhere.
   */
  var __reactRouterRouteModules: RouteModules;
}

export {};
