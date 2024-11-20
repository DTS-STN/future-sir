import type { RouteHandle } from 'react-router';
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/root';
import { PageTitle } from '~/components/page-title';
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
    clientEnvironment: context.environment.client,
    nonce: context.nonce,
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
        <script
          nonce={loaderData.nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.__appEnvironment = ${JSON.stringify(loaderData.clientEnvironment)}`,
          }}
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

function BilingualErrorBoundary(props: Route.ErrorBoundaryProps) {
  const { i18n } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <header className="border-b-[3px] border-slate-700 print:hidden">
          <div id="wb-bnr">
            <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
              <div property="publisher" typeof="GovernmentOrganization">
                <Link to="https://canada.ca/" property="url">
                  <img
                    className="h-8 w-auto"
                    src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
                    alt={`${en('gcweb:header.govt-of-canada.text')} / ${fr('gcweb:header.govt-of-canada.text')}`}
                    property="logo"
                    width="300"
                    height="28"
                    decoding="async"
                  />
                </Link>
                <meta
                  property="name"
                  content={`${en('gcweb:header.govt-of-canada.text')} / ${fr('gcweb:header.govt-of-canada.text')}`}
                />
                <meta property="areaServed" typeof="Country" content="Canada" />
                <link property="logo" href="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg" />
              </div>
            </div>
          </div>
        </header>
        <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
          <div className="grid grid-cols-1 gap-6 py-2.5 sm:grid-cols-2 sm:py-3.5">
            <div id="english" lang="en">
              <PageTitle className="my-8">
                <span>{en('gcweb:server-error.page-title')}</span>
                <small className="block text-2xl font-normal text-neutral-500">{en('gcweb:server-error.page-subtitle')}</small>
              </PageTitle>
              <p className="mb-8 text-lg text-gray-500">{en('gcweb:server-error.page-message')}</p>
              <ul className="list-disc space-y-2 pl-10">
                <li>{en('gcweb:server-error.option-01')}</li>
              </ul>
            </div>
            <div id="french" lang="fr">
              <PageTitle className="my-8">
                <span>{fr('gcweb:server-error.page-title')}</span>
                <small className="block text-2xl font-normal text-neutral-500">{fr('gcweb:server-error.page-subtitle')}</small>
              </PageTitle>
              <p className="mb-8 text-lg text-gray-500">{fr('gcweb:server-error.page-message')}</p>
              <ul className="list-disc space-y-2 pl-10">
                <li>{fr('gcweb:server-error.option-01')}</li>
              </ul>
            </div>
          </div>
        </main>
        <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
          <div className="container flex items-center justify-end gap-6 py-2.5 sm:py-3.5">
            <div>
              <h2 className="sr-only">
                <span lang="en">{en('gcweb:footer.about-site')}</span> / <span lang="fr">{fr('gcweb:footer.about-site')}</span>
              </h2>
              <div>
                <img
                  src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
                  alt={`${en('gcweb:footer.gc-symbol')} / ${fr('gcweb:footer.gc-symbol')}`}
                  width={300}
                  height={71}
                  className="h-10 w-auto"
                />
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

export function UnilingualErrorBoundary(props: Route.ErrorBoundaryProps) {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation(['gcweb']);

  return (
    <html lang={currentLanguage}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <header className="border-b-[3px] border-slate-700 print:hidden">
          <div id="wb-bnr">
            <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
              <div property="publisher" typeof="GovernmentOrganization">
                <Link to="https://canada.ca/" property="url">
                  <img
                    className="h-8 w-auto"
                    src={`https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-${currentLanguage}.svg`}
                    alt={t('gcweb:header.govt-of-canada.text')}
                    property="logo"
                    width="300"
                    height="28"
                    decoding="async"
                  />
                </Link>
                <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
                <meta property="areaServed" typeof="Country" content="Canada" />
                <link property="logo" href="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg" />
              </div>
            </div>
          </div>
        </header>
        <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
          <PageTitle className="my-8">
            <span>{t('gcweb:server-error.page-title')}</span>
            <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:server-error.page-subtitle')}</small>
          </PageTitle>
          <p className="mb-8 text-lg text-gray-500">{t('gcweb:server-error.page-message')}</p>
          <ul className="list-disc space-y-2 pl-10">
            <li>{t('gcweb:server-error.option-01')}</li>
          </ul>
        </main>
        <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
          <div className="container flex items-center justify-end gap-6 py-2.5 sm:py-3.5">
            <div>
              <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
              <div>
                <img
                  src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
                  alt={t('gcweb:footer.gc-symbol')}
                  width={300}
                  height={71}
                  className="h-10 w-auto"
                />
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
