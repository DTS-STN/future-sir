import { Form, redirect } from 'react-router';

import type { Route } from './+types/index';

import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { createMachineActor, getStateRoute } from '~/routes/protected/in-person/state-machine-service.server';

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = createMachineActor(context.session, request);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'next': {
      actor.send({ type: 'next' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  return redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  return { tabId: new URL(request.url).searchParams.get('tid') };
}

export default function InPersonFlow({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>In-person flow</span>
        <span className="block text-sm">(tabid: {loaderData.tabId})</span>
      </PageTitle>
      <Form method="post">
        <Button name="action" value="next" variant="primary" size="xl">
          Start
        </Button>
      </Form>
    </div>
  );
}
