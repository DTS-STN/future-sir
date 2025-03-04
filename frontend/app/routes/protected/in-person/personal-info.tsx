import { Form, redirect } from 'react-router';

import type { Route } from './+types/personal-info';

import { LogFactory } from '~/.server/logging';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getStateRoute, loadMachineActor } from '~/routes/protected/in-person/state-machine.server';

const log = LogFactory.getLogger(import.meta.url);

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = loadMachineActor(context.session, request, 'personal-info');

  if (!actor) {
    log.warn('Could not find a machine snapshot session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/in-person/index.tsx', request, { search: new URLSearchParams({ restarted: 'true' }) });
  }

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

  throw redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // no tab id.. return early and wait for one

  if (!loadMachineActor(context.session, request, 'personal-info')) {
    log.warn('Could not find a machine snapshot session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/in-person/index.tsx', request, { search: new URLSearchParams({ restarted: 'true' }) });
  }

  return { tabId };
}

export default function PersonalInfo({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Personal info</span>
        <span className="block text-sm">(tabid: {loaderData?.tabId ?? '...'})</span>
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
