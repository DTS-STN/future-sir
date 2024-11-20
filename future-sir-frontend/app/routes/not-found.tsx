import { Link } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/not-found';
import { PageTitle } from '~/components/page-title';
import { useLanguage } from '~/hooks/use-language';

export default function NotFound(props: Route.ComponentProps) {
  const { currentLanguage } = useLanguage();

  // prettier-ignore
  return currentLanguage
    ? <UnilingualNotFound {...props} />
    : <BilingualNotFound {...props} />;
}

function BilingualNotFound(props: Route.ComponentProps) {
  const { i18n, t } = useTranslation(['gcweb']);
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
                  alt={t('gcweb:header.govt-of-canada.text')}
                  property="logo"
                  width="300"
                  height="28"
                  decoding="async"
                />
                <span className="sr-only">
                  / <span lang="fr">{fr('gcweb:header.govt-of-canada.text')}</span>
                </span>
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
              <span>{en('gcweb:not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{en('gcweb:not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{en('gcweb:not-found.page-message')}</p>
          </div>
          <div id="french" lang="fr">
            <PageTitle className="my-8">
              <span>{fr('gcweb:not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{fr('gcweb:not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{fr('gcweb:not-found.page-message')}</p>
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
    </>
  );
}

function UnilingualNotFound(props: Route.ComponentProps) {
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
                  src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
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
          <span>{t('gcweb:not-found.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:not-found.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:not-found.page-message')}</p>
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
