import type { JSX } from 'react';

import type { RouteHandle } from 'react-router';

import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight, faMagnifyingGlass, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Card, CardDescription, CardHeader, CardIcon, CardTitle } from '~/components/card';
import { AppLink } from '~/components/links';
import { PageTitle } from '~/components/page-title';
import { getTranslation } from '~/i18n-config.server';
import type { I18nRouteFile } from '~/i18n-routes';
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

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <div className="mb-8">
      <PageTitle className="after:w-14">{t('protected:dashboard.sin-system')}</PageTitle>
      <h2 className="mt-10 mb-2 text-2xl font-bold text-slate-700">{t('protected:dashboard.get-started')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <CardLink
          file="routes/protected/person-case/privacy-statement.tsx"
          icon={faUserPlus}
          title={t('protected:in-person.title')}
          description={t('protected:in-person.description')}
        />
        <CardLink
          file="routes/protected/request.tsx"
          icon={faMagnifyingGlass}
          title={t('protected:enquiry-only.title')}
          description={t('protected:enquiry-only.description')}
        />
      </div>
      <h2 className="mt-10 mb-2 text-lg font-bold text-slate-700">{t('protected:dashboard.assigned-cases')}</h2>
      <p>{t('protected:dashboard.no-cases')}</p>
    </div>
  );
}

interface CardLinkProps {
  icon: IconProp;
  title: string;
  description: string;
  file: I18nRouteFile;
}

function CardLink({ icon, title, description, file }: CardLinkProps): JSX.Element {
  return (
    <Card asChild className="flex items-center gap-4 p-4 sm:p-6">
      <AppLink file={file}>
        <CardIcon icon={icon} />
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2">
            <span>{title}</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </AppLink>
    </Card>
  );
}
