import type { RouteHandle } from 'react-router';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { requireAuth } from '~/.server/utils/auth-utils';
import { ButtonLink } from '~/components/button-link';
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
      <h1 className="mt-8 text-2xl font-bold text-slate-700">
        <Trans
          i18nKey="protected:dashboard.sin-system"
          components={{ span: <span className="underline decoration-red-800 underline-offset-8" /> }}
        />
      </h1>
      <h2 className="mt-10 mb-2 text-lg font-bold text-slate-700">{t('protected:dashboard.assigned-cases')}</h2>
      <ButtonLink className="w-72" file="routes/protected/request.tsx">
        {t('gcweb:app.form')}
      </ButtonLink>
      <h2 className="mt-10 mb-2 text-2xl font-bold text-slate-700">{t('protected:dashboard.get-started')}</h2>
      <ButtonLink
        className="flex w-80 items-center justify-between rounded-none"
        file="routes/protected/person-case/first-name.tsx"
      >
        <span className="text-bold flex flex-col text-slate-700">
          <span className="text-xl">{t('protected:in-person.title')}</span>
          <span>{t('protected:in-person.description')}</span>
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
          <FontAwesomeIcon icon={faChevronRight} className="my-auto size-4 text-white" />
        </div>
      </ButtonLink>
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
