import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/admin';

import { requireAllRoles } from '~/.server/utils/auth-utils';
import { PageTitle } from '~/components/page-title';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['admin']);
  const { t } = await getTranslation(request, handle.i18nNamespace);
  return { documentTitle: t('protected:index.page-title') };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export default function AdminDashboard() {
  const { t } = useTranslation(handle.i18nNamespace);
  return <PageTitle>{t('protected:admin.page-title')}</PageTitle>;
}
