import type { RouteHandle } from 'react-router';
import { Outlet } from 'react-router';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { Route } from './+types/layout';

import { useTabId } from '~/hooks/use-tab-id';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export default function Layout({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const tabId = useTabId({ reloadDocument: true }); // ensure we always have a tabId generated

  if (!tabId) {
    return <FontAwesomeIcon className="m-8 animate-[spin_3s_infinite_linear] text-slate-800" icon={faSpinner} size="3x" />;
  }

  return (
    <>
      <Outlet context={{ tabId }} />
    </>
  );
}
