import type { RouteModules } from 'react-router';

/* eslint-disable no-var */

/**
 * Augment the `global` namespace with our custom global type definitions.
 */
declare global {
  /**
   * The application's supported languages: English and French.
   */
  type Language = 'en' | 'fr';

  /**
   * A simple logger interface.
   */
  type Logger = {
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };

  /**
   * React Router adds the route modules to global
   * scope, but doesn't declare them anywhere.
   */
  var __reactRouterRouteModules: RouteModules;

  /**
   * LogFactory global class is initialized in:
   *
   * - express.server.mjs (serverside)
   * - entry.client.tsx (clientside)
   */
  var LogFactory: {
    getLogger(category: string): Logger;
  };
}

export {};
