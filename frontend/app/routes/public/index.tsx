import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { Menu, MenuItem } from '~/components/menu';
import { PageTitle } from '~/components/page-title';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/public/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'public'],
} as const satisfies RouteHandle;

export async function loader({ request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespace);
  return { documentTitle: t('public:index.page-title') };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <>
      <Menu>
        <MenuItem file="routes/protected/index.tsx">{t('public:index.navigate')}</MenuItem>
      </Menu>
      <PageTitle>{t('public:index.page-title')}</PageTitle>
      <p className="mt-8">{t('public:index.about')}</p>
    </>
  );
}
