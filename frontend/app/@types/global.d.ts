import type { RouteModules } from 'react-router';

import type { Request } from 'express';

import type { ClientEnvironment } from '~/.server/environment';
import type { InstanceName } from '~/.server/utils/instance-registry';

/* eslint-disable no-var */

declare global {
  /**
   * The application's session type.
   */
  type AppSession = Request['session'];

  /**
   * The application's supported languages: English and French.
   */
  type Language = 'en' | 'fr';

  /**
   * The application's supported roles.
   */
  type Role = 'admin' | 'user';

  /**
   * Add the client-side environment to the global namespace.
   */
  var __appEnvironment: ClientEnvironment;

  /**
   * A holder for any application-scoped singletons.
   */
  var __instanceRegistry: Map<InstanceName, unknown>;

  /**
   * React Router adds the route modules to global
   * scope, but doesn't declare them anywhere.
   */
  var __reactRouterRouteModules: RouteModules;

  /**
   * Extract from `T` those types that are assignable to `U`, where `U` must exist in `T`.
   *
   * Similar to `Extract` but requires the extraction list to be composed of valid members of `T`.
   *
   * @see https://github.com/pelotom/type-zoo?tab=readme-ov-file#extractstrictt-u-extends-t
   */
  type ExtractStrict<T, U extends T> = T extends U ? T : never;

  /**
   * Drop keys `K` from `T`, where `K` must exist in `T`.
   *
   * @see https://github.com/pelotom/type-zoo?tab=readme-ov-file#omitstrictt-k-extends-keyof-t
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type OmitStrict<T, K extends keyof T> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;
}

export {};
