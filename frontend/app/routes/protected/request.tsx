import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/request';

import { requireAllRoles } from '~/.server/utils/auth-utils';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);
  const { t } = await getTranslation(request, handle.i18nNamespace);
  return { documentTitle: t('protected:index.page-title') };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export default function Request() {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <div className="mb-8">
      <h2 className="mt-8 text-xl">{t('gcweb:app.form')}</h2>
      <hr className="my-4 text-slate-700" />
    </div>
  );
}
