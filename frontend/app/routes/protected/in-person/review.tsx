import { Form, redirect } from 'react-router';

import type { Route } from './+types/review';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getStateRoute, loadMachineActor } from '~/routes/protected/in-person/state-machine-service.server';

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = loadMachineActor(context.session, request, 'review');

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
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

  throw redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  loadMachineActor(context.session, request, 'review');
  return { tabId: new URL(request.url).searchParams.get('tid') };
}

export default function Review({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Review</span>
        <span className="block text-sm">(tabid: {loaderData.tabId})</span>
      </PageTitle>
      <Form method="post">
        <div className="space-x-3">
          <Button name="action" value="cancel" variant="red" size="xl">
            Cancel
          </Button>
          <Button name="action" value="next" variant="primary" size="xl">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
}
