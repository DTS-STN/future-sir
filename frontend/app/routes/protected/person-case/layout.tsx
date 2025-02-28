import { Outlet } from 'react-router';

import type { Route } from './+types/layout';

import { useTabId } from '~/hooks/use-tab-id';

export default function Layout({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const tabId = useTabId(); // ensure we always have a tabId generated
  return <Outlet context={{ tabId }} />;
}
