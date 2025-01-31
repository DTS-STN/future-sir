import { useOutletContext } from 'react-router';

import type { Route } from './+types/privacy-statement';

import { PageTitle } from '~/components/page-title';

export function action({ context, params, request }: Route.ActionArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // if no tab id, return early and wait for one

  return {};
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // if no tab id, return early and wait for one

  return {};
}

export default function PrivacyStatement({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { tabId } = useOutletContext<{ tabId: string }>();

  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Privacy statement</span>
        <span className="block text-sm">(tabid: {tabId})</span>
      </PageTitle>
    </div>
  );
}
