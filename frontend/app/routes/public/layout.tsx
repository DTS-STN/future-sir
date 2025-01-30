import type { RouteHandle } from 'react-router';
import { Outlet } from 'react-router';

import { useTranslation } from 'react-i18next';

import { AppBar } from '~/components/app-bar';
import { AppLink } from '~/components/links';
import { MenuItem } from '~/components/menu';
import { PageDetails } from '~/components/page-details';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { useLanguage } from '~/hooks/use-language';
import { useRoute } from '~/hooks/use-route';

export const handle = {
  i18nNamespace: ['gcweb', 'public'],
} as const satisfies RouteHandle;

export default function Layout() {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation(['gcweb', 'public']);
  const { id: pageId } = useRoute();

  const { BUILD_DATE, BUILD_VERSION } = globalThis.__appEnvironment;

  return (
    <>
      <header className="print:hidden">
        <SkipNavigationLinks />
        <div id="wb-bnr">
          <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
            <AppLink to="https://canada.ca/">
              <img
                className="h-8 w-auto"
                src={`https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-${currentLanguage}.svg`}
                alt={t('gcweb:header.govt-of-canada.text')}
                width="300"
                height="28"
                decoding="async"
              />
            </AppLink>
          </div>
        </div>
        <AppBar>
          <MenuItem file="routes/protected/index.tsx">{t('public:index.navigate')}</MenuItem>
        </AppBar>
      </header>
      <main className="container">
        <Outlet />
        <PageDetails buildDate={BUILD_DATE} buildVersion={BUILD_VERSION} pageId={pageId} />
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
