import type { RouteHandle } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { Route } from './+types/root';
import { serverEnvironment } from './.server/environment';
import { BilingualErrorBoundary } from '~/components/canada.ca/bilingual-error-boundary';
import { UnilingualErrorBoundary } from '~/components/canada.ca/unilingual-error-boundary';
import { useLanguage } from '~/hooks/use-language';
import tailwindStyleSheet from '~/tailwind.css?url';

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
    {
      rel: 'stylesheet',
      href: tailwindStyleSheet,
      crossOrigin: 'anonymous',
    },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    nonce: context.nonce,
    revision: serverEnvironment.BUILD_REVISION,
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
          src={`/api/client-env?v=${loaderData.revision}`}
          suppressHydrationWarning={true}
        />
      </body>
    </html>
  );
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  const { currentLanguage } = useLanguage();

  // prettier-ignore
  return currentLanguage
    ? <UnilingualErrorBoundary {...props} />
    : <BilingualErrorBoundary {...props} />;
}
