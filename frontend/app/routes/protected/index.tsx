import type { RouteHandle } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { requireAuth } from '~/.server/utils/auth-utils';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { Menu, MenuItem } from '~/components/menu';

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
      <Menu>
        <MenuItem to="/">{t('protected:index.home')}</MenuItem>
        <MenuItem file="routes/protected/admin.tsx">{t('protected:index.admin-dashboard')}</MenuItem>
        <MenuItem file="routes/public/index.tsx">{t('protected:index.public')}</MenuItem>
      </Menu>
      <p className="mt-8 text-lg">
        <Trans
          i18nKey="protected:index.resources"
          components={{ mark: <mark /> }}
          values={{ resource: t('protected:resource') }}
        />
      </p>
    </div>
  );
}
