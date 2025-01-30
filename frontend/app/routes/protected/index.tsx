import type { RouteHandle } from 'react-router';

import { faMagnifyingGlass, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { requireAuth } from '~/.server/utils/auth-utils';
import { Card, CardIcon, CardTag, CardTitle } from '~/components/card';
import { PageTitle } from '~/components/page-title';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);
  return { documentTitle: t('protected:index.page-title') };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <div className="mb-8">
      <PageTitle className="after:w-14">{t('protected:dashboard.sin-system')}</PageTitle>
      <h2 className="mt-10 mb-2 text-2xl font-bold text-slate-700">{t('protected:dashboard.get-started')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card file="routes/protected/person-case/privacy-statement.tsx">
          <CardIcon icon={faUserPlus}>
            <CardTitle title={t('protected:in-person.title')} highlight>
              {t('protected:in-person.description')}
            </CardTitle>
          </CardIcon>
        </Card>
        <Card disabled file="routes/protected/request.tsx" tag={<CardTag tag={t('protected:dashboard.coming-soon')} />}>
          <CardIcon icon={faMagnifyingGlass}>
            <CardTitle title={t('protected:enquiry-only.title')} highlight>
              {t('protected:enquiry-only.description')}
            </CardTitle>
          </CardIcon>
        </Card>
      </div>
      <h2 className="mt-10 mb-2 text-lg font-bold text-slate-700">{t('protected:dashboard.assigned-cases')}</h2>
      <p>{t('protected:dashboard.no-cases')}</p>
    </div>
  );
}
