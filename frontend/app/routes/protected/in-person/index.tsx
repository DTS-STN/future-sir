import { Form, useOutletContext } from 'react-router';

import type { Route } from './+types/index';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { create } from '~/routes/protected/in-person/state-machine';

export function action({ context, params, request }: Route.ActionArgs) {
  return {};
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // if no tab id, return early and wait for one

  return {
    actor: create(context.session, tabId).start(),
  };
}

export default function InPersonFlow({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { tabId } = useOutletContext<{ tabId: string }>();

  return (
    <div className="space-y-3">
      <PageTitle>
        <span>In-person flow</span>
        <span className="block text-sm">(tabid: {tabId})</span>
      </PageTitle>
      <Form method="post">
        <Button variant="primary" size="xl">
          Start
        </Button>
      </Form>
    </div>
  );
}
