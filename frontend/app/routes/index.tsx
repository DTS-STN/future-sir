import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { ButtonLink } from '~/components/button-link';
import { AppLink } from '~/components/links';
import { getFixedT } from '~/i18n-config.server';

export const handle = {
  i18nNamespace: ['gcweb'],
} as const satisfies RouteHandle;

export async function loader() {
  const en = await getFixedT('en', handle.i18nNamespace);
  const fr = await getFixedT('fr', handle.i18nNamespace);
  return { documentTitle: `${en('header.govt-of-canada.text')} / ${fr('header.govt-of-canada.text')}` };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export default function Index() {
  const { i18n } = useTranslation(handle.i18nNamespace);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  return (
    <main role="main" className="bg-splash-page flex h-svh bg-cover bg-center">
      <div className="m-auto w-[300px] bg-white md:w-[400px] lg:w-[500px]">
        <div className="p-8">
          <h1 className="sr-only">
            <span lang="en">{en('gcweb:header.language-selection')}</span>
            <span lang="fr">{fr('gcweb:header.language-selection')}</span>
          </h1>
          <div className="w-11/12 lg:w-8/12">
            <AppLink to="https://www.canada.ca/en.html">
              <img
                className="h-8 w-auto"
                src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
                alt={`${en('gcweb:footer.gc-symbol')} / ${fr('gcweb:footer.gc-symbol')}`}
                width="300"
                height="28"
                decoding="async"
              />
            </AppLink>
          </div>
          <div className="mt-9 mb-2 grid grid-cols-2 gap-8 md:mx-4 lg:mx-8">
            <section lang="en" className="text-center">
              <h2 className="sr-only">{en('gcweb:header.govt-of-canada.text')}</h2>
              <ButtonLink file="routes/public/index.tsx" lang="en" variant="primary" size="lg" className="w-full">
                {en('gcweb:language')}
              </ButtonLink>
            </section>
            <section lang="fr" className="text-center">
              <h2 className="sr-only">{fr('gcweb:header.govt-of-canada.text')}</h2>
              <ButtonLink file="routes/public/index.tsx" lang="fr" variant="primary" size="lg" className="w-full">
                {fr('gcweb:language')}
              </ButtonLink>
            </section>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 bg-gray-200 p-8">
          <div className="w-7/12 md:w-8/12">
            <AppLink
              className="text-slate-700 hover:text-blue-700 hover:underline focus:text-blue-700"
              to={en('gcweb:footer.terms-conditions.href')}
              lang="en"
            >
              {en('gcweb:footer.terms-conditions.text')}
            </AppLink>
            <span className="text-gray-400"> • </span>
            <AppLink
              className="text-slate-700 hover:text-blue-700 hover:underline focus:text-blue-700"
              to={fr('gcweb:footer.terms-conditions.href')}
              lang="fr"
            >
              {fr('gcweb:footer.terms-conditions.text')}
            </AppLink>
          </div>
          <div className="w-5/12 md:w-4/12">
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
    </main>
  );
}
