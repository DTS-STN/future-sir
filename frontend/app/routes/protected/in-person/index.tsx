import { Form, redirect, useOutletContext } from 'react-router';

import type { Route } from './+types/index';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { create, getRoute } from '~/routes/protected/in-person/state-machine';

export async function action({ context, params, request }: Route.ActionArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    return Response.json('Tab id is required; it must not be null or empty', { status: 400 });
  }

  const actor = create(context.session, tabId);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'start': {
      actor.send({ type: 'next' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getRoute(actor, { context, params, request }));
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
        <Button name="action" value="start" variant="primary" size="xl">
          Start
        </Button>
      </Form>
    </div>
  );
}
