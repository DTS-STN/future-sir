import { Form, redirect, useOutletContext } from 'react-router';

import type { Route } from './+types/request-details';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getRoute, load } from '~/routes/protected/in-person/state-machine';

export async function action({ context, params, request }: Route.ActionArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    return Response.json('Tab id is required; it must not be null or empty', { status: 400 });
  }

  const actor = load(context.session, tabId);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'prev': {
      actor.send({ type: 'prev' });
      break;
    }

    case 'cancel': {
      actor.send({ type: 'cancel' });
      break;
    }

    case 'next': {
      actor.send({ type: 'next' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getRoute(actor, { context, params, request }));
}

export default function RequestDetails({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { tabId } = useOutletContext<{ tabId: string }>();

  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Request details</span>
        <span className="block text-sm">(tabid: {tabId})</span>
      </PageTitle>
      <Form method="post">
        <div className="space-x-3">
          <Button name="action" value="cancel" variant="red" size="xl">
            Cancel
          </Button>
          <Button name="action" value="prev" variant="alternative" size="xl">
            Back
          </Button>
          <Button name="action" value="next" variant="primary" size="xl">
            Next
          </Button>
        </div>
      </Form>
    </div>
  );
}
