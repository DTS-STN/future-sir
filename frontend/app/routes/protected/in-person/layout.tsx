import { Outlet } from 'react-router';

import type { Route } from './+types/layout';

import { StateMachineDebug } from '~/components/state-machine-debug';
import { useTabId } from '~/hooks/use-tab-id';
import { loadMachineActor } from '~/routes/protected/in-person/state-machine.server';

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // no tab id.. return early and wait for one

  const snapshot = loadMachineActor(context.session, request)?.getSnapshot();

  return {
    machineContext: snapshot?.context,
    metaObject: snapshot?.getMeta(),
  };
}

export default function Layout({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const tabId = useTabId(); // ensure we always have a tabId generated

  return (
    <>
      <Outlet context={{ tabId }} />
      <StateMachineDebug machineContext={loaderData?.machineContext} metaObject={loaderData?.metaObject} />
    </>
  );
}
