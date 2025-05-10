import type { RouteHandle } from 'react-router';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { config as fontAwesomeConfig } from '@fortawesome/fontawesome-svg-core';

import type { Route } from './+types/root';

import { clientEnvironment } from '~/.server/environment';
import {
  BilingualErrorBoundary,
  BilingualNotFound,
  UnilingualErrorBoundary,
  UnilingualNotFound,
} from '~/components/error-boundaries';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useLanguage } from '~/hooks/use-language';
import indexStyleSheet from '~/index.css?url';
import tailwindStyleSheet from '~/tailwind.css?url';

// see: https://docs.fontawesome.com/web/dig-deeper/security#content-security-policy
fontAwesomeConfig.autoAddCss = false;

export const handle = {
  i18nNamespace: ['gcweb'],
} as const satisfies RouteHandle;

export function links(): Route.LinkDescriptors {
  return [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap',
      crossOrigin: 'anonymous',
    },
    { rel: 'stylesheet', href: indexStyleSheet, crossOrigin: 'anonymous' },
    { rel: 'stylesheet', href: tailwindStyleSheet, crossOrigin: 'anonymous' },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    nonce: context.nonce,
    clientEnvRevision: clientEnvironment.revision,
  };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { currentLanguage } = useLanguage();

  return (
    <html lang={currentLanguage}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Outlet />
        <ScrollRestoration nonce={loaderData.nonce} />
        <Scripts nonce={loaderData.nonce} />
        <script //
          nonce={loaderData.nonce}
          src={`/api/client-env?v=${loaderData.clientEnvRevision}`}
          suppressHydrationWarning={true}
        />
      </body>
    </html>
  );
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  const { currentLanguage } = useLanguage();

  if (isNotFoundError(props.error)) {
    // prettier-ignore
    return currentLanguage
      ? <UnilingualNotFound {...props} />
      : <BilingualNotFound {...props} />;
  }

  // prettier-ignore
  return currentLanguage
    ? <UnilingualErrorBoundary {...props} />
    : <BilingualErrorBoundary {...props} />;
}

function isNotFoundError(error: Route.ErrorBoundaryProps['error']) {
  return isRouteErrorResponse(error) && error.status === HttpStatusCodes.NOT_FOUND;
}
