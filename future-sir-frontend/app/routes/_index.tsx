import type { RouteHandle } from 'react-router';
import { Link } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/_index';
import { ButtonLink } from '~/components';

export const handle = {
  i18nNamespace: ['public'] as const,
} as const satisfies RouteHandle;

export function meta(metaArgs: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
}

export default function Index(componentProps: Route.ComponentProps) {
  const { i18n } = useTranslation(handle.i18nNamespace);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  return (
    <main role="main" className="flex h-svh bg-splash-page bg-cover bg-center" property="mainContentOfPage">
      <div className="m-auto w-[300px] bg-white md:w-[400px] lg:w-[500px]">
        <div className="p-8">
          <h1 className="sr-only">
            <span lang="en">{en('public:index.page-title')}</span>
            <span lang="fr">{fr('public:index.page-title')}</span>
          </h1>
          <div className="w-11/12 lg:w-8/12">
            <Link to="https://www.canada.ca/en.html" property="url">
              <img
                className="h-8 w-auto"
                src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
                alt={`${en('public:index.government-of-canada')} / ${fr('public:index.government-of-canada')}`}
                property="logo"
                width="300"
                height="28"
                decoding="async"
              />
            </Link>
          </div>
          <div className="mb-2 mt-9 grid grid-cols-2 gap-8 md:mx-4 lg:mx-8">
            <section lang="en" className="text-center">
              <h2 className="sr-only">{en('public:index.government-of-canada')}</h2>
              <ButtonLink file="routes/public/_index.tsx" lang="en" variant="primary" size="lg" className="w-full">
                {en('public:language')}
              </ButtonLink>
            </section>
            <section lang="fr" className="text-center">
              <h2 className="sr-only">{fr('public:index.government-of-canada')}</h2>
              <ButtonLink file="routes/public/_index.tsx" lang="fr" variant="primary" size="lg" className="w-full">
                {fr('public:language')}
              </ButtonLink>
            </section>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 bg-gray-200 p-8">
          <div className="w-7/12 md:w-8/12">
            <Link
              className="text-slate-700 hover:text-blue-700 hover:underline focus:text-blue-700"
              to={en('public:index.terms-and-conditions.href')}
              lang="en"
            >
              {en('public:index.terms-and-conditions.text')}
            </Link>
            <span className="text-gray-400"> • </span>
            <Link
              className="text-slate-700 hover:text-blue-700 hover:underline focus:text-blue-700"
              to={fr('public:index.terms-and-conditions.href')}
              lang="fr"
            >
              {fr('public:index.terms-and-conditions.text')}
            </Link>
          </div>
          <div className="w-5/12 md:w-4/12">
            <img
              src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
              alt={`${en('public:index.goc-symbol')} / ${fr('public:index.goc-symbol')}`}
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
