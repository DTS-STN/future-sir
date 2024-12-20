import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { HydratedRouter } from 'react-router/dom';

import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { initI18next } from '~/i18n-config.client';
import { getI18nNamespace } from '~/utils/i18n-utils';

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
