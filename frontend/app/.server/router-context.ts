import type { AppLoadContext, unstable_RouterContext as RouterContext } from 'react-router';
import { unstable_createContext as createContext } from 'react-router';

import { singleton } from '~/.server/utils/instance-registry';

/**
 * Retrieves the application's router context instance.
 * If the context does not exist, it initializes a new one.
 *
 * see https://reactrouter.com/changelog#middleware-unstable
 */
export function getRouterContext(): RouterContext<AppLoadContext> {
  return singleton('routerContext', () => createContext<AppLoadContext>());
}
