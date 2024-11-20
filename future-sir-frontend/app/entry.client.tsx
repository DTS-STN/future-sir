import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { HydratedRouter } from 'react-router/dom';

import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { sprintf } from 'sprintf-js';

import { initI18next } from '~/i18n-config.client';
import { getI18nNamespace } from '~/utils/i18n-utils';

/**
 * A global LogFactory that can be used to log messages from anywhere on the client.
 */
globalThis.LogFactory = {
  getLogger(category: string): Logger {
    function formatMessage(message: string, args: unknown[]): string {
      const formattedMessage = sprintf(message, ...args);
      return `[${category}]: ${formattedMessage}`;
    }

    return {
      info: (message: string, ...args: unknown[]) => console.log(formatMessage(message, args)),
      error: (message: string, ...args: unknown[]) => console.error(formatMessage(message, args)),
      warn: (message: string, ...args: unknown[]) => console.warn(formatMessage(message, args)),
      debug: (message: string, ...args: unknown[]) => console.debug(formatMessage(message, args)),
    };
  },
};

function hydrateDocument(i18n: i18n): void {
  hydrateRoot(
    document,
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <HydratedRouter />
      </I18nextProvider>
    </StrictMode>,
  );
}

startTransition(() => {
  const routeModules = Object.values(globalThis.__reactRouterRouteModules);
  const routes = routeModules.filter((routeModule) => routeModule !== undefined);
  void initI18next(getI18nNamespace(routes)).then(hydrateDocument);
});
