import type { RouteHandle } from 'react-router';
import { Link, Outlet, redirect } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/layout';
import { InlineLink } from '~/components/inline-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageDetails } from '~/components/page-details';
import { useLanguage } from '~/hooks/use-language';

export const handle = {
  i18nNamespace: ['gcweb', 'protected'],
} as const satisfies RouteHandle;

export function loader({ context, request }: Route.LoaderArgs) {
  //
  // Simple forced-login PoC...
  //
  if (!context.session.authState) {
    const { pathname, search } = new URL(request.url);
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  return {
    name: context.session.authState.idTokenClaims?.name,
  };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation(['gcweb']);

  return (
    <>
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
            <LanguageSwitcher>{t('gcweb:language-switcher.alt-lang')}</LanguageSwitcher>
          </div>
        </div>
      </header>
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        {!!loaderData.name && (
          <div className="mt-4 text-right">
            <p>{loaderData.name.toString()}</p>
            <p>
              <InlineLink to="/auth/logout">Logout</InlineLink>
            </p>
          </div>
        )}
        <Outlet />
        <PageDetails />
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
    </>
  );
}
