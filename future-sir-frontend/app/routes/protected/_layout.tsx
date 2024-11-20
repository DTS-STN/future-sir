import type { RouteHandle } from 'react-router';
import { Link, Outlet } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/_layout';

export const handle = {
  i18nNamespace: ['gcweb', 'protected'],
} as const satisfies RouteHandle;

export default function Layout(componentProps: Route.ComponentProps) {
  const { i18n } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  return (
    <>
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
              <link property="logo" href="/assets/wmms-blk.svg" />
            </div>
          </div>
        </div>
      </header>
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <Outlet />
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
    </>
  );
}
