import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { Outlet, useFetcher, useSearchParams } from 'react-router';

import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/layout';

import { Button } from '~/components/button';
import { useTabId } from '~/hooks/use-tab-id';
import { i18nRoutes } from '~/i18n-routes';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getRouteByFile } from '~/utils/route-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export default function Layout({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { i18n, t } = useTranslation(handle.i18nNamespace);
  const [searchParams] = useSearchParams();

  const fetcher = useFetcher<Info['actionData']>({ key: useId() });
  const tabId = useTabId({ reloadDocument: true }); // ensure we always have a tabId generated

  const abandonRoute = getRouteByFile('routes/protected/person-case/abandon.tsx', i18nRoutes);
  const abandonAction = i18n.language == 'fr' ? abandonRoute.paths.fr : abandonRoute.paths.en;

  if (!tabId) {
    return <FontAwesomeIcon className="m-8 animate-[spin_3s_infinite_linear] text-slate-800" icon={faSpinner} size="3x" />;
  }

  return (
    <>
      <fetcher.Form action={`${abandonAction}?${searchParams.toString()}`} className="float-right" method="post">
        <Button name="action" value="abandon" id="abandon-button" endIcon={faXmark} variant="link">
          {t('protected:person-case.abandon-button')}
        </Button>
      </fetcher.Form>

      <Outlet context={{ tabId }} />
    </>
  );
}
