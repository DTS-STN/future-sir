import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/_index';
import { handle as parentHandle } from './_layout';
import { InlineLink } from '~/components';
import { getFixedT } from '~/i18n-config.server';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'public'],
} as const satisfies RouteHandle;

export async function loader({ request }: Route.LoaderArgs) {
  const t = await getFixedT(request, handle.i18nNamespace);

  return {
    meta: { documentTitle: t('public:index.page-title') },
  };
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: data.meta.documentTitle }];
}

export default function Index(componentProps: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <>
      <p>Resources loaded from: {t('public:resource')}</p>
      <p>
        <InlineLink file="routes/protected/_index.tsx">Navigate to protected page</InlineLink>
      </p>
    </>
  );
}
