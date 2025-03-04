import { Outlet } from 'react-router';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { Route } from './+types/layout';

import { useTabId } from '~/hooks/use-tab-id';

export default function Layout({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const tabId = useTabId({ reloadDocument: true }); // ensure we always have a tabId generated
  if (!tabId) return <FontAwesomeIcon className="m-8" icon={faSpinner} size="5x" spinPulse={true} />;
  return <Outlet context={{ tabId }} />;
}
