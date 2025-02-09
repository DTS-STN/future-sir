import { Form, redirect } from 'react-router';

import type { Route } from './+types/request-details';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getStateRoute, loadMachineActor } from '~/routes/protected/in-person/state-machine.server';

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = loadMachineActor(context.session, request, 'request-details');

  const formData = await request.formData();
  const action = formData.get('action');

  ///
  /// Simulated form data
  /// TODO :: GjB :: replace with actual form data

  const requestType = '00000000-0000-0000-0000-000000000000'; // some business id;
  const situationType = '00000000-0000-0000-0000-000000000000'; // some business id;

  ///
  ///
  ///

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
      actor.send({
        type: 'next',
        formData: {
          requestType,
          situationType,
        },
      });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const actor = loadMachineActor(context.session, request, 'request-details');
  return { tabId: new URL(request.url).searchParams.get('tid'), machineContext: actor.getSnapshot().context };
}

export default function RequestDetails({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Request details</span>
        <span className="block text-sm">(tabid: {loaderData.tabId})</span>
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
      <pre>{JSON.stringify(loaderData.machineContext, null, 2)}</pre>
    </div>
  );
}
